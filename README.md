# Forms v2

## Project Purpose

Forms v2 is intended to be a lightweight, portable, single-file HTML form. The form should be easy to open, review, and maintain without frameworks, build tooling, package managers, or separate asset pipelines.

## Current Status

The initial single-file form has been created in `index.html`.

Required project files:

- `AGENTS.md`: project instructions and implementation standards.
- `README.md`: project overview, expected behaviour, and maintenance notes.
- `index.html`: the single-file form implementation.
- `dev-proxy.mjs`: local-only DeepSeek proxy for company enrichment during testing.

## Form Fields

- Email address
  - Field name: `email`
  - Input type: `email`
  - Required: no
  - Autocomplete: `email`
  - Input mode: `email`
  - Validation indicator: icon shown inside the field after pressing `Continue`
  - Page: 1
  - Button state: `Continue` is grey until the email looks valid, then blue
- Inquiry
  - Field name: `message`
  - Input type: `textarea`
  - Rows: 3
  - Required: no
  - Page: 1 and 3
  - Visibility: visible below the email address
- First name
  - Field name: `firstName`
  - Input type: `text`
  - Required: no
  - Autocomplete: `given-name`
  - Page: 2 and 3
  - Visibility: hidden until page 2
  - Auto-population: derived from the email local part
- Last name
  - Field name: `lastName`
  - Input type: `text`
  - Required: no
  - Autocomplete: `family-name`
  - Page: 2 and 3
  - Visibility: hidden until page 2
  - Auto-population: derived from the email local part
- Phone number
  - Field name: `phone`
  - Input type: `tel`
  - Required: no
  - Autocomplete: `tel`
  - Input mode: `tel`
  - Page: 2 and 3
  - Visibility: hidden until page 2
  - Auto-population: no, entered manually
- Website
  - Field name: `website`
  - Input type: `url`
  - Required: no
  - Autocomplete: `url`
  - Page: 2 and 3
  - Visibility: hidden until page 2
  - Auto-population: derived from the email domain
- Company name
  - Field name: `companyName`
  - Input type: `text`
  - Required: no
  - Autocomplete: `organization`
  - Page: 2 and 3
  - Visibility: hidden until page 2
  - Auto-population: capitalised from the email host name
- Industry
  - Field name: `industry`
  - Input type: `text`
  - Required: no
  - Autocomplete: off
  - Page: 3
  - Visibility: hidden until page 3
  - Auto-population: returned by the local DeepSeek proxy
- Role
  - Field name: `role`
  - Input type: `text`
  - Required: no
  - Autocomplete: `organization-title`
  - Page: 2 and 3
  - Visibility: hidden until page 2
  - Auto-population: no, entered or corrected manually
- About
  - Field name: `about`
  - Input type: `textarea`
  - Required: no
  - Page: 3
  - Visibility: hidden until page 3
  - Auto-population: returned by the local DeepSeek proxy
- Urgency
  - Field name: `urgency`
  - Input type: `text`
  - Required: no
  - Page: 3
  - Visibility: hidden until page 3
  - Auto-population: DeepSeek classification of the message as `Low`, `Medium`, or `High`
- Sentiment
  - Field name: `sentiment`
  - Input type: `text`
  - Required: no
  - Page: 3
  - Visibility: hidden until page 3
  - Auto-population: DeepSeek classification of the message as `Annoyed`, `Content`, or `Happy`
- Query
  - Field name: `query`
  - Input type: `text`
  - Required: no
  - Page: 3
  - Visibility: hidden until page 3
  - Auto-population: DeepSeek classification of the message as `General`, `Complaint`, `New Business`, or `Parts & Service`
## Conditional Fields

No `type="hidden"` fields have been implemented.

The form is split into three named pages. Page 1 is `Inquiry` with the description `How can we help you today?`; it shows email and inquiry fields with no Back button. Page 2 is `Details` with the description `Confirm your information`; it shows first name, last name, phone number, role, website, and company name fields with Back and Continue buttons. Page 3 is `Finish` with the description `Confirm your inquiry`; it shows the Inquiry and Details review groups, then a full-width `Submit Inquiry` button, then the `Hidden` group. Page 3 has no Back button. A minimal numbered progress indicator at the top of the form turns completed steps into green ticks. The Submit Inquiry button is currently a no-op apart from showing a submitted message.

The first name, last name, phone number, website, company name, and role inputs are conditionally hidden from the UI until page 2. The industry, about, urgency, sentiment, and query inputs are conditionally hidden until page 3. They remain visible in the HTML source and are documented in the form fields section above.

Any future `type="hidden"` fields should remain visible in the HTML source and be documented here with their purpose. Hidden fields must not be used for tracking unless explicitly approved.

## Validation Rules

On page 1, the `Continue` button is grey until the email value looks like a valid email address, then it turns blue. Visible non-hidden fields show a green tick when they contain data. The email field shows the green tick only when the value looks valid.

When the email value passes validation, the first name, last name, website, and company name fields are auto-populated from the email address. The website field displays the email domain without the `https://` prefix, but the proxy request adds the prefix back before sending. The company name is capitalised from the email host name, and the form advances to page 2 without calling DeepSeek. On page 2, `Continue` turns blue once first name, last name, website, and company name all have entries.

Pressing `Continue` on page 2 calls the local proxy to enrich industry, about, urgency, sentiment, and query, then advances to page 3. The form cancels the request if the user edits a detail, and disables Back while it is loading. It also ignores results that no longer match the current details and stops the browser request after 20 seconds. If enrichment fails, the form still advances to page 3 and shows the error message so the inquiry can be confirmed manually. Pressing `Submit Inquiry` on page 3 does not submit to a backend yet. If the email changes, the flow returns to page 1 until the new value is verified.

## Submission Behaviour

The page 1 `Continue` action validates the email field in the browser and derives the first name, last name, website, and company name. The page 2 `Continue` action posts the company website and inquiry message to the local-only proxy at `http://127.0.0.1:8787/enrich-company`. The proxy calls DeepSeek and returns `industry`, `about`, `urgency`, `sentiment`, and `query`.

The form does not submit to a live backend and does not send the full form payload anywhere.

## Enrichment Contract

The browser sends the local proxy a JSON object with `companyUrl` and `message`. A successful response always contains these string fields, which may be empty when no value is available:

- `industry`
- `about`
- `urgency`
- `sentiment`
- `query`

`index.html` validates this response shape before updating the form. Keep this section, the browser field registry, and the proxy response fields aligned when changing enrichment.

## Consent And Privacy

No consent or marketing opt-in fields have been implemented yet.

Future consent fields should be clear, specific, and separate from general form submission. Consent checkboxes must not be pre-selected. Do not add analytics, cookies, localStorage, sessionStorage, tracking pixels, or personal-data logging without explicit approval.

The DeepSeek API key must not be placed in `index.html`. For local testing, provide it as the `DEEPSEEK_API_KEY` environment variable when starting `dev-proxy.mjs`, or put it in a local `.env.local` file that is not committed to git.

## Browser Support

Target modern versions of:

- Chrome
- Edge
- Safari
- Firefox
- Mobile Safari
- Chrome for Android

The form should be responsive and usable at `320px`, `375px`, `390px`, `768px`, `1024px`, and desktop widths.

Verified detail fields are stacked on mobile and display in three columns on wider screens. Finish fields use the two-column responsive layout, with About spanning the full available width and Query sitting beside Industry on wider screens.

## Shared Visual Design

The form uses a shared token system in `index.html` so every step uses the same visual rules:

- Inter with local system fallbacks: 14px/20px regular body text, 16px/20px medium titles, and 13px/16px medium labels.
- Default text is `#333333`; subtle supporting text is `#777777`.
- Buttons are 32px high with a 10px radius.
- Reusable data rows are 40px high and store rows are 44px high.
- Reusable badges are 20px high with a 6px radius, `#CAFACE` fill, and `#15B042` text.
- Reusable switches are 24px by 14px with a 10px thumb and `#0077E6` active track.

The current form does not display rows, badges, or switches, but their shared styles are ready for consistent use if those components are introduced later.

## Known Limitations

- The DeepSeek integration depends on the local `dev-proxy.mjs` helper being running.
- Each DeepSeek request made by the proxy times out after 8 seconds; because company and message enrichment run sequentially, a complete enrichment can take up to roughly 16 seconds.
- Pressing `Continue` only shows local validation feedback until the email has been verified.
- Auto-populated names and company details are simple guesses from the email address and may need user correction.
- DeepSeek output is model-generated and should be reviewed before use.
- There are no automated tests or build scripts.

## Required Local Startup

The static form server and the local enrichment proxy are one required local startup. Run both processes before opening the form; neither process provides the complete experience on its own.

In one terminal, run the static form server:

```sh
python3 -m http.server 8000
```

In a second terminal, run the local proxy. You can either pass the API key directly:

```sh
DEEPSEEK_API_KEY="your-key-here" node dev-proxy.mjs
```

Or create a local `.env.local` file:

```sh
DEEPSEEK_API_KEY="your-key-here"
```

Then run:

```sh
node dev-proxy.mjs
```

The proxy sends this prompt to DeepSeek:

```txt
Visit {company_url}, return a JSON result with two fields:
- "industry": the company's industry in one or two broad words (e.g. "Manufacturing", "Financial Services")
- "about": a short 1-2 sentence description of what the company does
```

The proxy does not perform role lookup. The Role field remains available for manual entry or correction in the form.

## Development Notes

- Keep the implementation in one `index.html` file.
- Put CSS in one `<style>` block in the document `<head>`.
- Put JavaScript in one `<script>` block before the closing `</body>` tag.
- Do not add separate `.css` or `.js` files.
- Do not add frameworks, bundlers, TypeScript, React, Vue, Tailwind, or external libraries without explicit approval.
- Use accessible labels, linked error messages, visible focus states, and keyboard-friendly controls.
- Do not log personal data or submitted form values to the console.
- Keep API keys in local environment variables, not in browser code.

## Recent Changes

- The current form is a three-step inquiry flow with local email-derived details and optional local DeepSeek enrichment.
- Added shared typography, colour, button, row, badge, and switch design tokens across the form.
- The enrichment request now has a documented and validated response contract.
- Browser field behavior is maintained through a central field registry, and the proxy keeps HTTP routing separate from enrichment orchestration.
