# Forms v2

Forms v2 is a lightweight, portable inquiry form. Its UI, styles, and browser logic live in one readable file: `index.html`. No framework or frontend dependency is required. `package.json` and `scripts/build-site.mjs` build the small server-side Sites worker that serves the form and protects its DeepSeek integration.

## Project Files

- `index.html` — the form implementation.
- `dev-proxy.mjs` — optional local company-enrichment proxy.
- `scripts/build-site.mjs` — creates the dependency-free Sites worker with the hosted enrichment route.
- `package.json` — dependency-free deployment build command.
- `README.md` — this guide.
- `AGENTS.md` — project implementation standards.

## Form Flow

1. **Inquiry** — an optional Inquiry textarea (`How can we help you today?`) followed by an informational prompt to provide as much detail as possible for routing, then First name, Last name, and Email address. The prompt appears only on this step. At 768px and above, those three fields share one row in that order. Continue becomes available when the email looks valid, derives the hidden Website and Company name values, and starts company enrichment. While enrichment runs, Continue stays labelled “Continue” and is temporarily disabled to prevent duplicate requests.
2. **Personal details** — Phone number and Role. A following **Company details** subsection contains Company name and an Industry dropdown with **Aerospace** selected by default and **Manufacturing** as the other option. Its second row contains Country (**United States**) and State (**Alabama**) dropdowns. Its third row contains Business (**Norican**), Inquiry type (**Aftermarket**), and Inquiry subtype (**Spare parts**) dropdowns. All Company details dropdowns use the stated defaults. Newsletter consent is a green pastel alert with an envelope icon, the text `Subscribe to news, events and other content.`, and an unchecked checkbox aligned to the right. Role is a dropdown with **Manager** selected by default and **Assistant** as the other option.
3. **Confirm your inquiry** — reviews the inquiry and groups First name, Last name, Email address, Phone number, and Role under **Personal details**, preserving the newsletter consent control from Stage 2. The step then offers the full-width **Submit Inquiry** button. Submission is simulated locally while the prototype is being built. It also displays the `Hidden` enrichment fields: About, Urgency, Sentiment, Query, Enriched industry, and Website. At 768px and above, About remains full width and the remaining fields use three columns.

There are no `type="hidden"` fields. Fields shown in the `Hidden` section remain visible in the source and UI on the confirmation step.

The progress indicator sits below the white form container. Every section title uses the shared `#4d4c4c`, 700-weight title tokens and bottom spacing before its first field. All visible form containers, fields, buttons, alerts, and progress markers use the shared 10px corner radius. Only a valid Email field uses a 2px `#00B77D` border. The guidance, Email feedback, and newsletter alerts share 14px text, a 42px minimum height, symmetric vertical padding, and icon-to-text spacing. Email feedback appears as a pastel warning with a decorative icon; enrichment failures are logged generically to the browser console. On screens 768px and wider, Stage 1 Continue spans one field column while Stage 2 Continue spans the final two columns; on smaller screens both fill the available width.

## Validation and Enrichment

- Email uses light browser validation. A valid email derives First name, Last name, Website, and Company name.
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
- The form has no live submission backend and no automated test suite.

## Design and Browser Support

The form is mobile-first, has a 700px maximum shell width, and supports current Chrome, Edge, Safari, Firefox, Mobile Safari, and Chrome for Android. Check layouts at 320px, 375px, 390px, 768px, 1024px, and desktop widths.

Buttons share a 50px height. Ready Continue and Submit Inquiry use the same shared `#00B77D` primary treatment. Buttons pair visible text with decorative icons: Back uses a left chevron, Continue uses a right chevron, and Submit Inquiry uses a checkmark. The final `Confirm your inquiry` heading uses the shared `#00B77D` green token at 20px; other section titles use the shared title colour and size. On mobile, form actions are full-width. At 768px and above, Back is 100px, Stage 1 Continue spans one field column, Stage 2 Continue spans the final two field columns, and Submit Inquiry remains full-width. Dropdowns use a shared padded chevron aligned with their value text, and the newsletter checkbox uses compact title-to-checkbox spacing. Green UI accents use the shared `#00B77D` token. Stage changes move keyboard focus to the newly displayed stage.

## Maintenance Notes

Keep all browser-facing HTML, CSS, and JavaScript in `index.html`. Preserve visible labels, keyboard access, focus states, and responsive layouts. If fields, validation, consent, submission, or enrichment behaviour changes, update this README in the same change.

## Recent Changes

- Simplified this guide around the three-step user flow and removed the redundant field-by-field inventory.
- Documented the current responsive action-button sizes, shared green token, feedback placement, and Manager/Assistant Role selector.
