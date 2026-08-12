import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverUniverse, collect } from './collect.mjs';
import { deriveFeatures, classifyKind, scoreUniverse } from './score.mjs';
import { buildRanking, buildTimeline, updateTimeseries, isoWeekId } from './rank.mjs';
import { renderPage } from './render.mjs';
import { stats, rateLimit } from './github.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const DOCS = join(ROOT, 'docs');
const SITE_URL = process.env.SITE_URL || null;

async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

async function main() {
  const started = Date.now();
  const weekId = isoWeekId();
  console.log(`\n${'='.repeat(64)}\nGitHub Global Repository Index — ${weekId}\n${'='.repeat(64)}`);

  const state = await readJson(join(DATA, 'state.json'));
  const prevState = await readJson(join(DATA, 'prev-state.json'));
  const rerunSameWeek = state?.weekId === weekId;
  const baseline = rerunSameWeek ? prevState : state;
  console.log(baseline
    ? `Instantánea de referencia: ${baseline.weekId} (${baseline.entries.length} repositorios)`
    : 'Sin instantánea previa: esta ejecución establece la semana base.');

  console.log('\n▸ Descubriendo universo');
  const universe = await discoverUniverse();
  console.log(`  · universo final: ${universe.length} repositorios`);

  console.log('\n▸ Recopilando métricas');
  const raws = await collect(universe);
  console.log(`  · métricas completas para ${raws.length} repositorios`);

  const baselineByName = new Map();
  if (baseline) {
    for (const e of baseline.entries) {
      baselineByName.set(e.fullName, {
        stargazerCount: e.stars,
        forkCount: e.forks,
        capturedAt: baseline.capturedAt,
      });
    }
  }

  console.log('\n▸ Calculando puntuaciones');
  const records = raws.map((raw) => ({
    fullName: raw.fullName,
    raw,
    kind: classifyKind(raw),
    features: deriveFeatures(raw, baselineByName.get(raw.fullName) || null),
  }));
  const hasHistory = Boolean(baseline);
  const scored = scoreUniverse(records, { hasHistory });

  const previous = baseline
    ? { weekId: baseline.weekId, entries: baseline.entries }
    : null;
  let timeseries = await readJson(join(DATA, 'timeseries.json'), { weeks: [], repos: {} });

  const ranking = buildRanking(scored, previous, timeseries);
  timeseries = updateTimeseries(timeseries, ranking);
  ranking.timeline = buildTimeline(timeseries, ranking.top);

  console.log(`\n▸ Top ${ranking.top.length}`);
  for (const e of ranking.top) {
    const move = e.rankChange === null ? 'nuevo' : (e.rankChange > 0 ? `▲${e.rankChange}` : (e.rankChange < 0 ? `▼${Math.abs(e.rankChange)}` : '='));
    console.log(`  ${String(e.rank).padStart(2)}. ${e.fullName.padEnd(40)} ${e.score.toFixed(1).padStart(5)}  ${move}`);
  }

  const publicRanking = { ...ranking };
  delete publicRanking.snapshot;

  await writeJson(join(DATA, 'latest.json'), publicRanking);
  await writeJson(join(DATA, 'history', `${weekId}.json`), publicRanking);
  await writeJson(join(DATA, 'timeseries.json'), timeseries);

  const newState = {
    weekId,
    capturedAt: ranking.generatedAt,
    entries: ranking.snapshot,
  };
  if (!rerunSameWeek && state) await writeJson(join(DATA, 'prev-state.json'), state);
  await writeJson(join(DATA, 'state.json'), newState);

  await mkdir(DOCS, { recursive: true });
  await writeFile(join(DOCS, 'index.html'), renderPage(publicRanking, { standalone: true, siteUrl: SITE_URL }), 'utf8');
  await writeFile(join(DOCS, 'artifact.html'), renderPage(publicRanking, { standalone: false, siteUrl: SITE_URL }), 'utf8');
  await writeJson(join(DOCS, 'latest.json'), publicRanking);
  await writeFile(join(DOCS, '.nojekyll'), '', 'utf8');

  const limits = await rateLimit();
  console.log(`\n▸ Listo en ${((Date.now() - started) / 1000).toFixed(0)} s`);
  console.log(`  · llamadas: ${stats.graphqlCalls} GraphQL, ${stats.restCalls} REST, ${stats.retries} reintentos`);
  console.log(`  · cuota restante: core ${limits.core.remaining}/${limits.core.limit}, graphql ${limits.graphql.remaining}/${limits.graphql.limit}`);
}

main().catch((err) => {
  console.error('\nFallo la ejecución del índice:', err);
  process.exit(1);
});
