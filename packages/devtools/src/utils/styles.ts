// The tools' stylesheet, scoped to the element's shadow root, so nothing reaches the host page and nothing of the
// page's reaches in. `all: initial` resets inherited properties, and custom properties still inherit, so a site's own
// `--druxt-*` values flow in through the fallbacks below. The derived values are private.

export const DRUXT_DEVTOOLS_CSS = `
:host {
  all: initial;
  display: block;
  height: 100%;
  container-type: inline-size;
  --dt-ink: var(--druxt-ink, #16212b);
  --dt-surface: var(--druxt-surface, #ffffff);
  --dt-accent: var(--druxt-accent, #1a6ca8);
  --dt-danger: var(--druxt-danger, #b3261e);
  --dt-success: var(--druxt-success, #0c7565);
  --dt-focus: var(--druxt-focus, var(--dt-accent));
  --dt-space: var(--druxt-space, 0.5rem);
  --dt-radius: var(--druxt-radius, 6px);
  --dt-font: var(--druxt-font, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  --dt-mono: var(--druxt-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  --druxt-mark-ink: #2f495e;
  font: 13px/1.45 var(--dt-font);
  color: var(--dt-ink);
  background: var(--dt-surface);
}
:host([theme="dark"]) {
  --dt-ink: var(--druxt-ink, #e5ecf1);
  --dt-surface: var(--druxt-surface, #15202a);
  --dt-accent: var(--druxt-accent, #3498db);
  --dt-danger: var(--druxt-danger, #f2827a);
  --dt-success: var(--druxt-success, #3fbfa8);
  --druxt-mark-ink: #e5ecf1;
}
@media (prefers-color-scheme: dark) {
  :host(:not([theme="light"])) {
    --dt-ink: var(--druxt-ink, #e5ecf1);
    --dt-surface: var(--druxt-surface, #15202a);
    --dt-accent: var(--druxt-accent, #3498db);
    --dt-danger: var(--druxt-danger, #f2827a);
    --dt-success: var(--druxt-success, #3fbfa8);
    --druxt-mark-ink: #e5ecf1;
  }
}
.dt {
  --dt-muted: color-mix(in srgb, var(--dt-ink) 70%, transparent);
  --dt-rule: color-mix(in srgb, var(--dt-ink) 16%, transparent);
  --dt-edge: color-mix(in srgb, var(--dt-ink) 55%, transparent);
  --dt-tint: color-mix(in srgb, var(--dt-accent) 9%, var(--dt-surface));
  --dt-side: color-mix(in srgb, var(--dt-ink) 4%, var(--dt-surface));
  --dt-selected: color-mix(in srgb, var(--dt-accent) 14%, var(--dt-surface));
  --dt-track: color-mix(in srgb, var(--dt-ink) 8%, transparent);
  display: grid;
  height: 100%;
  grid-template-columns: 180px minmax(0, 1fr);
  background: var(--dt-surface);
}
*, *::before, *::after { box-sizing: border-box; }
h2, h3, p, ol, ul, dl, dd, pre, figure { margin: 0; }
ol, ul { padding: 0; }
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; }
a { color: var(--dt-accent); text-underline-offset: 2px; }
code, pre, .dt-mono { font-family: var(--dt-mono); font-size: 12px; }
summary { list-style: none; cursor: pointer; }
summary::-webkit-details-marker { display: none; }
:focus-visible { outline: 2px solid var(--dt-focus); outline-offset: 2px; }
.dt-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

.dt-nav {
  display: flex;
  flex-direction: column;
  gap: var(--dt-space);
  min-height: 0;
  padding: 12px 8px;
  background: var(--dt-side);
  border-right: 1px solid var(--dt-rule);
}
.dt-title { display: flex; align-items: center; gap: 8px; padding: 0 8px 4px; font-weight: 700; font-size: 14px; }
.dt-title .dt-page { display: none; }
[role="tablist"] { display: flex; flex-direction: column; gap: 2px; }
.dt-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 30px;
  padding: 4px 8px;
  border: 0;
  border-radius: var(--dt-radius);
  background: transparent;
  text-align: left;
  white-space: nowrap;
}
.dt-tab:hover { background: var(--dt-track); }
.dt-tab[aria-selected="true"] { font-weight: 600; background: var(--dt-selected); }
.dt-tab .dt-short { display: none; }
.dt-count { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--dt-muted); font-size: 12px; }
.dt-nav > .dt-page { margin-top: auto; padding: 0 8px; overflow-wrap: anywhere; font-family: var(--dt-mono); font-size: 11px; color: var(--dt-muted); }

.dt-panel { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
.dt-head { display: grid; gap: 2px; padding: 16px 20px 12px; }
.dt-head h2 { font-size: 14px; font-weight: 600; }
.dt-lede { color: var(--dt-muted); max-width: 70ch; }
.dt-filter { display: flex; align-items: center; gap: 6px; margin: 0 20px 8px; padding: 0 8px; height: 32px; border: 1px solid var(--dt-edge); border-radius: var(--dt-radius); color: var(--dt-muted); }
.dt-filter input { flex: 1; min-width: 0; height: 100%; border: 0; background: transparent; outline: 0; color: var(--dt-ink); font-family: var(--dt-mono); font-size: 12px; }
.dt-filter:focus-within { box-shadow: 0 0 0 2px var(--dt-surface), 0 0 0 4px var(--dt-focus); }
.dt-list { flex: 1; min-height: 0; overflow: auto; padding: 0 20px 16px; }
.dt-foot { padding: 8px 20px; border-top: 1px solid var(--dt-rule); color: var(--dt-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.dt-nomatch { padding: 12px 0; color: var(--dt-muted); }

.dt-group {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 0 4px;
  background: var(--dt-surface);
  font: 600 11px/1.4 var(--dt-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--dt-muted);
}
.dt-entry { border-bottom: 1px solid var(--dt-rule); }
.dt-entry > summary { display: flex; align-items: center; gap: 8px; min-height: 36px; padding: 6px 0; }
.dt-chevron { flex: none; transition: transform 0.15s; color: var(--dt-muted); }
.dt-entry[open] > summary .dt-chevron { transform: rotate(90deg); }
.dt-name { font-weight: 600; }
.dt-sub { display: block; font-family: var(--dt-mono); font-size: 11px; color: var(--dt-muted); font-weight: 400; }
.dt-entry > summary .dt-count { flex: none; }
.dt-entry-body {
  display: grid;
  gap: 12px 24px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  padding: 4px 0 16px 22px;
}
.dt-caption { margin-bottom: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--dt-muted); }
.dt-candidates { display: grid; gap: 2px; padding-left: 20px; font-family: var(--dt-mono); font-size: 12px; }
.dt-explain { margin-top: 8px; color: var(--dt-muted); }

.dt-create { display: grid; gap: 8px; align-content: start; }
.dt-row-controls { display: flex; gap: 8px; }
.dt-select { position: relative; flex: 1; min-width: 0; }
.dt-select select {
  appearance: none;
  width: 100%;
  height: 32px;
  padding: 0 28px 0 8px;
  border: 1px solid var(--dt-edge);
  border-radius: var(--dt-radius);
  background: var(--dt-surface);
  font-family: var(--dt-mono);
  font-size: 12px;
}
.dt-select svg { position: absolute; right: 8px; top: 9px; pointer-events: none; color: var(--dt-muted); }
.dt-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--dt-accent);
  border-radius: var(--dt-radius);
  background: var(--dt-accent);
  color: var(--dt-surface);
  font: 600 13px/1 var(--dt-font);
}
.dt-button:focus-visible, .dt-select select:focus-visible { outline: 0; box-shadow: 0 0 0 2px var(--dt-surface), 0 0 0 4px var(--dt-focus); }
.dt-button-secondary { justify-self: start; height: 28px; padding: 0 10px; background: transparent; color: var(--dt-ink); border-color: var(--dt-edge); font-size: 12px; font-weight: 500; }
.dt-create[data-state="busy"] select { border-color: color-mix(in srgb, var(--dt-ink) 30%, transparent); color: var(--dt-muted); }
.dt-create[data-state="busy"] .dt-button { cursor: progress; border-color: transparent; background: color-mix(in srgb, var(--dt-accent) 55%, var(--dt-surface)); }
.dt-create[data-state="busy"] button { opacity: 0.7; }
.dt-preview { border-radius: var(--dt-radius); background: var(--dt-tint); overflow: hidden; }
.dt-path { padding: 6px 10px 0; font-family: var(--dt-mono); font-size: 11px; color: var(--dt-muted); overflow-wrap: anywhere; }
.dt-preview pre { padding: 6px 10px 10px; overflow: auto; max-height: 200px; }
.dt-result { display: flex; gap: 6px; align-items: flex-start; }
.dt-result svg { flex: none; margin-top: 1px; }
.dt-create[data-state="done"] .dt-result { color: var(--dt-success); }
.dt-create[data-state="refused"] .dt-result { color: var(--dt-danger); }
.dt-then { display: block; color: var(--dt-ink); }
.dt-spinner { flex: none; animation: dt-spin 0.8s linear infinite; }
@keyframes dt-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .dt-spinner { animation: none; }
  .dt-chevron { transition: none; }
}

.dt-rows { display: grid; }
.dt-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 12px; padding: 8px 0; border-bottom: 1px solid var(--dt-rule); }
.dt-row .dt-detail { grid-column: 1 / -1; color: var(--dt-muted); }
.dt-status { font-family: var(--dt-mono); font-size: 12px; color: var(--dt-danger); }
.dt-quiet-link { padding-top: 12px; }

.dt-module > summary { display: grid; grid-template-columns: auto minmax(0, 1.4fr) minmax(0, 0.8fr) minmax(0, 1.2fr); align-items: center; gap: 8px; }
.dt-module .dt-meta { color: var(--dt-muted); font-weight: 400; }
.dt-state { display: inline-flex; align-items: center; gap: 6px; }
.dt-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex: none; }
.dt-tone-ready { color: var(--dt-success); }
.dt-tone-default { color: var(--dt-accent); }
.dt-tone-error { color: var(--dt-danger); }
.dt-wrapper { font-family: var(--dt-mono); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dt-pairs { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 8px; font-family: var(--dt-mono); font-size: 12px; }
.dt-pairs dt { color: var(--dt-muted); }
.dt-pairs dd { overflow-wrap: anywhere; }
.dt-none { color: var(--dt-muted); font-style: italic; }
.dt-notes { grid-column: 1 / -1; display: grid; gap: 4px; list-style: none; }
.dt-note { padding: 6px 10px; border-left: 2px solid var(--dt-accent); background: var(--dt-tint); border-radius: 0 var(--dt-radius) var(--dt-radius) 0; }
.dt-note .dt-detail { display: block; color: var(--dt-muted); }

.dt-axis { display: flex; justify-content: space-between; margin-left: 50%; padding: 4px 0; font-size: 11px; color: var(--dt-muted); font-variant-numeric: tabular-nums; }
.dt-request { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 2px 12px; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--dt-rule); }
.dt-kind { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--dt-muted); }
.dt-request .dt-path-line { display: flex; gap: 8px; min-width: 0; }
.dt-request .dt-path-line code { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dt-timing { margin-left: auto; flex: none; font-family: var(--dt-mono); font-size: 12px; font-variant-numeric: tabular-nums; color: var(--dt-muted); }
.dt-track { position: relative; height: 6px; border-radius: 3px; background: var(--dt-track); }
.dt-bar { position: absolute; top: 0; height: 100%; min-width: 2px; border-radius: 3px; background: var(--dt-accent); }
.dt-bar-error { background: var(--dt-danger); }
.dt-bar-store { background: color-mix(in srgb, var(--dt-ink) 45%, transparent); }
.dt-source { grid-column: 2; font-size: 11px; color: var(--dt-muted); }
.dt-partial { color: var(--dt-danger); }

.dt-legend { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 20px 8px; }
.dt-chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border: 1px solid var(--dt-ink); border-radius: 999px; font-size: 11px; white-space: nowrap; }
.dt-chip-site { border-color: var(--dt-accent); color: var(--dt-accent); }
.dt-chip-default { border-style: dashed; color: var(--dt-muted); border-color: var(--dt-edge); }
.dt-setting { display: grid; grid-template-columns: 1fr 1.4fr 120px; gap: 4px 12px; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--dt-rule); font-family: var(--dt-mono); font-size: 12px; }
.dt-setting .dt-key { font-weight: 700; overflow-wrap: anywhere; }
.dt-setting .dt-value { overflow-wrap: anywhere; }
.dt-setting .dt-chip { justify-self: end; font-family: var(--dt-font); }

.dt-block { padding: 8px 0 12px; }
.dt-block + .dt-block { border-top: 1px solid var(--dt-rule); }
.dt-table { width: 100%; border-collapse: collapse; font-family: var(--dt-mono); font-size: 12px; }
.dt-table th { text-align: left; font: 600 11px/1.4 var(--dt-font); text-transform: uppercase; letter-spacing: 0.04em; color: var(--dt-muted); }
.dt-table th, .dt-table td { padding: 4px 8px 4px 0; border-bottom: 1px solid var(--dt-rule); overflow-wrap: anywhere; vertical-align: top; }
.dt-tree { list-style: none; padding-left: 14px; font-family: var(--dt-mono); font-size: 12px; }
.dt-block > .dt-tree { padding-left: 0; }
.dt-tree-key { color: var(--dt-muted); }
.dt-tree-value { overflow-wrap: anywhere; }
.dt-actions { display: grid; gap: 8px; padding: 4px 0 12px; }
.dt-action { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.dt-action[data-state="done"] .dt-result { color: var(--dt-success); }
.dt-action[data-state="failed"] .dt-result { color: var(--dt-danger); }

.dt-empty {
  display: grid;
  justify-items: center;
  gap: 6px;
  margin: 8px 20px 20px;
  padding: 32px 20px;
  border: 1px dashed color-mix(in srgb, var(--dt-ink) 30%, transparent);
  border-radius: 8px;
  text-align: center;
}
.dt-empty svg { color: var(--dt-muted); }
.dt-empty-title { font-weight: 600; }
.dt-empty p:last-child { max-width: 40ch; color: var(--dt-muted); }
.dt-waiting { padding: 20px; color: var(--dt-muted); }

@container (width < 600px) {
  .dt { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); }
  .dt-nav { padding: 8px 12px 0; gap: 4px; border-right: 0; border-bottom: 1px solid var(--dt-rule); }
  .dt-title { padding: 0; }
  .dt-title .dt-page { display: block; margin-left: auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 400 11px/1.4 var(--dt-mono); color: var(--dt-muted); }
  .dt-nav > .dt-page { display: none; }
  [role="tablist"] { flex-direction: row; gap: 16px; overflow-x: auto; }
  .dt-tab { width: auto; padding: 6px 0; border-radius: 0; border-bottom: 2px solid transparent; background: transparent; }
  .dt-tab:hover { background: transparent; }
  .dt-tab[aria-selected="true"] { background: transparent; border-bottom-color: var(--dt-accent); }
  .dt-tab .dt-long { display: none; }
  .dt-tab .dt-short { display: inline; }
  .dt-count { margin-left: 0; }
  .dt-head { padding: 12px 12px 8px; }
  .dt-list { padding: 0 12px 12px; }
  .dt-filter, .dt-legend { margin-left: 12px; margin-right: 12px; }
  .dt-foot { padding: 8px 12px; }
  .dt-module > summary { grid-template-columns: auto minmax(0, 1fr) auto; }
  .dt-module .dt-wrapper { grid-column: 2 / -1; }
  .dt-setting { grid-template-columns: minmax(0, 1fr) auto; }
  .dt-setting .dt-value { grid-column: 1 / -1; grid-row: 2; }
  .dt-request { grid-template-columns: minmax(0, 1fr); }
  .dt-source { grid-column: 1; }
  .dt-axis { margin-left: 0; }
}
`
