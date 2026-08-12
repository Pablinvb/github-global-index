import { TOP_N, EMERGING_MAX_AGE_YEARS, PILLARS } from './config.mjs';

export function isoWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const fmtPts = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)} pts`;

export function buildRanking(scored, previous, timeseries) {
  const ranked = [...scored].sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
  const weekId = isoWeekId();
  const hasHistory = Boolean(previous);

  const prevByName = new Map();
  if (previous) for (const e of previous.entries || []) prevByName.set(e.fullName, e);

  const prevTop = new Set((previous?.entries || []).filter((e) => e.rank <= TOP_N).map((e) => e.fullName));
  const currentTopNames = new Set(ranked.slice(0, TOP_N).map((r) => r.fullName));

  const decorate = (r) => {
    const p = prevByName.get(r.fullName);
    const prevRank = p?.rank ?? null;
    const rankChange = prevRank === null ? null : prevRank - r.rank;
    let status = 'new';
    if (prevRank !== null) {
      if (!prevTop.has(r.fullName) && currentTopNames.has(r.fullName)) status = 'reentry';
      else if (rankChange > 0) status = 'up';
      else if (rankChange < 0) status = 'down';
      else status = 'same';
    }
    return {
      rank: r.rank,
      prevRank,
      rankChange,
      status,
      fullName: r.fullName,
      owner: r.raw.owner,
      ownerType: r.raw.ownerType,
      avatar: r.raw.avatar,
      description: r.raw.description,
      url: r.raw.url,
      homepage: r.raw.homepage,
      language: r.raw.language,
      languageColor: r.raw.languageColor,
      license: r.raw.license,
      topics: r.raw.topics.slice(0, 6),
      kind: r.kind,
      createdAt: r.raw.createdAt,
      pushedAt: r.raw.pushedAt,
      ageYears: r.features.ageYears,
      score: r.score,
      prevScore: p?.score ?? null,
      scoreChange: p ? r.score - p.score : null,
      stars: r.raw.stargazerCount,
      forks: r.raw.forkCount,
      watchers: r.raw.watchers,
      contributors: r.raw.contributors,
      starsDelta: p ? r.raw.stargazerCount - p.stars : null,
      forksDelta: p ? r.raw.forkCount - p.forks : null,
      commits30: r.raw.commits30,
      commitsPrev30: r.raw.commitsPrev30,
      prsMerged30: r.raw.prsMerged30,
      issuesClosed30: r.raw.issuesClosed30,
      openIssues: r.raw.openIssues,
      uniqueAuthors30: r.raw.uniqueAuthors30,
      releasesTotal: r.raw.releasesTotal,
      latestReleaseTag: r.raw.latestReleaseTag,
      latestReleaseAt: r.raw.latestReleaseAt,
      commitAccel: r.features.commitAccel,
      prAccel: r.features.prAccel,
      pillars: r.pillars.map((pl) => ({
        key: pl.key,
        label: pl.label,
        short: pl.short,
        weight: pl.weight,
        score: pl.score,
        points: pl.points,
        degraded: pl.degraded,
        prevPoints: p?.pillarPoints?.[pl.key] ?? null,
        metrics: pl.metrics,
      })),
      pillarPoints: Object.fromEntries(r.pillars.map((pl) => [pl.key, pl.points])),
    };
  };

  const entries = ranked.map(decorate);
  entries.forEach((e) => { e.explanation = explain(e, hasHistory); });

  const top = entries.slice(0, TOP_N);
  const exits = (previous?.entries || [])
    .filter((e) => e.rank <= TOP_N && !currentTopNames.has(e.fullName))
    .map((e) => {
      const now = entries.find((x) => x.fullName === e.fullName);
      return {
        fullName: e.fullName,
        prevRank: e.rank,
        currentRank: now?.rank ?? null,
        url: now?.url ?? `https://github.com/${e.fullName}`,
        score: now?.score ?? null,
        prevScore: e.score,
        reason: now ? exitReason(now) : 'Salió del universo analizado esta semana.',
      };
    })
    .sort((a, b) => a.prevRank - b.prevRank);

  return {
    generatedAt: new Date().toISOString(),
    weekId,
    previousWeekId: previous?.weekId ?? null,
    hasHistory,
    universeSize: entries.length,
    top,
    exits,
    indicators: buildIndicators(entries, top, hasHistory),
    methodology: buildMethodology(hasHistory),
    timeline: buildTimeline(timeseries, top),
    snapshot: entries.map((e) => ({
      fullName: e.fullName,
      rank: e.rank,
      score: e.score,
      stars: e.stars,
      forks: e.forks,
      pillarPoints: e.pillarPoints,
    })),
  };
}

function explain(e, hasHistory) {
  const reasons = [];
  if (e.prevRank === null) {
    const top2 = [...e.pillars].sort((a, b) => b.points - a.points).slice(0, 2);
    const led = top2.map((p) => `${p.short.toLowerCase()} (${p.points.toFixed(1)} pts)`).join(' y ');
    reasons.push(hasHistory ? `Entra al índice apoyado en ${led}.` : `Posición sostenida sobre todo por ${led}.`);
  } else {
    const moves = e.pillars
      .filter((p) => p.prevPoints !== null)
      .map((p) => ({ short: p.short, delta: p.points - p.prevPoints }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 2)
      .filter((m) => Math.abs(m.delta) >= 0.05);
    if (moves.length) reasons.push(`Movimiento dominado por ${moves.map((m) => `${m.short.toLowerCase()} ${fmtPts(m.delta)}`).join(' y ')}.`);
    else reasons.push('Puntuación estable: ninguna dimensión se movió de forma significativa.');
    if (e.starsDelta !== null) reasons.push(`${e.starsDelta >= 0 ? '+' : '−'}${Math.abs(e.starsDelta).toLocaleString('es-ES')} estrellas y ${e.forksDelta >= 0 ? '+' : '−'}${Math.abs(e.forksDelta).toLocaleString('es-ES')} forks desde la semana anterior.`);
  }
  const accel = e.commitAccel;
  if (accel >= 1.35) reasons.push(`Ritmo de commits ${accel.toFixed(1)}× frente al mes previo.`);
  else if (accel <= 0.7) reasons.push(`Ritmo de commits al ${(accel * 100).toFixed(0)} % del mes previo.`);
  return reasons;
}

function exitReason(now) {
  const worst = [...now.pillars]
    .filter((p) => p.prevPoints !== null)
    .map((p) => ({ short: p.short, delta: p.points - p.prevPoints }))
    .sort((a, b) => a.delta - b.delta)[0];
  if (worst && worst.delta < -0.05) return `Cae al puesto ${now.rank}: ${worst.short.toLowerCase()} ${fmtPts(worst.delta)}.`;
  return `Cae al puesto ${now.rank}: desplazado por el ascenso de otros proyectos.`;
}

function buildIndicators(entries, top, hasHistory) {
  const byGrowth = [...entries].sort((a, b) => growthKey(b, hasHistory) - growthKey(a, hasHistory));
  const byActivity = [...entries].sort((a, b) => b.pillarPoints.activity - a.pillarPoints.activity);
  const emergingPool = entries.filter((e) => e.ageYears <= EMERGING_MAX_AGE_YEARS && e.rank > 10);
  const emerging = [...emergingPool].sort((a, b) => emergingKey(b) - emergingKey(a))[0] || null;

  const risers = top.filter((e) => e.rankChange !== null && e.rankChange > 0).sort((a, b) => b.rankChange - a.rankChange);
  const fallers = top.filter((e) => e.rankChange !== null && e.rankChange < 0).sort((a, b) => a.rankChange - b.rankChange);
  const entrants = top.filter((e) => e.status === 'new' || e.status === 'reentry');

  const card = (e, headline) => e && ({
    fullName: e.fullName, rank: e.rank, url: e.url, score: e.score,
    language: e.language, avatar: e.avatar, headline,
  });

  return {
    biggestRise: card(risers[0], risers[0] ? `Sube ${risers[0].rankChange} puesto${risers[0].rankChange > 1 ? 's' : ''} hasta el #${risers[0].rank}` : null),
    biggestFall: card(fallers[0], fallers[0] ? `Baja ${Math.abs(fallers[0].rankChange)} puesto${Math.abs(fallers[0].rankChange) > 1 ? 's' : ''} hasta el #${fallers[0].rank}` : null),
    fastestGrowth: card(byGrowth[0], byGrowth[0] && (hasHistory && byGrowth[0].starsDelta !== null
      ? `+${byGrowth[0].starsDelta.toLocaleString('es-ES')} estrellas en la semana`
      : `Aceleración de commits ${byGrowth[0].commitAccel.toFixed(1)}× y ${byGrowth[0].prsMerged30} PR fusionados en 30 días`)),
    mostActive: card(byActivity[0], byActivity[0] && `${byActivity[0].commits30} commits, ${byActivity[0].prsMerged30} PR fusionados y ${byActivity[0].uniqueAuthors30} autores distintos en 30 días`),
    newEntry: hasHistory ? card(entrants[0], entrants[0] && (entrants[0].status === 'reentry' ? `Reingresa al Top ${TOP_N} en el #${entrants[0].rank}` : `Nuevo en el Top ${TOP_N}, entra directo al #${entrants[0].rank}`)) : undefined,
    emerging: card(emerging, emerging && `${emerging.ageYears.toFixed(1)} años de vida, puesto global #${emerging.rank} y ${Math.round(emerging.stars / emerging.ageYears).toLocaleString('es-ES')} estrellas por año`),
  };
}

const growthKey = (e, hasHistory) => (hasHistory && e.starsDelta !== null ? e.starsDelta : e.pillarPoints.growth * 1000);
const emergingKey = (e) => e.pillarPoints.growth * 0.5 + e.pillarPoints.activity * 0.3 + e.pillarPoints.impact * 0.2;

function buildMethodology(hasHistory) {
  return {
    hasHistory,
    normalisation: 'Las métricas de conteo se convierten en percentil dentro del universo analizado; las razones y las recencias usan transformaciones acotadas. Ninguna variable cruda entra directa en la puntuación.',
    pillars: PILLARS.map((p) => ({
      key: p.key, label: p.label, short: p.short, weight: p.weight, description: p.description,
      metrics: p.metrics.map((m) => ({
        key: m.key, label: m.label, weight: m.weight, description: m.description,
        requiresHistory: Boolean(m.requiresHistory),
        active: !(m.requiresHistory && !hasHistory),
      })),
    })),
    degradedNote: hasHistory
      ? null
      : 'Primera ejecución del índice: todavía no existe instantánea previa, así que las métricas de variación semanal de estrellas y forks están inactivas y su peso se redistribuye proporcionalmente entre las métricas de crecimiento sí observables (aceleración de commits y de pull requests). Se activarán solas en la siguiente ejecución semanal.',
  };
}

export function buildTimeline(timeseries, top) {
  const weeks = timeseries?.weeks || [];
  const series = {};
  for (const e of top) {
    const repoSeries = timeseries?.repos?.[e.fullName] || {};
    series[e.fullName] = weeks.map((w) => repoSeries[w] || null);
  }
  return { weeks, series };
}

export function updateTimeseries(timeseries, ranking) {
  const ts = timeseries && timeseries.weeks ? timeseries : { weeks: [], repos: {} };
  if (!ts.weeks.includes(ranking.weekId)) ts.weeks.push(ranking.weekId);
  ts.weeks = ts.weeks.sort().slice(-52);
  for (const e of ranking.snapshot) {
    ts.repos[e.fullName] = ts.repos[e.fullName] || {};
    ts.repos[e.fullName][ranking.weekId] = { rank: e.rank, score: Number(e.score.toFixed(2)), stars: e.stars, forks: e.forks };
    for (const w of Object.keys(ts.repos[e.fullName])) {
      if (!ts.weeks.includes(w)) delete ts.repos[e.fullName][w];
    }
  }
  for (const name of Object.keys(ts.repos)) {
    if (!Object.keys(ts.repos[name]).length) delete ts.repos[name];
  }
  return ts;
}
