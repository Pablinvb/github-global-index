const API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!TOKEN) {
  console.error('Falta GITHUB_TOKEN. En GitHub Actions se inyecta con secrets.GITHUB_TOKEN.');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'github-global-repository-index',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const stats = { graphqlCalls: 0, restCalls: 0, retries: 0 };

async function withRetry(label, fn, { attempts = 5 } = {}) {
  let wait = 1500;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts) throw new Error(`${label} falló tras ${attempts} intentos: ${err.message}`);
      stats.retries++;
      const backoff = err.retryAfter ? err.retryAfter * 1000 : wait;
      console.warn(`  ! ${label}: ${err.message} — reintento ${i}/${attempts - 1} en ${Math.round(backoff / 1000)}s`);
      await sleep(backoff);
      wait = Math.min(wait * 2, 60000);
    }
  }
}

async function raw(url, init) {
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers || {}) } });
  if (res.status === 403 || res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after'));
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    const err = new Error(`HTTP ${res.status} (límite de peticiones)`);
    err.retryAfter = retryAfter || (reset ? Math.max(5, reset - Math.floor(Date.now() / 1000)) : 60);
    throw err;
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`);
  }
  return res;
}

export async function graphql(query, variables = {}) {
  return withRetry('graphql', async () => {
    const res = await raw(`${API}/graphql`, {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    stats.graphqlCalls++;
    if (json.errors) {
      // Missing objects and moved repos surface as nullable fields; only fail on real errors.
      const fatal = json.errors.filter((e) => e.type !== 'NOT_FOUND');
      if (fatal.length && !json.data) throw new Error(fatal.map((e) => e.message).join('; '));
    }
    return json.data;
  });
}

export async function rest(path, { raw: wantRaw = false } = {}) {
  return withRetry(`rest ${path}`, async () => {
    const res = await raw(path.startsWith('http') ? path : `${API}${path}`);
    stats.restCalls++;
    if (wantRaw) return res;
    return res.json();
  });
}

// Total contributors is not exposed by GraphQL; the REST pagination header is the cheapest
// reliable estimate (one request per repo, capped by GitHub at 500 pages).
export async function contributorCount(nameWithOwner) {
  try {
    const res = await rest(`/repos/${nameWithOwner}/contributors?per_page=1&anon=1`, { raw: true });
    const link = res.headers.get('link');
    if (!link) {
      const body = await res.json();
      return Array.isArray(body) ? body.length : 0;
    }
    const last = /[?&]page=(\d+)>; rel="last"/.exec(link);
    return last ? Number(last[1]) : 1;
  } catch {
    return 0;
  }
}

export async function searchRepositories(q, sort, pages) {
  const out = [];
  for (let page = 1; page <= pages; page++) {
    const url = `/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=desc&per_page=100&page=${page}`;
    const json = await rest(url);
    out.push(...(json.items || []));
    if (!json.items || json.items.length < 100) break;
    await sleep(2000); // search API allows 30 req/min
  }
  return out;
}

export async function rateLimit() {
  const json = await rest('/rate_limit');
  return json.resources;
}
