import { graphql, searchRepositories, contributorCount } from './github.mjs';
import { DISCOVERY, UNIVERSE_CAP, WINDOW_DAYS, RELEASE_WINDOW_DAYS } from './config.mjs';

const REPO_BATCH = 10;
const SEARCH_BATCH = 4; // 4 searches per repo -> 16 search nodes per query

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A single oversized batch can time out on GitHub's side. Rather than losing the whole run,
// split the batch and retry the halves; a batch of one that still fails is skipped.
async function resilientBatch(batch, fn, label) {
  try {
    return await fn(batch);
  } catch (err) {
    if (batch.length === 1) {
      console.warn(`  ! ${label} omitido para ${batch[0].fullName || batch[0].canonical}: ${err.message}`);
      return null;
    }
    const mid = Math.ceil(batch.length / 2);
    console.warn(`  ! ${label} falló para ${batch.length} repos, dividiendo el lote`);
    const a = await resilientBatch(batch.slice(0, mid), fn, label);
    const b = await resilientBatch(batch.slice(mid), fn, label);
    return [...(a || []), ...(b || [])];
  }
}

const iso = (d) => d.toISOString();
const day = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

const REPO_FRAGMENT = `
fragment RepoMetrics on Repository {
  nameWithOwner
  name
  description
  url
  homepageUrl
  isArchived
  isFork
  isDisabled
  createdAt
  pushedAt
  stargazerCount
  forkCount
  watchers { totalCount }
  primaryLanguage { name color }
  licenseInfo { spdxId name }
  repositoryTopics(first: 12) { nodes { topic { name } } }
  owner { login avatarUrl __typename }
  codeOfConduct { name }
  discussions { totalCount }
  releasesTotal: releases { totalCount }
  latestRelease: releases(first: 1, orderBy: { field: CREATED_AT, direction: DESC }) {
    nodes { publishedAt tagName name }
  }
  recentReleases: releases(first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
    nodes { publishedAt }
  }
  openIssues: issues(states: OPEN) { totalCount }
  closedIssues: issues(states: CLOSED) { totalCount }
  openPRs: pullRequests(states: OPEN) { totalCount }
  mergedPRs: pullRequests(states: MERGED) { totalCount }
  readme: object(expression: "HEAD:README.md") { ... on Blob { byteSize } }
  readmeAlt: object(expression: "HEAD:readme.md") { ... on Blob { byteSize } }
  contributing: object(expression: "HEAD:CONTRIBUTING.md") { ... on Blob { byteSize } }
  defaultBranchRef {
    target {
      ... on Commit {
        recent: history(since: $since) { totalCount }
        prev: history(since: $prevSince, until: $since) { totalCount }
        authors: history(since: $since, first: 100) {
          nodes { author { user { login } name } }
        }
      }
    }
  }
}`;

export async function discoverUniverse() {
  const seen = new Map();
  const sources = new Map();
  for (const d of DISCOVERY) {
    const q = d.q
      .replace('{d14}', day(daysAgo(14)))
      .replace('{d30}', day(daysAgo(30)))
      .replace('{y2}', day(daysAgo(730)));
    const items = await searchRepositories(q, d.sort, d.pages);
    console.log(`  · ${d.id}: ${items.length} candidatos (${q})`);
    for (const it of items) {
      if (it.archived || it.disabled || it.fork) continue;
      if (!seen.has(it.full_name)) seen.set(it.full_name, it);
      const s = sources.get(it.full_name) || [];
      s.push(d.id);
      sources.set(it.full_name, s);
    }
  }
  const universe = [...seen.values()]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, UNIVERSE_CAP)
    .map((it) => ({
      owner: it.owner.login,
      name: it.name,
      fullName: it.full_name,
      discoveredBy: sources.get(it.full_name),
    }));
  return universe;
}

async function fetchRepoBatch(batch, since, prevSince) {
  const parts = batch.map((r, i) => `r${i}: repository(owner: ${JSON.stringify(r.owner)}, name: ${JSON.stringify(r.name)}) { ...RepoMetrics }`);
  const query = `query($since: GitTimestamp!, $prevSince: GitTimestamp!) {
    ${parts.join('\n    ')}
  }
  ${REPO_FRAGMENT}`;
  const data = await graphql(query, { since, prevSince });
  return batch.map((r, i) => ({ request: r, repo: data?.[`r${i}`] || null }));
}

async function fetchSearchBatch(batch, sinceDay, prevDay) {
  const vars = {};
  const decls = [];
  const fields = [];
  batch.forEach((r, i) => {
    const n = r.canonical;
    const defs = [
      [`prm${i}`, `repo:${n} is:pr is:merged merged:>=${sinceDay}`],
      [`prp${i}`, `repo:${n} is:pr is:merged merged:${prevDay}..${sinceDay}`],
      [`isc${i}`, `repo:${n} is:issue is:closed closed:>=${sinceDay}`],
      [`iso${i}`, `repo:${n} is:issue created:>=${sinceDay}`],
    ];
    for (const [alias, q] of defs) {
      vars[alias] = q;
      decls.push(`$${alias}: String!`);
      fields.push(`${alias}: search(query: $${alias}, type: ISSUE) { issueCount }`);
    }
  });
  const query = `query(${decls.join(', ')}) {\n  ${fields.join('\n  ')}\n}`;
  const data = await graphql(query, vars);
  return batch.map((r, i) => ({
    fullName: r.canonical,
    prsMerged30: data?.[`prm${i}`]?.issueCount ?? 0,
    prsMergedPrev30: data?.[`prp${i}`]?.issueCount ?? 0,
    issuesClosed30: data?.[`isc${i}`]?.issueCount ?? 0,
    issuesOpened30: data?.[`iso${i}`]?.issueCount ?? 0,
  }));
}

export async function collect(universe) {
  const since = iso(daysAgo(WINDOW_DAYS));
  const prevSince = iso(daysAgo(WINDOW_DAYS * 2));
  const sinceDay = day(daysAgo(WINDOW_DAYS));
  const prevDay = day(daysAgo(WINDOW_DAYS * 2));

  const collected = [];
  for (let i = 0; i < universe.length; i += REPO_BATCH) {
    const batch = universe.slice(i, i + REPO_BATCH);
    const results = await resilientBatch(batch, (b) => fetchRepoBatch(b, since, prevSince), 'lote de métricas');
    for (const { request, repo } of results || []) {
      if (!repo || repo.isArchived || repo.isDisabled) continue;
      collected.push({ ...request, canonical: repo.nameWithOwner, gql: repo });
    }
    console.log(`  · métricas ${Math.min(i + REPO_BATCH, universe.length)}/${universe.length}`);
  }

  const byCanonical = new Map(collected.map((r) => [r.canonical, r]));
  for (let i = 0; i < collected.length; i += SEARCH_BATCH) {
    const batch = collected.slice(i, i + SEARCH_BATCH);
    const results = await resilientBatch(batch, (b) => fetchSearchBatch(b, sinceDay, prevDay), 'lote de búsquedas');
    for (const res of results || []) {
      const target = byCanonical.get(res.fullName);
      if (target) target.search = res;
    }
    if (i % 40 === 0) console.log(`  · búsquedas ${Math.min(i + SEARCH_BATCH, collected.length)}/${collected.length}`);
    await sleep(600); // keep clear of GitHub's secondary rate limits on search
  }

  for (let i = 0; i < collected.length; i += 12) {
    const batch = collected.slice(i, i + 12);
    const counts = await Promise.all(batch.map((r) => contributorCount(r.canonical)));
    counts.forEach((c, j) => { batch[j].contributors = c; });
  }
  console.log(`  · contribuidores resueltos para ${collected.length} repositorios`);

  return collected.map(toRawRecord).filter(Boolean);
}

function toRawRecord(entry) {
  const g = entry.gql;
  if (!g) return null;
  const now = Date.now();
  const target = g.defaultBranchRef?.target || {};
  const authorNodes = target.authors?.nodes || [];
  const authorKeys = authorNodes.map((n) => n?.author?.user?.login || n?.author?.name).filter(Boolean);
  const counts = new Map();
  for (const k of authorKeys) counts.set(k, (counts.get(k) || 0) + 1);
  const topShare = authorKeys.length ? Math.max(...counts.values()) / authorKeys.length : 1;

  const releaseCut = now - RELEASE_WINDOW_DAYS * 86400000;
  const releasesRecent = (g.recentReleases?.nodes || []).filter((n) => n.publishedAt && Date.parse(n.publishedAt) >= releaseCut).length;
  const latestRelease = g.latestRelease?.nodes?.[0] || null;

  return {
    fullName: g.nameWithOwner,
    owner: g.owner?.login || entry.owner,
    ownerType: g.owner?.__typename === 'Organization' ? 'Organization' : 'User',
    avatar: g.owner?.avatarUrl || null,
    description: g.description || '',
    url: g.url,
    homepage: g.homepageUrl || null,
    language: g.primaryLanguage?.name || null,
    languageColor: g.primaryLanguage?.color || null,
    license: g.licenseInfo?.spdxId || null,
    topics: (g.repositoryTopics?.nodes || []).map((n) => n.topic.name),
    createdAt: g.createdAt,
    pushedAt: g.pushedAt,
    discoveredBy: entry.discoveredBy,

    stargazerCount: g.stargazerCount,
    forkCount: g.forkCount,
    watchers: g.watchers?.totalCount ?? 0,
    contributors: entry.contributors ?? 0,

    openIssues: g.openIssues?.totalCount ?? 0,
    closedIssues: g.closedIssues?.totalCount ?? 0,
    openPRs: g.openPRs?.totalCount ?? 0,
    mergedPRsTotal: g.mergedPRs?.totalCount ?? 0,
    discussions: g.discussions?.totalCount ?? 0,

    commits30: target.recent?.totalCount ?? 0,
    commitsPrev30: target.prev?.totalCount ?? 0,
    uniqueAuthors30: counts.size,
    topAuthorShare: topShare,

    prsMerged30: entry.search?.prsMerged30 ?? 0,
    prsMergedPrev30: entry.search?.prsMergedPrev30 ?? 0,
    issuesClosed30: entry.search?.issuesClosed30 ?? 0,
    issuesOpened30: entry.search?.issuesOpened30 ?? 0,

    releasesTotal: g.releasesTotal?.totalCount ?? 0,
    releasesRecent,
    latestReleaseAt: latestRelease?.publishedAt || null,
    latestReleaseTag: latestRelease?.tagName || null,

    readmeBytes: g.readme?.byteSize ?? g.readmeAlt?.byteSize ?? 0,
    hasContributing: Boolean(g.contributing),
    hasCodeOfConduct: Boolean(g.codeOfConduct),
  };
}
