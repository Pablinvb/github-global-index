import { INDEX_NAME, TOP_N } from './config.mjs';

const CSS = `
:root {
  --ground: #eef1f5;
  --surface: #ffffff;
  --surface-2: #f6f8fa;
  --line: #dde3eb;
  --line-strong: #c3ccd9;
  --ink: #121822;
  --ink-2: #3c4756;
  --muted: #626e7e;
  --accent: #8a6a12;
  --accent-fill: #c9a227;
  --accent-soft: #f3ecd8;
  --up: #16704a;
  --down: #a72820;
  --new: #22578f;
  --p1: #6b5310; --p2: #8f7018; --p3: #b38c21; --p4: #cfae4f; --p5: #e3cd8e;
  --shadow: 0 1px 2px rgba(18, 24, 34, .06), 0 8px 24px -16px rgba(18, 24, 34, .35);
  --display: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
  --body: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", "Cascadia Mono", "Segoe UI Mono", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ground: #0b1017;
    --surface: #131a24;
    --surface-2: #182129;
    --line: #232d3a;
    --line-strong: #35434f;
    --ink: #e5ebf3;
    --ink-2: #c0cad6;
    --muted: #8593a4;
    --accent: #e3c05a;
    --accent-fill: #c9a227;
    --accent-soft: #2a2517;
    --up: #4ec98a;
    --down: #f0857c;
    --new: #6faae8;
    --p1: #f0d98a; --p2: #dcc06a; --p3: #c4a44e; --p4: #a5873a; --p5: #7d6529;
    --shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 8px 24px -16px rgba(0, 0, 0, .8);
  }
}
:root[data-theme="dark"] {
  --ground: #0b1017;
  --surface: #131a24;
  --surface-2: #182129;
  --line: #232d3a;
  --line-strong: #35434f;
  --ink: #e5ebf3;
  --ink-2: #c0cad6;
  --muted: #8593a4;
  --accent: #e3c05a;
  --accent-fill: #c9a227;
  --accent-soft: #2a2517;
  --up: #4ec98a;
  --down: #f0857c;
  --new: #6faae8;
  --p1: #f0d98a; --p2: #dcc06a; --p3: #c4a44e; --p4: #a5873a; --p5: #7d6529;
  --shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 8px 24px -16px rgba(0, 0, 0, .8);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--body);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); }
a:focus-visible, button:focus-visible, summary:focus-visible {
  outline: 2px solid var(--accent-fill);
  outline-offset: 2px;
  border-radius: 3px;
}
.wrap { max-width: 1180px; margin: 0 auto; padding: 0 20px 72px; }

.masthead {
  display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-end; justify-content: space-between;
  padding: 44px 0 22px; border-bottom: 2px solid var(--ink); margin-bottom: 4px;
}
.masthead h1 {
  font-family: var(--display); font-weight: 600; font-size: clamp(30px, 4.6vw, 52px);
  line-height: 1.02; letter-spacing: -.018em; margin: 6px 0 0; text-wrap: balance; max-width: 15ch;
}
.eyebrow {
  font-family: var(--mono); font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase;
  color: var(--accent); margin: 0;
}
.masthead-meta { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; text-align: right; }
.week-stamp {
  font-family: var(--mono); font-size: 21px; font-weight: 600; color: var(--ink);
  border: 1px solid var(--line-strong); border-radius: 2px; padding: 5px 12px; background: var(--surface);
}
.meta-line { font-family: var(--mono); font-size: 11.5px; color: var(--muted); }
.lede {
  max-width: 68ch; color: var(--ink-2); font-size: 16px; margin: 20px 0 0;
  padding-bottom: 26px; border-bottom: 1px solid var(--line);
}
.notice {
  margin: 22px 0 0; padding: 13px 16px; background: var(--accent-soft);
  border-left: 3px solid var(--accent-fill); border-radius: 0 3px 3px 0;
  font-size: 13.5px; color: var(--ink-2);
}

section { margin-top: 46px; }
.sec-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 16px; }
.sec-head h2 {
  font-family: var(--display); font-size: 23px; font-weight: 600; letter-spacing: -.01em; margin: 0;
}
.sec-head .rule { flex: 1; height: 1px; background: var(--line); }
.sec-head .count { font-family: var(--mono); font-size: 11.5px; color: var(--muted); }
.sec-note { color: var(--muted); font-size: 13.5px; margin: -6px 0 16px; max-width: 72ch; }

.signals { display: grid; grid-template-columns: repeat(auto-fit, minmax(232px, 1fr)); gap: 12px; }
.signal {
  background: var(--surface); border: 1px solid var(--line); border-radius: 4px;
  padding: 14px 15px; display: flex; flex-direction: column; gap: 7px; box-shadow: var(--shadow);
}
.signal-tag {
  font-family: var(--mono); font-size: 9.5px; letter-spacing: .13em; text-transform: uppercase;
  color: var(--muted);
}
.signal-name { font-weight: 650; font-size: 14.5px; word-break: break-word; line-height: 1.3; }
.signal-name a { color: var(--ink); text-decoration: none; }
.signal-name a:hover { color: var(--accent); text-decoration: underline; }
.signal-line { font-size: 12.5px; color: var(--ink-2); line-height: 1.4; }
.signal-rank { font-family: var(--mono); font-size: 11px; color: var(--muted); }
.signal.empty .signal-line { color: var(--muted); font-style: italic; }

.toolbar {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  margin-bottom: 14px; font-family: var(--mono); font-size: 11.5px;
}
.toolbar button {
  font: inherit; color: var(--ink-2); background: var(--surface); cursor: pointer;
  border: 1px solid var(--line-strong); border-radius: 2px; padding: 5px 11px;
  letter-spacing: .04em; text-transform: uppercase;
}
.toolbar button[aria-pressed="true"] { background: var(--ink); color: var(--ground); border-color: var(--ink); }
.toolbar .spacer { flex: 1; }
.toolbar .hint { text-transform: none; letter-spacing: 0; color: var(--muted); }

.board { display: flex; flex-direction: column; gap: 7px; }
.entry {
  background: var(--surface); border: 1px solid var(--line); border-radius: 4px;
  box-shadow: var(--shadow); overflow: hidden;
}
.entry[open] { border-color: var(--line-strong); }
.entry > summary { list-style: none; cursor: pointer; padding: 13px 16px; display: block; }
.entry > summary::-webkit-details-marker { display: none; }
.entry > summary:hover { background: var(--surface-2); }
.row { display: grid; grid-template-columns: 54px 1fr minmax(150px, 200px) 92px; gap: 16px; align-items: center; }
.rank {
  font-family: var(--display); font-size: 34px; font-weight: 600; color: var(--accent);
  line-height: 1; text-align: right; font-variant-numeric: tabular-nums;
}
.rank .hash { font-size: 15px; color: var(--muted); margin-right: 1px; }
.ident { min-width: 0; }
.ident-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.repo-name { font-size: 16px; font-weight: 650; letter-spacing: -.005em; }
.repo-name a { color: var(--ink); text-decoration: none; }
.repo-name a:hover { color: var(--accent); text-decoration: underline; }
.repo-name .owner { color: var(--muted); font-weight: 400; }
.desc {
  color: var(--ink-2); font-size: 13px; margin-top: 3px; line-height: 1.45;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.chip {
  font-family: var(--mono); font-size: 10px; letter-spacing: .06em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 2px; border: 1px solid var(--line-strong); color: var(--muted); white-space: nowrap;
}
.chip.up { color: var(--up); border-color: currentColor; }
.chip.down { color: var(--down); border-color: currentColor; }
.chip.new { color: var(--new); border-color: currentColor; }
.chip.kind { color: var(--accent); border-color: var(--accent-fill); }
.lang { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); white-space: nowrap; }
.dot { width: 9px; height: 9px; border-radius: 50%; background: var(--line-strong); flex: none; }
.stats { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 7px; }
.stat { font-family: var(--mono); font-size: 11.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
.stat b { color: var(--ink-2); font-weight: 600; }
.stat .delta-up { color: var(--up); }
.stat .delta-down { color: var(--down); }

.meter { display: flex; flex-direction: column; gap: 5px; }
.meter-bar { display: flex; height: 9px; border-radius: 2px; overflow: hidden; background: var(--surface-2); border: 1px solid var(--line); }
.meter-bar i { display: block; height: 100%; }
.meter-legend { font-family: var(--mono); font-size: 10px; color: var(--muted); display: flex; justify-content: space-between; }
.score { text-align: right; }
.score b { font-family: var(--mono); font-size: 25px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
.score span { display: block; font-family: var(--mono); font-size: 10px; color: var(--muted); }
.score .move { font-variant-numeric: tabular-nums; }
.score .move.up { color: var(--up); }
.score .move.down { color: var(--down); }

.detail { padding: 4px 16px 18px; border-top: 1px solid var(--line); background: var(--surface-2); }
.why { margin: 14px 0 18px; padding-left: 13px; border-left: 2px solid var(--accent-fill); }
.why li { font-size: 13.5px; color: var(--ink-2); margin-bottom: 4px; }
.why ul { margin: 0; padding-left: 16px; }
.why h4, .detail h4 {
  font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--muted); margin: 0 0 8px;
}
.pillar-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(212px, 1fr)); gap: 12px; }
.pillar {
  background: var(--surface); border: 1px solid var(--line); border-radius: 3px; padding: 11px 12px;
}
.pillar-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.pillar-head strong { font-size: 13px; font-weight: 650; }
.pillar-head span { font-family: var(--mono); font-size: 12px; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.pillar-track { height: 5px; background: var(--surface-2); border-radius: 2px; margin: 8px 0 9px; overflow: hidden; }
.pillar-track i { display: block; height: 100%; }
.pillar-metrics { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.pillar-metrics li {
  display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center;
  font-size: 11.5px; color: var(--muted);
}
.pillar-metrics .mval { font-family: var(--mono); color: var(--ink-2); font-variant-numeric: tabular-nums; }
.pillar-metrics .mpct { font-family: var(--mono); font-size: 10px; min-width: 34px; text-align: right; }
.degraded { font-size: 10.5px; color: var(--accent); font-family: var(--mono); margin-top: 7px; }

.movement { display: grid; grid-template-columns: repeat(auto-fit, minmax(272px, 1fr)); gap: 14px; }
.move-col { background: var(--surface); border: 1px solid var(--line); border-radius: 4px; padding: 15px 16px; box-shadow: var(--shadow); }
.move-col h3 { font-family: var(--mono); font-size: 10.5px; letter-spacing: .13em; text-transform: uppercase; margin: 0 0 11px; color: var(--muted); }
.move-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.move-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; }
.move-badge {
  font-family: var(--mono); font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 2px;
  border: 1px solid currentColor; flex: none; margin-top: 1px; font-variant-numeric: tabular-nums;
}
.move-body strong { display: block; font-size: 13px; font-weight: 650; word-break: break-word; }
.move-body strong a { color: var(--ink); text-decoration: none; }
.move-body strong a:hover { color: var(--accent); text-decoration: underline; }
.move-body em { font-style: normal; color: var(--muted); font-size: 12px; line-height: 1.4; display: block; margin-top: 2px; }
.empty-note { color: var(--muted); font-size: 12.5px; font-style: italic; }

.timeline-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--line); vertical-align: middle; }
th {
  font-family: var(--mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase;
  color: var(--muted); font-weight: 500; white-space: nowrap;
}
td.num, th.num { text-align: right; font-family: var(--mono); font-variant-numeric: tabular-nums; }
tbody tr:hover { background: var(--surface-2); }
.spark { display: block; }
.method-table { background: var(--surface); border: 1px solid var(--line); border-radius: 4px; overflow: hidden; box-shadow: var(--shadow); }
.method-table td:first-child { font-weight: 600; }
.method-pillar td { background: var(--surface-2); font-family: var(--display); font-size: 15px; font-weight: 600; }
.method-pillar td span { font-family: var(--mono); font-size: 11px; color: var(--accent); font-weight: 500; margin-left: 8px; }
.method-desc { color: var(--muted); font-size: 12.5px; }
.inactive td { opacity: .55; }

footer {
  margin-top: 56px; padding-top: 22px; border-top: 2px solid var(--ink);
  font-size: 12.5px; color: var(--muted); display: flex; flex-wrap: wrap; gap: 12px 28px; justify-content: space-between;
}
footer code { font-family: var(--mono); font-size: 11.5px; color: var(--ink-2); }

@media (max-width: 860px) {
  .row { grid-template-columns: 42px 1fr; grid-template-areas: "rank ident" "meter meter" "score score"; row-gap: 12px; }
  .rank { grid-area: rank; font-size: 26px; }
  .ident { grid-area: ident; }
  .meter { grid-area: meter; }
  .score { grid-area: score; text-align: left; display: flex; align-items: baseline; gap: 10px; }
  .score span { display: inline; }
}
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
`;

const CLIENT = `
(function () {
  var D = JSON.parse(document.getElementById('index-data').textContent);
  var PC = ['var(--p1)', 'var(--p2)', 'var(--p3)', 'var(--p4)', 'var(--p5)'];
  var nf = new Intl.NumberFormat('es-ES');
  var n = function (v) { return nf.format(Math.round(v || 0)); };
  var d1 = function (v) { return (v || 0).toFixed(1); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var el = function (id) { return document.getElementById(id); };

  function metricValue(m) {
    var v = m.raw;
    if (v == null) return '—';
    if (m.key === 'pushRecency' || m.key === 'releaseRecency') return v > 3000 ? 'nunca' : d1(v) + ' d';
    if (m.key === 'backlogPressure') return v >= 240 ? '> 240 m' : d1(v) + ' m';
    if (m.key === 'commitAccel' || m.key === 'prAccel') return d1(v) + '\\u00d7';
    if (m.key === 'starsGrowthRate') return (v * 100).toFixed(2) + ' %';
    if (m.key === 'issueResolution' || m.key === 'busFactor' || m.key === 'documentation' || m.key === 'orgBacked') return (v * 100).toFixed(0) + ' %';
    if (m.key === 'forkRatio') return (v * 100).toFixed(1) + ' %';
    if (m.key === 'tractionPerYear') return n(v) + '/año';
    return n(v);
  }

  function meter(e) {
    var bar = e.pillars.map(function (p, i) {
      return '<i style="width:' + (p.points).toFixed(2) + '%;background:' + PC[i] + '" title="' + esc(p.label) + ': ' + d1(p.points) + ' pts"></i>';
    }).join('');
    return '<div class="meter"><div class="meter-bar">' + bar +
      '</div><div class="meter-legend"><span>' + esc(e.pillars[0].short) + ' → ' + esc(e.pillars[4].short) +
      '</span><span>' + d1(e.score) + '/100</span></div></div>';
  }

  function moveChip(e) {
    if (!D.hasHistory) return '';
    if (e.status === 'new') return '<span class="chip new">nuevo</span>';
    if (e.status === 'reentry') return '<span class="chip new">reingreso</span>';
    if (e.rankChange > 0) return '<span class="chip up">\\u25b2 ' + e.rankChange + '</span>';
    if (e.rankChange < 0) return '<span class="chip down">\\u25bc ' + Math.abs(e.rankChange) + '</span>';
    return '<span class="chip">=</span>';
  }

  function statsRow(e) {
    var out = [];
    out.push('<span class="stat">\\u2605 <b>' + n(e.stars) + '</b>' + delta(e.starsDelta) + '</span>');
    out.push('<span class="stat">forks <b>' + n(e.forks) + '</b>' + delta(e.forksDelta) + '</span>');
    out.push('<span class="stat">commits 30 d <b>' + n(e.commits30) + '</b></span>');
    out.push('<span class="stat">PR 30 d <b>' + n(e.prsMerged30) + '</b></span>');
    out.push('<span class="stat">autores 30 d <b>' + n(e.uniqueAuthors30) + '</b></span>');
    out.push('<span class="stat">contrib. <b>' + n(e.contributors) + '</b></span>');
    return '<div class="stats">' + out.join('') + '</div>';
  }

  function delta(v) {
    if (v == null || v === 0) return '';
    var cls = v > 0 ? 'delta-up' : 'delta-down';
    return ' <span class="' + cls + '">' + (v > 0 ? '+' : '\\u2212') + n(Math.abs(v)) + '</span>';
  }

  function detail(e) {
    var why = '<div class="why"><h4>Por qué está aquí</h4><ul>' +
      e.explanation.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>';
    var pillars = e.pillars.map(function (p, i) {
      var metrics = p.metrics.map(function (m) {
        return '<li><span title="' + esc(m.description) + '">' + esc(m.label) + '</span>' +
          '<span class="mval">' + metricValue(m) + '</span>' +
          '<span class="mpct">' + (m.normalized * 100).toFixed(0) + '</span></li>';
      }).join('');
      return '<div class="pillar"><div class="pillar-head"><strong>' + esc(p.label) + '</strong>' +
        '<span>' + d1(p.points) + ' / ' + d1(p.weight * 100) + '</span></div>' +
        '<div class="pillar-track"><i style="width:' + (p.score * 100).toFixed(1) + '%;background:' + PC[i] + '"></i></div>' +
        '<ul class="pillar-metrics">' + metrics + '</ul>' +
        (p.degraded ? '<div class="degraded">peso redistribuido: falta histórico</div>' : '') + '</div>';
    }).join('');
    return '<div class="detail">' + why +
      '<h4>Desglose de la puntuación · valor observado y percentil (0-100) en el universo</h4>' +
      '<div class="pillar-grid">' + pillars + '</div></div>';
  }

  function entryNode(e) {
    var lang = e.language
      ? '<span class="lang"><span class="dot" style="background:' + (e.languageColor || 'var(--line-strong)') + '"></span>' + esc(e.language) + '</span>'
      : '';
    var kind = e.kind === 'recurso' ? '<span class="chip kind">recurso</span>' : '';
    var move = e.scoreChange == null ? '' :
      '<span class="move ' + (e.scoreChange >= 0 ? 'up' : 'down') + '">' +
      (e.scoreChange >= 0 ? '+' : '\\u2212') + Math.abs(e.scoreChange).toFixed(1) + '</span>';
    var det = document.createElement('details');
    det.className = 'entry';
    det.dataset.kind = e.kind;
    det.innerHTML = '<summary><div class="row">' +
      '<div class="rank"><span class="hash">#</span>' + e.rank + '</div>' +
      '<div class="ident"><div class="ident-top">' +
        '<span class="repo-name"><a href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="owner">' + esc(e.fullName.split("/")[0]) + '/</span>' + esc(e.fullName.split("/")[1]) + '</a></span>' +
        lang + moveChip(e) + kind +
      '</div><p class="desc">' + esc(e.description || 'Sin descripción publicada.') + '</p>' + statsRow(e) + '</div>' +
      meter(e) +
      '<div class="score"><b>' + d1(e.score) + '</b><span>sobre 100 ' + move + '</span></div>' +
      '</div></summary>' + detail(e);
    return det;
  }

  function renderBoard(filter) {
    var board = el('board');
    board.textContent = '';
    D.top.forEach(function (e) {
      if (filter === 'software' && e.kind !== 'software') return;
      board.appendChild(entryNode(e));
    });
  }

  function renderSignals() {
    var defs = [
      ['Mayor ascenso', 'biggestRise'],
      ['Mayor descenso', 'biggestFall'],
      ['Mayor crecimiento', 'fastestGrowth'],
      ['Más activo', 'mostActive'],
      ['Nuevo en el Top ' + D.top.length, 'newEntry'],
      ['Emergente con más potencial', 'emerging']
    ];
    el('signals').innerHTML = defs.map(function (def) {
      var c = D.indicators[def[1]];
      if (!c) {
        return '<div class="signal empty"><span class="signal-tag">' + esc(def[0]) +
          '</span><span class="signal-line">Sin candidato esta semana.</span></div>';
      }
      return '<div class="signal"><span class="signal-tag">' + esc(def[0]) + '</span>' +
        '<span class="signal-name"><a href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">' + esc(c.fullName) + '</a></span>' +
        '<span class="signal-line">' + esc(c.headline) + '</span>' +
        '<span class="signal-rank">puesto global #' + c.rank + ' · ' + d1(c.score) + '/100</span></div>';
    }).join('');
  }

  function renderMovement() {
    if (!D.hasHistory) {
      el('movement').innerHTML = '<div class="move-col" style="grid-column:1/-1"><h3>Todavía no hay comparación</h3>' +
        '<p class="empty-note">Esta es la instantánea base del índice. A partir de la próxima ejecución semanal esta sección mostrará qué repositorios subieron, cuáles bajaron, cuáles entraron al Top ' + D.top.length + ' y cuáles salieron, con la variación de puestos y la dimensión que explica cada movimiento.</p></div>';
      return;
    }
    var ups = D.top.filter(function (e) { return e.rankChange > 0; }).sort(function (a, b) { return b.rankChange - a.rankChange; });
    var downs = D.top.filter(function (e) { return e.rankChange < 0; }).sort(function (a, b) { return a.rankChange - b.rankChange; });
    var ins = D.top.filter(function (e) { return e.status === 'new' || e.status === 'reentry'; });

    function list(items, cls, fmt) {
      if (!items.length) return '<p class="empty-note">Ninguno esta semana.</p>';
      return '<ul class="move-list">' + items.map(function (e) {
        return '<li><span class="move-badge" style="color:var(--' + cls + ')">' + fmt(e) + '</span>' +
          '<span class="move-body"><strong><a href="' + esc(e.url || ('https://github.com/' + e.fullName)) + '" target="_blank" rel="noopener noreferrer">' + esc(e.fullName) + '</a></strong>' +
          '<em>' + esc(e.reason || e.explanation[0]) + '</em></span></li>';
      }).join('') + '</ul>';
    }

    el('movement').innerHTML =
      '<div class="move-col"><h3>Subieron</h3>' + list(ups, 'up', function (e) { return '\\u25b2' + e.rankChange; }) + '</div>' +
      '<div class="move-col"><h3>Bajaron</h3>' + list(downs, 'down', function (e) { return '\\u25bc' + Math.abs(e.rankChange); }) + '</div>' +
      '<div class="move-col"><h3>Entraron al Top ' + D.top.length + '</h3>' + list(ins, 'new', function (e) { return '#' + e.rank; }) + '</div>' +
      '<div class="move-col"><h3>Salieron del Top ' + D.top.length + '</h3>' + list(D.exits, 'muted', function (e) { return '#' + e.prevRank; }) + '</div>';
  }

  function sparkline(series, weeks) {
    var pts = series.map(function (p, i) { return p ? { i: i, rank: p.rank } : null; }).filter(Boolean);
    if (pts.length < 2) return '<span class="empty-note">serie de 1 semana</span>';
    var w = 118, h = 26, pad = 3;
    var maxI = Math.max(1, weeks.length - 1);
    var ranks = pts.map(function (p) { return p.rank; });
    var lo = Math.min.apply(null, ranks), hi = Math.max.apply(null, ranks);
    var span = Math.max(1, hi - lo);
    var xy = pts.map(function (p) {
      var x = pad + (p.i / maxI) * (w - pad * 2);
      var y = pad + ((p.rank - lo) / span) * (h - pad * 2);
      return [x, y];
    });
    var path = xy.map(function (c, i) { return (i ? 'L' : 'M') + c[0].toFixed(1) + ' ' + c[1].toFixed(1); }).join(' ');
    var last = xy[xy.length - 1];
    return '<svg class="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Evolución del puesto">' +
      '<path d="' + path + '" fill="none" stroke="var(--accent-fill)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="2.4" fill="var(--accent)"/></svg>';
  }

  function renderTimeline() {
    var weeks = D.timeline.weeks;
    var host = el('timeline');
    if (weeks.length < 2) {
      host.innerHTML = '<p class="empty-note">El histórico se construye ejecución a ejecución. Con la próxima actualización semanal aparecerá aquí la evolución de cada repositorio, y las métricas de variación de estrellas y forks se activarán en el algoritmo.</p>';
      return;
    }
    var shown = weeks.slice(-10);
    var rows = D.top.map(function (e) {
      var series = D.timeline.series[e.fullName] || [];
      var offset = weeks.length - shown.length;
      var cells = shown.map(function (w, i) {
        var p = series[offset + i];
        return '<td class="num">' + (p ? '#' + p.rank : '—') + '</td>';
      }).join('');
      return '<tr><td>' + esc(e.fullName) + '</td>' + cells +
        '<td>' + sparkline(series, weeks) + '</td></tr>';
    }).join('');
    host.innerHTML = '<div class="timeline-wrap"><table><thead><tr><th>Repositorio</th>' +
      shown.map(function (w) { return '<th class="num">' + esc(w.replace('-W', ' S')) + '</th>'; }).join('') +
      '<th>Evolución</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function renderMethod() {
    var rows = D.methodology.pillars.map(function (p) {
      var head = '<tr class="method-pillar"><td colspan="3">' + esc(p.label) +
        '<span>' + (p.weight * 100).toFixed(0) + ' pts</span></td></tr>' +
        '<tr><td colspan="3" class="method-desc">' + esc(p.description) + '</td></tr>';
      var metrics = p.metrics.map(function (m) {
        return '<tr' + (m.active ? '' : ' class="inactive"') + '><td>' + esc(m.label) +
          (m.active ? '' : ' <span class="chip">inactiva</span>') + '</td>' +
          '<td class="num">' + (m.weight * p.weight * 100).toFixed(1) + '</td>' +
          '<td class="method-desc">' + esc(m.description) + '</td></tr>';
      }).join('');
      return head + metrics;
    }).join('');
    el('method').innerHTML = '<div class="method-table"><table><thead><tr><th>Métrica</th>' +
      '<th class="num">Puntos máx.</th><th>Cómo se calcula</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  renderSignals();
  renderBoard('all');
  renderMovement();
  renderTimeline();
  renderMethod();

  Array.prototype.forEach.call(document.querySelectorAll('#filters button'), function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('#filters button'), function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      renderBoard(btn.dataset.filter);
    });
  });
  el('expand-all').addEventListener('click', function () {
    var open = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', String(open));
    this.textContent = open ? 'Contraer todo' : 'Desglosar todo';
    Array.prototype.forEach.call(document.querySelectorAll('.entry'), function (d) { d.open = open; });
  });
})();
`;

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function renderPage(data, { standalone = true, siteUrl = null } = {}) {
  const title = `${INDEX_NAME} · ${data.weekId}`;
  const payload = JSON.stringify(data).replace(/</g, '\\u003c');

  const notice = data.methodology.degradedNote
    ? `<p class="notice"><strong>Semana base.</strong> ${escapeHtml(data.methodology.degradedNote)}</p>`
    : '';

  const siteLink = siteUrl
    ? `<div class="meta-line"><a href="${escapeHtml(siteUrl)}">${escapeHtml(siteUrl.replace(/^https?:\/\//, ''))}</a></div>`
    : '';

  const body = `
<div class="wrap">
  <header class="masthead">
    <div>
      <p class="eyebrow">Índice global de repositorios · edición semanal</p>
      <h1>Los ${TOP_N} repositorios más relevantes de GitHub</h1>
    </div>
    <div class="masthead-meta">
      <div class="week-stamp">${escapeHtml(data.weekId)}</div>
      <div class="meta-line">calculado el ${escapeHtml(fmtDate(data.generatedAt))}</div>
      <div class="meta-line">${data.universeSize} repositorios analizados</div>
      ${siteLink}
    </div>
  </header>

  <p class="lede">Ranking multidimensional calculado con datos públicos y oficiales de GitHub. La posición no depende del número de estrellas: cada repositorio se puntúa sobre 100 combinando cinco dimensiones —popularidad acumulada, actividad reciente, crecimiento, salud del proyecto e impacto en el ecosistema— y cada métrica se normaliza por percentil dentro del universo analizado para que ninguna variable domine el resultado.</p>
  ${notice}

  <section>
    <div class="sec-head"><h2>Señales de la semana</h2><div class="rule"></div></div>
    <div class="signals" id="signals"></div>
  </section>

  <section>
    <div class="sec-head"><h2>Clasificación</h2><div class="rule"></div><span class="count">puestos 1 – ${TOP_N}</span></div>
    <p class="sec-note">Cada fila abre el desglose completo: cuánto aporta cada dimensión, qué valor se observó en cada métrica y su percentil dentro del universo. La barra bajo la puntuación reparte los 100 puntos entre las cinco dimensiones, de popularidad a impacto.</p>
    <div class="toolbar" id="filters">
      <button data-filter="all" aria-pressed="true">Todos</button>
      <button data-filter="software" aria-pressed="false">Solo software</button>
      <span class="spacer"></span>
      <button id="expand-all" aria-pressed="false">Desglosar todo</button>
    </div>
    <div class="board" id="board"></div>
  </section>

  <section>
    <div class="sec-head"><h2>Movimientos respecto a la semana anterior</h2><div class="rule"></div>
      <span class="count">${data.previousWeekId ? escapeHtml(data.previousWeekId) : 'sin referencia previa'}</span></div>
    <div class="movement" id="movement"></div>
  </section>

  <section>
    <div class="sec-head"><h2>Evolución histórica</h2><div class="rule"></div>
      <span class="count">${data.timeline.weeks.length} semana${data.timeline.weeks.length === 1 ? '' : 's'} registrada${data.timeline.weeks.length === 1 ? '' : 's'}</span></div>
    <div id="timeline"></div>
  </section>

  <section>
    <div class="sec-head"><h2>Metodología</h2><div class="rule"></div><span class="count">100 puntos</span></div>
    <p class="sec-note">${escapeHtml(data.methodology.normalisation)}</p>
    <div id="method"></div>
  </section>

  <footer>
    <span>Fuente: API REST y GraphQL de GitHub. Universo de ${data.universeSize} repositorios públicos, sin archivar y sin forks.</span>
    <span><code>${escapeHtml(data.weekId)}</code> · generado ${escapeHtml(fmtDate(data.generatedAt))}</span>
  </footer>
</div>
<script id="index-data" type="application/json">${payload}</script>
<script>${CLIENT}</script>`;

  const head = `<title>${escapeHtml(title)}</title>\n<style>${CSS}</style>`;

  if (!standalone) return `${head}\n${body}`;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Ranking semanal multidimensional de los ${TOP_N} repositorios públicos de GitHub más relevantes, activos e influyentes del mundo.">
${head}
</head>
<body>
${body}
</body>
</html>`;
}
