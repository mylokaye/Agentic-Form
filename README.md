# Forms v2

A portable, four-step inquiry form built with plain HTML, CSS, and JavaScript. The browser UI lives in `index.html`; the optional enrichment service runs through a local proxy or the hosted Sites worker.

## Files

- `index.html` — form UI, styles, browser logic, and the Google Fonts Inter stylesheet link.
- `dev-proxy.mjs` — local company-enrichment proxy.
- `scripts/build-site.mjs` — builds the Sites worker and hosted enrichment route.
- `tests/form-flow.spec.mjs` — Playwright regression tests.
- `AGENTS.md` — implementation standards.
- `DESIGN.md` — visual and responsive design direction.

## Form flow

1. **Inquiry** — First name, last name, email, inquiry, business, inquiry type, and inquiry subtype. The three personal fields have configured defaults. Continue derives company details and starts enrichment.
2. **Personal details** — Phone, role, language, company name, industry, country, and State. Country sits beside Industry on wider screens and its list is alphabetised; State appears directly below it only when United States is selected and is disabled otherwise, so it is excluded from form submissions. Defaults include Manager, Aerospace, and Alabama; Country starts empty. Language is prefilled from the browser locale when recognised, and F1 can prefill Country and an international Phone prefix from the visitor's approximate IP country.
3. **Review and submit** — Newsletter opt-in, GDPR note above the action buttons, Submit Inquiry, and a closed-by-default **Debug** accordion containing enrichment fields. It does not duplicate earlier fields.
4. **Feedback** — A prototype-only inquiry thank-you screen with five clickable stars. Stage 4 omits in-form GDPR and Debug controls, and hides the progress bar. Clicking any star changes the screen to `Thank you for your feedback.` without sending or storing the rating.

The GDPR consent note uses 12px text at every viewport width and reads: `Personal information is processed in accordance with GDPR & our Privacy Policy.` The Privacy Policy is currently plain text because no destination URL is configured.

The standalone **Debug** panel appears below the progress bar only when the URL includes `?debug`. It includes a read-only `currentUrl` field. F9 sets it to the full URL of the page that loaded the form, including any query string or hash. It is prepared for a future submission integration; the current prototype does not transmit it.

Stage changes use brief entry motion and a progress-bar width transition. The action row remains still. The feedback thank-you message also enters smoothly. These effects are disabled when the browser requests reduced motion.

The newsletter card uses a CSS-only white geometric gradient across the full card, with Subscribe directly after and aligned to the newsletter topics. The banner and its contents use `#4a5565`; Subscribe has 19px vertical padding. The desktop banner is 212px tall and the mobile banner remains content-sized with an 8rem minimum height. F10 personalizes its 22px header as `Content tailored for you, First name.` using the entered First name; it falls back to `Content tailored for you.` when empty. F11 displays New products & promotions and Shutdown and critical alerts in the shared 14px body size; Spare parts & service reminders appears only when Inquiry subtype is Spare parts. The checkbox is optional and unchecked by default.

## Validation and enrichment

- First name, last name, and email are required before leaving Stage 1.
- A failed required-field validation uses a red edge on the affected field, which clears once it is corrected. The form does not show a shared status banner.
- Returning from Stage 2 places keyboard focus on First name, the first field in Stage 1.
- Email-domain suggestions fill only empty Website and Company name fields. Website suggestions use an `https://` URL; untouched suggestions refresh when Email changes, manual edits remain unchanged, and personal names are not inferred.
- Enrichment requests return `industry`, `about`, `urgency`, `sentiment`, and `query` when available.
- Requests time out after 20 seconds, stale responses are ignored, and failures allow the form to continue.
- **F1 country lookup** makes one best-effort browser request to FreeIPAPI when the form loads. It uses a recognised ISO country code to prefill Country and the first valid international dialling code to prefill an empty Phone number. It leaves both fields empty on failure and never overwrites a visitor's entered Country or Phone number.
- F1 writes generic `[F1]` technical status messages to the browser console. Those messages never include an IP address, country, form value, or submission data.
- Language uses the browser's local `navigator.language` preference, converting its base locale to an English language name (for example, `de-DE` becomes German). It makes no network request and remains editable.
- Submit Inquiry is a local prototype action only. It advances to Stage 4 and emits a generic technical console message; no form data is sent to a submission backend.
- **F13 feedback rating** displays five keyboard-accessible clickable star buttons. Clicking any star reveals the feedback thank-you message; the rating is not recorded, stored, or transmitted.
- **F9 debug-gated current URL capture** records the page URL in the read-only `currentUrl` field on load. The standalone Debug panel is visible only with `?debug`; F9 does not log, store, or send the value.
- **F10 personalized newsletter heading** updates the Newsletter banner with the editable First name. It does not log, store, or send the name.
- **F11 conditional newsletter topics** changes the Spare parts topic from the editable Inquiry subtype. It does not log, store, or send the subtype.

## Known limitations

- F1 location and dialling-prefix suggestions are approximate, depend on FreeIPAPI availability, and can be affected by VPNs, mobile networks, or shared connections.
- Browser language is a device preference, not a confirmed language preference; visitors can edit the suggested value.
- The Stage 4 star rating is a visual prototype only and is not connected to a survey, CRM, analytics, or submission service.

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

The suite covers validation, browser-language prefill, F1 country lookup recovery and manual overrides, enrichment recovery, consent persistence, focus movement, the prototype feedback transition, and responsive overflow across Chrome, mobile Chrome, Firefox, and WebKit.

## Privacy and support

- No first-party analytics, cookies, tracking pixels, localStorage, or sessionStorage are used.
- Inter is loaded from Google Fonts for typography; loading the form makes requests to Google font domains, which are subject to Google's privacy terms.
- The read-only Current URL value may include query-string or hash content. Do not place personal or sensitive information in form URLs.
- F1 makes a direct request to FreeIPAPI to infer a country from the visitor's IP address. The form does not retain or log that IP address or the lookup result; FreeIPAPI is a third-party service with its own privacy policy.
- Do not log personal data or submission payloads.
- Enrichment is advisory and may be unavailable; review its values before production use.
- The form supports current Chrome, Edge, Safari, Firefox, Mobile Safari, and Chrome for Android.

## Design notes

See `DESIGN.md` for the durable visual system, responsive layout rules, and
design-change discipline.

## Maintenance

Keep browser-facing HTML, CSS, and JavaScript in `index.html`. Update this README whenever fields, validation, consent, submission, or enrichment behaviour changes.
