# Forms v2

Forms v2 is a lightweight, portable inquiry form. Its UI, styles, and browser logic live in one readable file: `index.html`. No frontend framework is required. `package.json` and `scripts/build-site.mjs` build the small server-side Sites worker that serves the form and protects its DeepSeek integration.

## Project Files

- `index.html` — the form implementation.
- `dev-proxy.mjs` — optional local company-enrichment proxy.
- `scripts/build-site.mjs` — creates the dependency-free Sites worker with the hosted enrichment route.
- `tests/form-flow.spec.mjs` — Playwright regression coverage for the main form flow.
- `playwright.config.mjs` — local and live-browser test configuration.
- `package.json` — deployment build and browser-test commands.
- `README.md` — this guide.
- `AGENTS.md` — project implementation standards.

## Form Flow

1. **Inquiry** — First name, Last name, and Email address are required and appear before the optional Inquiry textarea (`How can we help you today?`). Business (**Google**), Inquiry type (**Aftermarket**), and Inquiry subtype (**Spare parts**) follow the Inquiry field. The form opens with configured default values for the three required personal fields. The informational routing prompt is retained in the source but hidden from this step for now. At 768px and above, the three personal fields share one row in that order, and the three inquiry selectors share a row below the full-width Inquiry field. Continue becomes available when those three required values are valid, derives the hidden Website and Company name values, and starts company enrichment. While enrichment runs, Continue stays labelled “Continue” and is temporarily disabled to prevent duplicate requests.
2. **Personal details** — Phone number and Role. A following **Company details** subsection contains Company name and an Industry dropdown with **Aerospace** selected by default and **Manufacturing** as the other option. Its second row contains Country (**United States**) and State (**Alabama**) dropdowns. All Company details dropdowns use the stated defaults. Role is a dropdown with **Manager** selected by default and **Assistant** as the other option.
3. **Final step** — does not repeat the fields completed in Stages 1 and 2. The step begins with the `Subscribe and stay informed` newsletter card, where the full-width `Newsletter.png` banner reaches the card edges and the text-and-opt-in content retains its 12px inset. A small Back button returns to Stage 2 for edits. The step offers **Submit Inquiry**, followed by a lock-marked GDPR processing note beginning “By submitting this form”. Submission displays a clear local prototype confirmation and does not send information to a backend. The **Enriched details** accordion is closed by default and contains About, Urgency, Sentiment, Query, Enriched industry, and Website. At 768px and above, its expanded About field remains full width and the remaining fields use three columns.

There are no `type="hidden"` fields. Fields shown in the `Hidden` section remain visible in the source and UI on the confirmation step.

The progress indicator sits below the white form container. Every section title uses the shared `#4d4c4c`, 700-weight title tokens and bottom spacing before its first field. All visible form containers, fields, buttons, alerts, and progress markers use the shared 10px corner radius. The form container, inputs, alerts, buttons, and validation states use shared elevation tokens that combine their hairline edge and shadow into one continuous treatment rather than pairing a border with a shadow. Only a valid Email field uses the 2px `#00B77D` validation edge. The guidance, Email feedback, and newsletter alerts share 14px text, a 42px minimum height, symmetric vertical padding, and icon-to-text spacing. Email feedback appears as a pastel warning with a decorative icon; enrichment failures are logged generically to the browser console. On screens 768px and wider, Stage 1 Continue spans one field column while Stage 2 Continue spans the final two columns. On smaller screens, a lone action fills the width; when Back and Continue are both visible, they share one row with Back reduced by 20% from its former one-third share and Continue filling the remainder.

## Validation and Enrichment

- Email uses light browser validation. A valid email suggests First name, Last name, Website, and Company name only when those fields are empty; manually entered values are preserved.
- On the personal-details step, Continue requires First name, Last name, Website, and Company name.
- Completing the Inquiry step calls the same-origin hosted `/enrich-company` route with the email-derived company URL and inquiry message. Stage 2 detail edits do not interrupt the request; it times out after 20 seconds in the browser and ignores stale responses.
- The proxy can return `industry`, `about`, `urgency`, `sentiment`, and `query` as strings. If required enrichment information is unavailable, enrichment is skipped and the form continues for manual review. Unavailable-proxy, timeout, and other enrichment failures are logged generically to the browser console without form data.
- Submit Inquiry currently logs a local prototype confirmation to the browser console only; it does not send the form to a backend.

## Local Enrichment Setup

The published Sites form uses its server-side `/enrich-company` route. Add the DeepSeek key in Sites as a secret named `DEEPSEEK_API_KEY` (preferred) or retain the existing secret named `deepseek`; it is never sent to the browser. The route accepts only bounded JSON requests, rejects non-public company URLs, uses an 8-second DeepSeek timeout, and applies a per-IP request limit.

For local development, start the form server and proxy separately:

```sh
python3 -m http.server 8000
```

```sh
DEEPSEEK_API_KEY="your-key-here" node dev-proxy.mjs
```

Alternatively, store `DEEPSEEK_API_KEY` in an uncommitted `.env.local` file before running `node dev-proxy.mjs`.

The browser posts to `http://127.0.0.1:8787/enrich-company`. Keep the API key out of `index.html` and out of version control.

## Privacy and Limitations

- The optional newsletter opt-in is unchecked by default and is not sent to a backend. No analytics, cookies, tracking pixels, localStorage, or sessionStorage are implemented.
- Do not log personal data or submission payloads to the console.
- DeepSeek output and email-derived details are suggestions and should be reviewed.
- The form has no live submission backend. Playwright regression tests cover required Stage 1 validation, edited-name preservation, confirmation editing and submission feedback, successful and stale enrichment responses, unavailable enrichment recovery, newsletter persistence, focus handoff, and horizontal-overflow checks in Chrome, mobile Chrome, Firefox, and WebKit.

## Browser Regression Tests

Install test dependencies once, then run the suite against a local server or the live site:

```sh
npm install
python3 -m http.server 8000
npm run test:e2e
```

To test the published form, use its URL explicitly:

```sh
BASE_URL="https://forms-v2-mylo.v6pdwnhvws.chatgpt.site" npm run test:e2e
```

The suite uses temporary non-personal test input and intentionally stops before Submit Inquiry.

## Design and Browser Support

The form is mobile-first, has a 700px maximum shell width, and uses the Google Fonts Inter family (weights 400, 500, and 700), with Arial and Helvetica as fallbacks. Field labels use the shared `#101828` label-colour token and regular 400 weight. It supports current Chrome, Edge, Safari, Firefox, Mobile Safari, and Chrome for Android. Check layouts at 320px, 375px, 390px, 768px, 1024px, and desktop widths.

Buttons share a 50px height. Ready Continue and Submit Inquiry use the same shared `#00B77D` primary treatment. Buttons pair visible text with decorative icons: Back uses a left chevron, Continue uses a right chevron, and Submit Inquiry uses a checkmark. The final `Final step` heading uses the shared `#00B77D` green token at 20px; other section titles use the shared title colour and size. On mobile, a lone form action is full-width; paired Back and Continue actions stay on one row in a one-third/two-thirds split. At 768px and above, Back is 100px, Stage 1 Continue spans one field column, Stage 2 Continue spans the final two field columns, and Submit Inquiry remains full-width. Dropdowns use a shared padded chevron aligned with their value text, and the newsletter checkbox uses compact title-to-checkbox spacing. Green UI accents use the shared `#00B77D` token. Stage changes move keyboard focus to the newly displayed stage.

## Maintenance Notes

Keep all browser-facing HTML, CSS, and JavaScript in `index.html`. Preserve visible labels, keyboard access, focus states, and responsive layouts. If fields, validation, consent, submission, or enrichment behaviour changes, update this README in the same change.

## Recent Changes

- Added `Newsletter.png` to the generated Sites worker asset map and versioned its card URL so the hosted newsletter banner bypasses the prior cached 404.
- Fixed the first-name field markup and enabled the local enrichment proxy for both `127.0.0.1:8000` and `localhost:8000`.
- Hid the Stage 1 routing guidance prompt while retaining it in the source for later reuse.
- Reduced the mobile Back action by 20% and allocated the remaining row space to Continue.
- Made Enriched details a default-closed, native accessible accordion on the Final step.
- Reduced the Final step heading-to-newsletter gap to 12px.
- Renamed the Stage 3 heading to `Final step` and removed the duplicate newsletter content heading.
- Removed the newsletter banner's outer padding while retaining the text-content inset.
- Squared the bottom corners of the Stage 3 newsletter banner image.
- Reworked the Stage 3 newsletter card with a full-width banner image above its content.
- Moved the newsletter card to the top of the Stage 3 confirmation view.
- Removed duplicate Stage 1 and Stage 2 fields from the Stage 3 confirmation view.
- Moved Business, Inquiry type, and Inquiry subtype to Stage 1 below Inquiry.
- Reduced the shared field-label weight to regular 400.
- Added the shared `#101828` field-label colour token.
- Reduced newsletter-card padding to 12px on every side.
- Capped the newsletter image at 123.34px while preserving its one-third responsive width on narrow cards.
- Added configured Stage 1 defaults for first name, last name, and email address.
- Added the supplied Newsletter image as the left third of the newsletter card, with its content on the right.
- Switched the form typography to Google Fonts Inter, with local sans-serif fallbacks.
- Added shared elevation tokens so raised surfaces use one continuous hairline-and-shadow treatment.
- Extended the shared elevation treatment to inputs, alerts, buttons, and validation states.
- Kept mobile Back and Continue actions together in a one-third/two-thirds row.
- Replaced the compact newsletter alert with a benefit-led subscription card using the approved copy.
- Simplified this guide around the three-step user flow and removed the redundant field-by-field inventory.
- Documented the current responsive action-button sizes, shared green token, feedback placement, and Manager/Assistant Role selector.
- Preserved manually entered Stage 1 name and company details when email-derived suggestions are applied.
- Added repeatable Playwright browser regression coverage for the main form flow.
