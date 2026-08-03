# Forms v2

A portable, three-step inquiry form built with plain HTML, CSS, and JavaScript. The browser UI lives in `index.html`; the optional enrichment service runs through a local proxy or the hosted Sites worker.

## Files

- `index.html` — form UI, styles, and browser logic.
- `dev-proxy.mjs` — local company-enrichment proxy.
- `scripts/build-site.mjs` — builds the Sites worker and hosted enrichment route.
- `tests/form-flow.spec.mjs` — Playwright regression tests.
- `AGENTS.md` — implementation standards.

## Form flow

1. **Inquiry** — First name, last name, email, inquiry, business, inquiry type, and inquiry subtype. The three personal fields have configured defaults. Continue derives company details and starts enrichment.
2. **Personal details** — Phone, role, company name, industry, country, and state. Defaults include Manager, Aerospace, United States, and Alabama.
3. **Final step** — Newsletter opt-in, Submit Inquiry, GDPR note, and a closed-by-default **Enriched details** accordion. It does not duplicate earlier fields.

On screens below 48rem, the GDPR note text is 12px; its desktop size remains 14px.

The newsletter card uses `Newsletter.png` as a full-width banner, with its opt-in content below. The checkbox is optional and unchecked by default.

## Validation and enrichment

- First name, last name, and email are required before leaving Stage 1.
- Returning from Stage 2 places keyboard focus on First name, the first field in Stage 1.
- Email-derived suggestions only fill empty fields; manual edits remain unchanged.
- Enrichment requests return `industry`, `about`, `urgency`, `sentiment`, and `query` when available.
- Requests time out after 20 seconds, stale responses are ignored, and failures allow the form to continue.
- Submit Inquiry is a local prototype confirmation only. No form data is sent to a submission backend.

## Run locally

Start the static form server:

```sh
python3 -m http.server 8000
```

For local enrichment, run the proxy separately with a server-side key:

```sh
DEEPSEEK_API_KEY="your-key-here" node dev-proxy.mjs
```

You may instead place the key in an uncommitted `.env.local`. Never add it to `index.html` or version control.

## Test

```sh
npm install
python3 -m http.server 8000
npm run test:e2e
```

Test the hosted form:

```sh
BASE_URL="https://forms-v2-mylo.v6pdwnhvws.chatgpt.site" npm run test:e2e
```

The suite covers validation, enrichment recovery, consent persistence, focus movement, and responsive overflow across Chrome, mobile Chrome, Firefox, and WebKit.

## Privacy and support

- No analytics, cookies, tracking pixels, localStorage, or sessionStorage are used.
- Do not log personal data or submission payloads.
- Enrichment is advisory and may be unavailable; review its values before production use.
- The form supports current Chrome, Edge, Safari, Firefox, Mobile Safari, and Chrome for Android.

## Design notes

The form uses Inter, shared colour and elevation tokens, and a mobile-first layout. On mobile, paired Back and Continue actions stay on one row: Back uses a smaller share and Continue fills the remaining space. At wider widths, fields use responsive grids and the Enriched details fields use three columns below About.

## Maintenance

Keep browser-facing HTML, CSS, and JavaScript in `index.html`. Update this README whenever fields, validation, consent, submission, or enrichment behaviour changes.
