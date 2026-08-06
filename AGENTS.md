# Forms v2 — Agent instructions

## Purpose and scope

Forms v2 is a portable, accessible, four-stage inquiry prototype. Browser-facing
HTML, CSS, and JavaScript live only in `index.html`. Node files are limited to
local enrichment, regression tests, and Sites packaging.

## Non-negotiable implementation rules

1. Use plain HTML, CSS, and JavaScript; do not add frameworks, bundlers,
   TypeScript, external browser scripts, or browser stylesheets without approval.
2. Keep browser code in `index.html`: CSS in one `<style>` block and JavaScript
   in one `<script>` block. Do not add inline styles or inline event handlers.
3. Preserve existing behaviour unless the request explicitly changes it. Do not
   add unrelated features.
4. Keep layouts mobile-first, responsive, and free of horizontal overflow.
5. Use shared custom properties and reusable selectors for visual rules. Follow
   `DESIGN.md` when a request touches visual layout, typography, or spacing.
6. Use semantic HTML, visible labels connected to every input, useful focus
   states, accessible validation, and keyboard-operable controls.
7. Never expose secrets in browser code, log personal/form data, add tracking,
   or persist personal data in browser storage without explicit approval.
8. Use the existing shared elevation shadow-ring tokens for raised surfaces and
   controls. Do not add a separate visible border to an elevated surface.

## Approved project surface

```txt
index.html                 Browser UI, styles, and browser logic
README.md                  Behaviour, setup, limitations, and privacy notes
DESIGN.md                  Durable visual and responsive design rules
FEATURES.md                Canonical JavaScript feature register and contracts
dev-proxy.mjs              Local-only F7 enrichment adapter
tests/form-flow.spec.mjs   Optional regression coverage
scripts/build-site.mjs     Sites packaging and hosted enrichment adapter
.openai/hosting.json       Existing Sites project configuration
```

Do not introduce browser-facing files, assets, dependencies, or build layers
without approval. Keep `DEEPSEEK_API_KEY` server-side.

## Documentation

- Update `README.md` when user-visible behaviour, fields, validation, consent,
  submission, enrichment, privacy, or browser support changes.
- Update `DESIGN.md` when a durable visual or responsive rule changes.
- Before adding or materially changing a JavaScript feature, read `FEATURES.md`.
  Update its stable `F#` register entry and the matching inline code comment.
- Do not update documentation for a purely generated `dist/` refresh.

## Behaviour register

`FEATURES.md` is the canonical feature register. Do not renumber or reuse a
stable `F#` ID. For a new feature, add the next available ID, its exact
behaviour contract, and its code ownership to `FEATURES.md`; then add the
matching inline comment in browser code. Update `README.md` when the feature is
user-visible. Add or update regression coverage only when the user requests
testing.

## Quality and verification

- Do not run Playwright, browser automation, viewport sweeps, or other tests
  unless the user explicitly asks for testing, review, or verification.
- When testing is requested, run the smallest relevant check first. Run the
  full Playwright suite only when the user asks for a full review or specifically
  requests it.
- A publish request authorizes the production build, packaging, deployment, and
  a basic live availability check. It does not by itself authorize regression
  testing.
- Before handing off a code change, perform only lightweight checks appropriate
  to the requested scope (for example, syntax or diff validation), unless the
  user has opted out.

## Sites releases

Reuse `.openai/hosting.json` and the existing Sites project. Build/package the
exact source being released, include a generated `dist/server/index.js` refresh
when the build changes it, deploy using the existing access mode, and report the
live URL only after the deployment succeeds. Do not claim a deployment is live
until its root responds successfully.

## Style

Use 2-space indentation, double-quoted HTML attributes and JavaScript strings,
camelCase JavaScript names, and lowercase kebab-case CSS classes. Prefer small,
explicit functions and comments that explain intent rather than obvious code.
