# Forms v2

Forms v2 is a lightweight, portable inquiry form. Its UI, styles, and browser logic live in one readable file: `index.html`. No framework, build step, or frontend dependency is required.

## Project Files

- `index.html` — the form implementation.
- `dev-proxy.mjs` — optional local company-enrichment proxy.
- `README.md` — this guide.
- `AGENTS.md` — project implementation standards.

## Form Flow

1. **Inquiry** — an optional Inquiry textarea (`How can we help you today?`) followed by Email address. Continue becomes available when the email looks valid.
2. **Personal details** — First name, Last name, Phone number, Role, Website, and Company name. Role is a dropdown with **Manager** selected by default and **Assistant** as the other option.
3. **Confirm your inquiry** — reviews the inquiry and personal details, then offers the full-width **Submit Inquiry** button. It also displays the `Hidden` enrichment fields: About, Urgency, Sentiment, Query, and Industry.

There are no `type="hidden"` fields. Fields shown in the `Hidden` section remain visible in the source and UI on the confirmation step.

The progress indicator sits below the white form container. Valid populated fields use a 2px `#00B77D` border. Field feedback appears below Email on the inquiry step; final-step enrichment errors appear below the `Hidden` heading.

## Validation and Enrichment

- Email uses light browser validation. A valid email derives First name, Last name, Website, and Company name.
- On the personal-details step, Continue requires First name, Last name, Website, and Company name.
- Continuing then calls the local proxy with the company URL and inquiry message. The request is cancelled if relevant details change, times out after 20 seconds in the browser, and ignores stale responses.
- The proxy can return `industry`, `about`, `urgency`, `sentiment`, and `query` as strings. If enrichment fails, the form still advances so the inquiry can be reviewed manually.
- Submit Inquiry currently shows a local confirmation only; it does not send the form to a backend.

## Local Enrichment Setup

The form works as static HTML. To use company enrichment, start the form server and proxy separately:

```sh
python3 -m http.server 8000
```

```sh
DEEPSEEK_API_KEY="your-key-here" node dev-proxy.mjs
```

Alternatively, store `DEEPSEEK_API_KEY` in an uncommitted `.env.local` file before running `node dev-proxy.mjs`.

The browser posts to `http://127.0.0.1:8787/enrich-company`. Keep the API key out of `index.html` and out of version control.

## Privacy and Limitations

- No consent, marketing opt-in, analytics, cookies, tracking pixels, localStorage, or sessionStorage are implemented.
- Do not log personal data or submission payloads to the console.
- DeepSeek output and email-derived details are suggestions and should be reviewed.
- The form has no live submission backend and no automated test suite.

## Design and Browser Support

The form is mobile-first and supports current Chrome, Edge, Safari, Firefox, Mobile Safari, and Chrome for Android. Check layouts at 320px, 375px, 390px, 768px, 1024px, and desktop widths.

Buttons share a 50px height. On mobile, form actions are full-width. At 768px and above, Back is 100px, Continue is 175px, and Submit Inquiry remains full-width. Green UI accents use the shared `#00B77D` token.

## Maintenance Notes

Keep all browser-facing HTML, CSS, and JavaScript in `index.html`. Preserve visible labels, keyboard access, focus states, and responsive layouts. If fields, validation, consent, submission, or enrichment behaviour changes, update this README in the same change.

## Recent Changes

- Simplified this guide around the three-step user flow and removed the redundant field-by-field inventory.
- Documented the current responsive action-button sizes, shared green token, feedback placement, and Manager/Assistant Role selector.
