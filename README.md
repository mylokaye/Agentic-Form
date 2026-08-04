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
2. **Personal details** — Phone, role, language, company name, industry, country, and State. Country sits beside Industry on wider screens and its list is alphabetised; State appears directly below it only when United States is selected and is disabled otherwise, so it is excluded from form submissions. Defaults include Manager, Aerospace, and Alabama; Country starts empty. Language is prefilled from the browser locale when recognised, and F1 can prefill Country and an international Phone prefix from the visitor's approximate IP country.
3. **Review and submit** — Newsletter opt-in, Submit Inquiry, GDPR note, and a closed-by-default **Debug** accordion containing enrichment fields. It does not duplicate earlier fields.

On screens below 48rem, the GDPR note text is 12px; its desktop size remains 14px.

The closed **Debug** accordion includes a read-only `currentUrl` field. F9 sets it to the full URL of the page that loaded the form, including any query string or hash. It is prepared for a future submission integration; the current prototype does not transmit it.

The newsletter card uses a CSS-only white geometric gradient background, with its opt-in content below. The banner keeps a 3:1 desktop proportion and a mobile-safe 8rem minimum height. F10 personalizes its header as `Content tailored for you, First name.` using the entered First name; it falls back to `Content tailored for you.` when empty. F11 displays New products & promotions and Shutdown and critical alerts in Inter at 12px; Spare parts & service reminders appears only when Inquiry subtype is Spare parts. Its supporting sentence uses `#4A5565`. The checkbox is optional and unchecked by default.

## Validation and enrichment

- First name, last name, and email are required before leaving Stage 1.
- A failed required-field validation uses a red edge on the affected field, which clears once it is corrected; Stage 1 does not show a generic validation banner.
- Returning from Stage 2 places keyboard focus on First name, the first field in Stage 1.
- Email-domain suggestions fill only empty Website and Company name fields. Website suggestions use an `https://` URL; untouched suggestions refresh when Email changes, manual edits remain unchanged, and personal names are not inferred.
- Enrichment requests return `industry`, `about`, `urgency`, `sentiment`, and `query` when available.
- Requests time out after 20 seconds, stale responses are ignored, and failures allow the form to continue.
- **F1 country lookup** makes one best-effort browser request to FreeIPAPI when the form loads. It uses a recognised ISO country code to prefill Country and the first valid international dialling code to prefill an empty Phone number. It leaves both fields empty on failure and never overwrites a visitor's entered Country or Phone number.
- F1 writes generic `[F1]` technical status messages to the browser console. Those messages never include an IP address, country, form value, or submission data.
- Language uses the browser's local `navigator.language` preference, converting its base locale to an English language name (for example, `de-DE` becomes German). It makes no network request and remains editable.
- Submit Inquiry is a local prototype confirmation only. No form data is sent to a submission backend.
- **F9 current URL capture** records the page URL in the read-only `currentUrl` field in the Debug accordion on load. It does not log, store, or send the value.
- **F10 personalized newsletter heading** updates the Newsletter banner with the editable First name. It does not log, store, or send the name.
- **F11 conditional newsletter topics** changes the Spare parts topic from the editable Inquiry subtype. It does not log, store, or send the subtype.

## Known limitations

- F1 location and dialling-prefix suggestions are approximate, depend on FreeIPAPI availability, and can be affected by VPNs, mobile networks, or shared connections.
- Browser language is a device preference, not a confirmed language preference; visitors can edit the suggested value.

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

The suite covers validation, browser-language prefill, F1 country lookup recovery and manual overrides, enrichment recovery, consent persistence, focus movement, and responsive overflow across Chrome, mobile Chrome, Firefox, and WebKit.

## Privacy and support

- No first-party analytics, cookies, tracking pixels, localStorage, or sessionStorage are used.
- The read-only Current URL value may include query-string or hash content. Do not place personal or sensitive information in form URLs.
- F1 makes a direct request to FreeIPAPI to infer a country from the visitor's IP address. The form does not retain or log that IP address or the lookup result; FreeIPAPI is a third-party service with its own privacy policy.
- Do not log personal data or submission payloads.
- Enrichment is advisory and may be unavailable; review its values before production use.
- The form supports current Chrome, Edge, Safari, Firefox, Mobile Safari, and Chrome for Android.

## Design notes

The form uses Inter, shared colour and elevation tokens, and a mobile-first layout. On mobile, paired Back and Continue actions stay on one row: Back uses a smaller share and Continue fills the remaining space. Stage 2 actions sit 45px below the final visible company field. At wider widths, fields use responsive grids and the enrichment fields use three columns below About.

## Maintenance

Keep browser-facing HTML, CSS, and JavaScript in `index.html`. Update this README whenever fields, validation, consent, submission, or enrichment behaviour changes.
