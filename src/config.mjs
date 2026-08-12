export const INDEX_NAME = 'GitHub Global Repository Index';
export const TOP_N = 20;
export const UNIVERSE_CAP = 240;

export const WINDOW_DAYS = 30;
export const RELEASE_WINDOW_DAYS = 180;
export const EMERGING_MAX_AGE_YEARS = 3;

// Discovery queries. Each one contributes candidates to the universe; the union is
// deduplicated and capped. `sort` uses the REST search API vocabulary.
export const DISCOVERY = [
  { id: 'elite', q: 'stars:>50000', sort: 'stars', pages: 2, label: 'Élite histórica por estrellas' },
  { id: 'active', q: 'stars:>15000 pushed:>{d14}', sort: 'stars', pages: 1, label: 'Alta popularidad con mantenimiento activo' },
  { id: 'emerging', q: 'stars:>3000 created:>{y2} pushed:>{d30}', sort: 'stars', pages: 1, label: 'Proyectos emergentes (< 2 años)' },
  { id: 'forked', q: 'stars:>20000 forks:>3000', sort: 'forks', pages: 1, label: 'Mayor uso derivado (forks)' },
];

// Percentile-rank normalisation is the default: every count-like metric is mapped to its
// position within the analysed universe, so no single raw magnitude can dominate the score.
// Ratios and recency use bounded closed-form transforms instead.
export const PILLARS = [
  {
    key: 'popularity',
    label: 'Popularidad y adopción',
    short: 'Popularidad',
    weight: 0.20,
    description: 'Masa instalada acumulada del proyecto. Mide reconocimiento histórico, no vigencia.',
    metrics: [
      { key: 'stars', label: 'Estrellas', weight: 0.40, transform: 'percentile', source: 'stargazerCount', description: 'Percentil de estrellas dentro del universo analizado.' },
      { key: 'forks', label: 'Forks', weight: 0.25, transform: 'percentile', source: 'forkCount', description: 'Percentil de forks: señal de uso y derivación real del código.' },
      { key: 'watchers', label: 'Observadores', weight: 0.15, transform: 'percentile', source: 'watchers', description: 'Percentil de watchers: seguimiento activo del desarrollo.' },
      { key: 'contributors', label: 'Contribuidores totales', weight: 0.20, transform: 'percentile', source: 'contributors', description: 'Percentil del total histórico de contribuidores.' },
    ],
  },
  {
    key: 'activity',
    label: 'Actividad reciente',
    short: 'Actividad',
    weight: 0.22,
    description: `Trabajo real observado en los últimos ${WINDOW_DAYS} días. Distingue proyectos vivos de archivos populares.`,
    metrics: [
      { key: 'commits30', label: 'Commits (30 d)', weight: 0.28, transform: 'percentile', source: 'commits30', description: 'Percentil de commits en la rama principal durante los últimos 30 días.' },
      { key: 'prsMerged30', label: 'PR fusionados (30 d)', weight: 0.24, transform: 'percentile', source: 'prsMerged30', description: 'Percentil de pull requests fusionados en los últimos 30 días.' },
      { key: 'issuesClosed30', label: 'Issues cerradas (30 d)', weight: 0.14, transform: 'percentile', source: 'issuesClosed30', description: 'Percentil de issues resueltas en los últimos 30 días.' },
      { key: 'pushRecency', label: 'Recencia del último push', weight: 0.18, transform: 'decay', source: 'daysSincePush', halflife: 10, description: 'Decaimiento exponencial con vida media de 10 días desde el último push.' },
      { key: 'releaseRecency', label: 'Recencia de release', weight: 0.16, transform: 'decay', source: 'daysSinceRelease', halflife: 120, description: 'Decaimiento exponencial con vida media de 120 días desde la última release publicada.' },
    ],
  },
  {
    key: 'growth',
    label: 'Crecimiento y tendencia',
    short: 'Crecimiento',
    weight: 0.20,
    description: 'Derivada del proyecto: si acelera o se enfría. Las variaciones semanales requieren histórico propio.',
    metrics: [
      { key: 'starsDelta', label: 'Estrellas ganadas (semana)', weight: 0.34, transform: 'percentile', source: 'starsDelta', requiresHistory: true, description: 'Percentil de estrellas ganadas desde la instantánea de la semana anterior.' },
      { key: 'starsGrowthRate', label: 'Tasa de crecimiento', weight: 0.16, transform: 'bounded', source: 'starsGrowthRate', cap: 0.03, requiresHistory: true, description: 'Crecimiento porcentual semanal de estrellas, saturado en 3 % por semana.' },
      { key: 'forksDelta', label: 'Forks ganados (semana)', weight: 0.08, transform: 'percentile', source: 'forksDelta', requiresHistory: true, description: 'Percentil de forks ganados desde la semana anterior.' },
      { key: 'commitAccel', label: 'Aceleración de commits', weight: 0.26, transform: 'ratio', source: 'commitAccel', description: 'Commits de los últimos 30 días frente a los 30 anteriores. 1× es el punto neutro.' },
      { key: 'prAccel', label: 'Aceleración de PR', weight: 0.16, transform: 'ratio', source: 'prAccel', description: 'PR fusionados en 30 días frente a los 30 previos. 1× es el punto neutro.' },
    ],
  },
  {
    key: 'health',
    label: 'Salud y mantenimiento',
    short: 'Salud',
    weight: 0.20,
    description: 'Capacidad del proyecto para sostenerse: resolución, gobernanza, documentación y reparto del trabajo.',
    metrics: [
      { key: 'issueResolution', label: 'Tasa de resolución de issues', weight: 0.16, transform: 'fraction', source: 'issueResolution', description: 'Issues cerradas sobre el total histórico de issues.' },
      { key: 'backlogPressure', label: 'Presión del backlog', weight: 0.12, transform: 'decay', source: 'backlogMonths', halflife: 12, description: 'Meses necesarios para vaciar las issues abiertas al ritmo de cierre actual; menos es mejor.' },
      { key: 'contributorDiversity', label: 'Diversidad de contribuidores', weight: 0.24, transform: 'percentile', source: 'uniqueAuthors30', description: 'Percentil de autores distintos con commits en los últimos 30 días.' },
      { key: 'busFactor', label: 'Reparto del trabajo', weight: 0.16, transform: 'fraction', source: 'busFactor', description: 'Complemento de la cuota del autor más activo: penaliza la dependencia de una sola persona.' },
      { key: 'documentation', label: 'Documentación y gobernanza', weight: 0.20, transform: 'fraction', source: 'documentation', description: 'Compuesto de README, CONTRIBUTING, código de conducta, licencia, sitio propio y temas declarados.' },
      { key: 'releaseCadence', label: 'Cadencia de releases', weight: 0.12, transform: 'percentile', source: 'releasesRecent', description: `Percentil de releases publicadas en los últimos ${RELEASE_WINDOW_DAYS} días.` },
    ],
  },
  {
    key: 'impact',
    label: 'Impacto en el ecosistema',
    short: 'Impacto',
    weight: 0.18,
    description: 'Alcance del proyecto más allá de su repositorio: throughput histórico, derivación, comunidad y tracción por año de vida.',
    metrics: [
      { key: 'prThroughput', label: 'PR fusionados (histórico)', weight: 0.22, transform: 'percentile', source: 'mergedPRsTotal', description: 'Percentil del total histórico de pull requests fusionados.' },
      { key: 'tractionPerYear', label: 'Tracción por año de vida', weight: 0.26, transform: 'percentile', source: 'starsPerYear', description: 'Percentil de estrellas por año de existencia: favorece la relevancia sobre la antigüedad.' },
      { key: 'forkRatio', label: 'Intensidad de derivación', weight: 0.14, transform: 'bounded', source: 'forkRatio', cap: 0.35, description: 'Forks por estrella, saturado en 0,35: separa el uso real del aplauso pasivo.' },
      { key: 'communityEngagement', label: 'Participación de la comunidad', weight: 0.13, transform: 'percentile', source: 'engagement', description: 'Percentil de discusiones más issues abiertas recientemente, ponderadas.' },
      { key: 'releaseMaturity', label: 'Madurez de distribución', weight: 0.18, transform: 'percentile', source: 'releasesTotal', description: 'Percentil del número total de releases publicadas.' },
      { key: 'orgBacked', label: 'Respaldo organizacional', weight: 0.07, transform: 'fraction', source: 'orgBacked', description: 'Vale 1 si el repositorio pertenece a una organización y 0,55 si pertenece a una cuenta personal.' },
    ],
  },
];

export const DOC_COMPONENTS = [
  { key: 'readme', label: 'README sustancial', weight: 0.35 },
  { key: 'contributing', label: 'Guía de contribución', weight: 0.15 },
  { key: 'codeOfConduct', label: 'Código de conducta', weight: 0.10 },
  { key: 'license', label: 'Licencia declarada', weight: 0.15 },
  { key: 'homepage', label: 'Sitio o documentación propia', weight: 0.15 },
  { key: 'topics', label: 'Temas declarados', weight: 0.10 },
];

// Repos that are curated lists or learning resources are scored with the same formula but
// flagged, so the site can separate "software" from "recurso" without a hidden penalty.
export const RESOURCE_TOPIC_HINTS = ['awesome', 'awesome-list', 'list', 'books', 'roadmap', 'tutorial', 'tutorials', 'cheatsheet', 'interview', 'learning', 'education', 'resources', 'curated'];
export const RESOURCE_NAME_HINTS = /(awesome|free-programming|books|roadmap|cheat-?sheet|interview|tutorial|guide|-list$|^list-|coding-interview|build-your-own|public-apis|the-book)/i;
