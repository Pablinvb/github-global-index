import { PILLARS, DOC_COMPONENTS, RESOURCE_NAME_HINTS, RESOURCE_TOPIC_HINTS, WINDOW_DAYS } from './config.mjs';

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const days = (from, to = Date.now()) => (to - Date.parse(from)) / 86400000;

export function deriveFeatures(r, prev) {
  const ageYears = Math.max(0.25, days(r.createdAt) / 365.25);
  const totalIssues = r.openIssues + r.closedIssues;
  const closeRate30 = r.issuesClosed30 / WINDOW_DAYS;
  const backlogMonths = closeRate30 > 0 ? r.openIssues / (closeRate30 * 30) : (r.openIssues > 0 ? 999 : 0);

  const documentation = DOC_COMPONENTS.reduce((acc, c) => {
    let v = 0;
    if (c.key === 'readme') v = clamp(r.readmeBytes / 8000);
    else if (c.key === 'contributing') v = r.hasContributing ? 1 : 0;
    else if (c.key === 'codeOfConduct') v = r.hasCodeOfConduct ? 1 : 0;
    else if (c.key === 'license') v = r.license && r.license !== 'NOASSERTION' ? 1 : 0;
    else if (c.key === 'homepage') v = r.homepage ? 1 : 0;
    else if (c.key === 'topics') v = clamp(r.topics.length / 3);
    return acc + v * c.weight;
  }, 0);

  const starsDelta = prev ? Math.max(0, r.stargazerCount - prev.stargazerCount) : null;
  const forksDelta = prev ? Math.max(0, r.forkCount - prev.forkCount) : null;
  const spanDays = prev?.capturedAt ? Math.max(1, days(prev.capturedAt)) : null;
  const weekFactor = spanDays ? 7 / spanDays : 1;

  return {
    stargazerCount: r.stargazerCount,
    forkCount: r.forkCount,
    watchers: r.watchers,
    contributors: r.contributors,

    commits30: r.commits30,
    prsMerged30: r.prsMerged30,
    issuesClosed30: r.issuesClosed30,
    daysSincePush: Math.max(0, days(r.pushedAt)),
    daysSinceRelease: r.latestReleaseAt ? Math.max(0, days(r.latestReleaseAt)) : 3650,

    starsDelta: starsDelta === null ? null : starsDelta * weekFactor,
    forksDelta: forksDelta === null ? null : forksDelta * weekFactor,
    starsGrowthRate: starsDelta === null ? null : (starsDelta * weekFactor) / Math.max(1, r.stargazerCount),
    commitAccel: ratioOf(r.commits30, r.commitsPrev30),
    prAccel: ratioOf(r.prsMerged30, r.prsMergedPrev30),

    issueResolution: totalIssues > 0 ? r.closedIssues / totalIssues : 0.5,
    backlogMonths: Math.min(backlogMonths, 240),
    uniqueAuthors30: r.uniqueAuthors30,
    busFactor: clamp(1 - r.topAuthorShare),
    documentation,
    releasesRecent: r.releasesRecent,

    mergedPRsTotal: r.mergedPRsTotal,
    starsPerYear: r.stargazerCount / ageYears,
    forkRatio: r.stargazerCount > 0 ? r.forkCount / r.stargazerCount : 0,
    engagement: r.discussions + r.issuesOpened30 * 4,
    releasesTotal: r.releasesTotal,
    orgBacked: r.ownerType === 'Organization' ? 1 : 0.55,

    ageYears,
  };
}

function ratioOf(current, previous) {
  if (previous === 0 && current === 0) return 1;
  if (previous === 0) return 4;
  return current / previous;
}

export function classifyKind(r) {
  const topicHit = r.topics.some((t) => RESOURCE_TOPIC_HINTS.includes(t.toLowerCase()));
  const nameHit = RESOURCE_NAME_HINTS.test(r.fullName);
  const noCodeSignals = r.releasesTotal === 0 && r.mergedPRsTotal < 500;
  const docLanguage = !r.language || ['Markdown', 'HTML', 'TeX'].includes(r.language);
  const score = (topicHit ? 2 : 0) + (nameHit ? 2 : 0) + (noCodeSignals ? 1 : 0) + (docLanguage ? 1 : 0);
  return score >= 3 ? 'recurso' : 'software';
}

function percentileMap(values) {
  const indexed = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const out = new Array(values.length).fill(0.5);
  if (values.length < 2) return out;
  let k = 0;
  while (k < indexed.length) {
    let j = k;
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[k].v) j++;
    const avgRank = (k + j) / 2;
    const p = avgRank / (indexed.length - 1);
    for (let t = k; t <= j; t++) out[indexed[t].i] = p;
    k = j + 1;
  }
  return out;
}

function applyTransform(metric, value) {
  switch (metric.transform) {
    case 'decay':
      return Math.pow(0.5, value / metric.halflife);
    case 'ratio': {
      const r = clamp(value, 0.25, 4);
      return clamp(0.5 + Math.log2(r) / 4);
    }
    case 'bounded':
      return clamp(value / metric.cap);
    case 'fraction':
      return clamp(value);
    default:
      return clamp(value);
  }
}

export function scoreUniverse(records, { hasHistory }) {
  const features = records.map((r) => r.features);

  // Percentile metrics are normalised against the whole analysed universe, so a repository's
  // position on each axis is always relative to its peers rather than to an absolute magnitude.
  const percentiles = new Map();
  for (const pillar of PILLARS) {
    for (const metric of pillar.metrics) {
      if (metric.transform !== 'percentile') continue;
      if (metric.requiresHistory && !hasHistory) continue;
      const values = features.map((f) => f[metric.source] ?? 0);
      percentiles.set(`${pillar.key}.${metric.key}`, percentileMap(values));
    }
  }

  return records.map((record, idx) => {
    const f = record.features;
    const pillarResults = [];
    let total = 0;

    for (const pillar of PILLARS) {
      const active = pillar.metrics.filter((m) => !(m.requiresHistory && !hasHistory));
      const weightSum = active.reduce((a, m) => a + m.weight, 0);
      const metricResults = [];
      let pillarScore = 0;

      for (const metric of active) {
        const effWeight = metric.weight / weightSum;
        const rawValue = f[metric.source];
        const normalized = metric.transform === 'percentile'
          ? percentiles.get(`${pillar.key}.${metric.key}`)[idx]
          : applyTransform(metric, rawValue ?? 0);
        pillarScore += normalized * effWeight;
        metricResults.push({
          key: metric.key,
          label: metric.label,
          description: metric.description,
          raw: rawValue,
          normalized,
          weight: effWeight,
          points: normalized * effWeight * pillar.weight * 100,
        });
      }

      const points = pillarScore * pillar.weight * 100;
      total += points;
      pillarResults.push({
        key: pillar.key,
        label: pillar.label,
        short: pillar.short,
        description: pillar.description,
        weight: pillar.weight,
        score: pillarScore,
        points,
        degraded: active.length !== pillar.metrics.length,
        metrics: metricResults.sort((a, b) => b.points - a.points),
      });
    }

    return { ...record, score: total, pillars: pillarResults };
  });
}
