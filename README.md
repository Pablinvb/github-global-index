# GitHub Global Repository Index

Ranking semanal de los **20 repositorios públicos de GitHub más relevantes, activos, influyentes y prometedores del mundo**, calculado con datos oficiales de las APIs REST y GraphQL de GitHub.

El índice se recalcula solo cada lunes a las 06:00 UTC mediante GitHub Actions. Cada ejecución recopila los datos, calcula las puntuaciones, compara con la semana anterior, guarda el histórico y regenera el sitio publicado.

## Qué produce cada ejecución

| Archivo | Contenido |
| --- | --- |
| `data/latest.json` | Ranking vigente completo, con desglose por métrica, movimientos e indicadores. |
| `data/history/YYYY-Www.json` | Instantánea inmutable de cada semana. |
| `data/timeseries.json` | Serie temporal comprimida (puesto, puntuación, estrellas y forks por semana) de las últimas 52 semanas. |
| `data/state.json` | Instantánea de referencia para el cálculo de variaciones de la semana siguiente. |
| `docs/index.html` | Sitio autocontenido publicado en GitHub Pages. |
| `docs/artifact.html` | Mismo contenido sin envoltorio `<html>`, para publicar como artifact. |

## Cómo se puntúa

Cada repositorio recibe una puntuación **sobre 100** repartida entre cinco dimensiones. Ninguna variable cruda entra directamente en la puntuación: las métricas de conteo se convierten en **percentil dentro del universo analizado** y las razones y recencias usan transformaciones acotadas. Así una sola variable —las estrellas, por ejemplo— no puede dominar el resultado.

| Dimensión | Puntos | Qué mide |
| --- | ---: | --- |
| Popularidad y adopción | 20 | Masa instalada acumulada: estrellas, forks, observadores y contribuidores totales. |
| Actividad reciente | 22 | Trabajo real en los últimos 30 días: commits, PR fusionados, issues cerradas, recencia de push y de release. |
| Crecimiento y tendencia | 20 | Derivada del proyecto: estrellas y forks ganados en la semana, y aceleración de commits y de PR frente al mes anterior. |
| Salud y mantenimiento | 20 | Resolución de issues, presión del backlog, diversidad de contribuidores, reparto del trabajo, documentación y cadencia de releases. |
| Impacto en el ecosistema | 18 | Throughput histórico de PR, tracción por año de vida, intensidad de derivación, participación de la comunidad, madurez de distribución y respaldo organizacional. |

Los pesos exactos de cada métrica viven en [`src/config.mjs`](src/config.mjs) y se publican dentro del propio sitio, en la sección **Metodología**.

### Transformaciones

- **Percentil** — posición de la métrica dentro del universo analizado, con empates promediados. Inmune a valores extremos.
- **Decaimiento** — `0.5 ^ (días / vida_media)`. Usado en recencia de push, de release y en la presión del backlog.
- **Razón** — `0.5 + log2(r) / 4`, saturado entre 0,25× y 4×. El punto neutro es 1×. Usado en las aceleraciones.
- **Acotada** — `valor / techo`, saturado en 1. Usado en la tasa de crecimiento y la intensidad de derivación.

### Datos que GitHub no puede servir

En los repositorios con un historial enorme (`torvalds/linux`, por ejemplo) la API se niega a enumerar la lista de contribuidores. Como esa negativa significa precisamente que la lista es demasiado grande, el valor se imputa con el **máximo observado** entre los repositorios que sí respondieron, en lugar de contarlo como cero, y queda marcado con `contributorsImputed`.

### La primera semana es distinta

Las métricas de variación semanal de estrellas y forks necesitan una instantánea previa, que solo existe a partir de la segunda ejecución. En la semana base esas métricas quedan **inactivas** y su peso se redistribuye proporcionalmente entre las métricas de crecimiento sí observables (aceleración de commits y de PR). El sitio lo indica de forma explícita y la redistribución se revierte sola en la siguiente ejecución.

## Universo analizado

Cada semana se descubren candidatos mediante cuatro consultas de búsqueda complementarias, se descartan los archivados, deshabilitados y forks, y se conservan los 240 con más estrellas:

1. **Élite histórica** — más de 50 000 estrellas.
2. **Popularidad con mantenimiento activo** — más de 15 000 estrellas y push en los últimos 14 días.
3. **Proyectos emergentes** — creados hace menos de 2 años, con más de 3 000 estrellas y actividad en los últimos 30 días.
4. **Mayor uso derivado** — más de 20 000 estrellas y 3 000 forks.

El universo es amplio a propósito: permite que entren proyectos nuevos al Top 20 y hace posible identificar el proyecto emergente con mayor potencial.

Los repositorios que son listas curadas o recursos educativos se puntúan con la misma fórmula, pero se marcan como `recurso` para poder filtrarlos en el sitio sin aplicarles una penalización oculta.

## Ejecución local

```bash
GITHUB_TOKEN=$(gh auth token) node src/main.mjs
```

Requiere Node 20 o superior y no tiene dependencias externas. Una ejecución completa consume del orden de 300 llamadas REST y 130 GraphQL, muy por debajo del límite de 5 000 por hora de un token autenticado.

## Automatización

El flujo [`.github/workflows/weekly.yml`](.github/workflows/weekly.yml) se dispara por `schedule` cada lunes y también manualmente con `workflow_dispatch`. Usa el `GITHUB_TOKEN` que inyecta Actions, publica los cambios en `data/` y `docs/`, y GitHub Pages sirve el sitio desde la carpeta `docs/` de la rama principal.

Para que el sitio muestre su propia URL, define la variable de repositorio `SITE_URL`.
