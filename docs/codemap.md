# Denny Bracket source map

Repository-level map, reviewed 2026-10-25. Generated output lives in `dist/`; modify source files instead.

| Area | Source | Responsibility |
| --- | --- | --- |
| Build and discovery | [scripts/build.mjs](../scripts/build.mjs), [scripts/discovery.mjs](../scripts/discovery.mjs) | Generate localized HTML, useful related links, public metadata and release artifacts. |
| Asset cache consistency | [scripts/version-modules.mjs](../scripts/version-modules.mjs), [scripts/version-styles.mjs](../scripts/version-styles.mjs) | Version module imports and stylesheet URLs together with the generated pages. |
| Product behavior | [src/bracket.js](../src/bracket.js), [src/undo-history.js](../src/undo-history.js), [src/core.js](../src/core.js), [scripts/catalog.mjs](../scripts/catalog.mjs), [scripts/activity-expansion.mjs](../scripts/activity-expansion.mjs) | Knockout and round-robin tournaments, score entry, standings, advancement, print/export and local saved sessions. Undo/redo retains up to 40 changes during the visit; reload clears history. Unfinished-match filtering changes the view only, and progress excludes byes. |
| Consent and measurement | [src/consent.js](../src/consent.js), [src/analytics.js](../src/analytics.js) | Read separate privacy choices and gate the production analytics loader. |
| Advertising | [src/network-ads.js](../src/network-ads.js), [src/promotions.js](../src/promotions.js) | Keep first-party promotions and provider-gated ad serving distinct. |
| Presentation | [src/style.css](../src/style.css), [src/promotions.css](../src/promotions.css), [src/workspace.css](../src/workspace.css) | Responsive layout, consent actions and printable output. |
| Localization | [src/i18n.js](../src/i18n.js), [src/content.js](../src/content.js), [scripts/activity-expansion.mjs](../scripts/activity-expansion.mjs) | Authoritative locale dictionaries and content fields; do not duplicate translated strings in docs. |
| Tests and audits | [tests/](../tests/), [scripts/audit.mjs](../scripts/audit.mjs) | Behavioral invariants, manifest integrity and generated SEO/link checks. |
| Operations | [scripts/indexnow.mjs](../scripts/indexnow.mjs), [scripts/search-health.mjs](../scripts/search-health.mjs), [.github/workflows/](../.github/workflows/) | Post-deploy submissions and scheduled public crawlability checks. |

Build-time content and metadata become static pages; browser modules add interaction. Consent state gates optional integrations. See [operations](operations.md) and [design](../DESIGN.md) for workflow and UX constraints.
