# AGENTS.md

## Project Purpose

This project is a lightweight single-file HTML form experience. The goal is to keep the form portable, readable, accessible, responsive, and easy to maintain without adding frameworks, build tooling, or separate asset pipelines.

## Core Rules

1. Use plain HTML, CSS, and JavaScript only.
2. Keep all HTML, CSS, and JavaScript inside a single `.html` file.
3. Do not create separate `.css` or `.js` files.
4. Do not add frameworks, bundlers, TypeScript, React, Vue, Tailwind, or external libraries without explicit approval.
5. Prioritise simple, maintainable code over clever abstractions.
6. Preserve existing behaviour unless the task explicitly asks to change it.
7. Do not introduce new features unless requested.
8. Do not use inline `style=""` attributes unless there is no reasonable alternative.
9. Do not use inline event handlers such as `onclick=""`, `onchange=""`, or `onsubmit=""`; attach events in the `<script>` block instead.
10. All layouts must be responsive, mobile-first, and free from unnecessary console logging.

## README Maintenance

1. Update README.md whenever a new feature is added.
2. Update README.md whenever existing behaviour changes.
3. Update README.md whenever form fields, hidden fields, validation rules, consent wording, submission behaviour, or browser support changes.
4. Keep the README accurate and useful for someone opening the project for the first time.
5. Do not leave outdated setup notes, screenshots, field descriptions, or feature descriptions in the README.
6. If a change does not require a README update, mention that in the change summary.

The README should usually include:

1. Project purpose
2. Form fields
3. Hidden fields
4. Validation rules
5. Submission behaviour
6. Consent/privacy notes
7. Browser support
8. Known limitations
9. Recent changes or version notes

## Required Single-File Structure

The project should normally use one file:

```txt
/
├─ index.html
├─ README.md
└─ AGENTS.md
```

Before building or changing the form, confirm these setup requirements:

1. `AGENTS.md` contains the project rules.
2. `README.md` describes the current form behaviour and limitations.
3. `index.html` is the only implementation file once the form exists.
4. No separate CSS, JavaScript, framework, build, or asset files are required unless explicitly approved.

The `index.html` file should contain:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Form Title</title>

  <style>
    /* CSS goes here */
  </style>
</head>
<body>
  <!-- HTML form markup goes here -->

  <script>
    // JavaScript goes here
  </script>
</body>
</html>
```

## HTML Standards

1. Use semantic HTML wherever possible.
2. Every input must have a visible `<label>` connected with `for` and `id`.
3. Use correct input types such as `email`, `tel`, `url`, `text`, and `hidden`.
4. Use `autocomplete` attributes where useful.
5. Do not use placeholder text as a replacement for labels.
6. Keep HTML structure clean and readable.
7. Use comments only for meaningful sections, not obvious markup.
8. Keep hidden fields visible in the HTML source but not visible in the UI.
9. Clearly document any hidden fields and their purpose.

Example:

```html
<section class="form-section" aria-labelledby="contact-heading">
  <h2 id="contact-heading">Contact details</h2>

  <div class="form-field">
    <label for="email">Email address</label>
    <input id="email" name="email" type="email" autocomplete="email" required>
  </div>
</section>
```

## CSS Rules

1. All CSS must be placed inside a single `<style>` block in the document `<head>`.
2. Do not use external stylesheets.
3. Do not use inline `style=""` attributes unless explicitly required.
4. Use CSS custom properties for shared colours, spacing, borders, shadows, and font sizes.
5. Use mobile-first CSS.
6. Keep selectors simple and readable.
7. Avoid styling directly against IDs.
8. Do not use `!important` unless there is no reasonable alternative.
9. Group CSS clearly with comments.
10. Use consistent class naming.
11. Prefer reusable component classes over one-off styling.
12. Avoid overly specific selectors.
13. Use one spacing scale, one border-radius scale, one button style system, and one validation message pattern.
14. Avoid creating new colours when an existing variable works.

Recommended CSS order:

```css
/* 1. Design tokens */
/* 2. Reset / base styles */
/* 3. Layout */
/* 4. Form components */
/* 5. Buttons */
/* 6. Messages and validation */
/* 7. Responsive rules */
```

## Elevated Surfaces

For surfaces raised above the page, such as form shells, cards, dialogs, popovers, menus, tooltips, sheets, and toasts, use a shared elevation token that combines the hairline edge and shadow in one `box-shadow` value.

Do not pair a visible `border` or outline ring with a drop shadow on an elevated surface: the separate painted edges create a heavy double-border effect. Define the edge colour and combined elevation tokens in `:root`, then apply only the matching elevation token to the surface. Do not add a second border or ring unless the design explicitly needs one. In this form, inputs, alerts, buttons, and validation states also use the matching combined shadow-ring tokens instead of visible borders; preserve semantic colours by choosing the appropriate token.

Example:

```css
:root {
  --color-elevation-ring: rgba(16, 24, 40, 0.08);
  --shadow-elevation-sm: 0 0 0 1px var(--color-elevation-ring), 0 1px 2px rgba(16, 24, 40, 0.06);
}

.form-shell {
  box-shadow: var(--shadow-elevation-sm);
}
```

Example CSS variables:

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #172033;
  --color-muted: #667085;
  --color-border: #d0d5dd;
  --color-primary: #005eb8;
  --color-error: #b42318;
  --color-success: #027a48;

  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  --radius: 10px;

  --color-elevation-ring: rgba(16, 24, 40, 0.08);
  --shadow-elevation-sm: 0 0 0 1px var(--color-elevation-ring), 0 1px 2px rgba(16, 24, 40, 0.06);
}
```

Recommended class naming pattern:

```css
.form {}
.form__section {}
.form__field {}
.form__label {}
.form__input {}
.form__error {}
.form__actions {}
.button {}
.button--primary {}
.button--secondary {}
```

## JavaScript Rules

1. All JavaScript must be placed inside a single `<script>` block before the closing `</body>` tag.
2. Do not use external JavaScript files.
3. Do not use inline event handlers such as `onclick`, `onchange`, or `onsubmit`.
4. Use modern vanilla JavaScript.
5. Use `const` by default and `let` only when reassignment is needed.
6. Avoid global variables where possible.
7. Keep functions small and named clearly.
8. Separate logic inside the script using clear section comments.
9. Use defensive checks before accessing DOM elements.
10. Do not silently fail important form logic.
11. Avoid deeply nested logic.
12. Do not use `innerHTML` for user-submitted content.
13. Do not expose API keys, tokens, or secrets in frontend code.

Recommended JavaScript order:

```js
// 1. DOM references
// 2. Configuration
// 3. Utility functions
// 4. Validation functions
// 5. State / UI functions
// 6. Submit handling
// 7. Event listeners
// 8. Initialisation
```

Example:

```js
function getFieldValue(form, fieldName) {
  const field = form.elements[fieldName];

  if (!field) {
    console.warn(`Missing form field: ${fieldName}`);
    return "";
  }

  return field.value.trim();
}
```

## Commenting Rules

Comments should explain structure, intent, or reasoning. They should not describe obvious code.

Good:

```js
// Validation is intentionally light to support international names and company formats.
function validateName(value) {
  return value.trim().length >= 2;
}
```

Avoid:

```js
// Get the button
const button = document.querySelector(".button");
```

## Responsiveness Requirements

1. Build mobile-first.
2. The form must work well at small mobile widths before desktop styling is added.
3. Avoid fixed widths for containers, inputs, buttons, and cards.
4. Use `width: 100%` and `max-width` instead of hard-coded widths.
5. Use relative units such as `rem`, `%`, `clamp()`, and `minmax()` where useful.
6. Avoid horizontal scrolling on mobile.
7. Use flexible layouts with `flex`, `grid`, and `gap`.
8. Stack form fields vertically on mobile.
9. Only place fields side-by-side on wider screens where there is enough space.
10. Buttons should be easy to tap on mobile, with a minimum practical height of around `44px`.
11. Inputs should remain readable and usable on mobile.
12. Text should not become too small on smaller screens.
13. Test the layout at common widths: `320px`, `375px`, `390px`, `768px`, `1024px`, and desktop.
14. Do not hide important form fields or messages on mobile.
15. Ensure validation messages, success messages, and error summaries fit properly on small screens.

Recommended responsive pattern:

```css
.form-shell {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-md);
}

.form-grid {
  display: grid;
  gap: var(--space-md);
}

@media (min-width: 720px) {
  .form-grid--two-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

## Accessibility Requirements

1. Inputs must have labels.
2. Error messages must be linked to fields using `aria-describedby`.
3. Invalid fields should use `aria-invalid="true"`.
4. Required fields should be visually clear.
5. The form must be usable by keyboard only.
6. Focus states must be visible.
7. Do not rely on colour alone to communicate state.
8. Success and error summaries should be announced using an appropriate live region.
9. Validation messages should be readable by screen readers.
10. Do not remove accessibility attributes without a clear reason.

Example:

```html
<input
  id="email"
  name="email"
  type="email"
  aria-describedby="email-error"
  aria-invalid="false"
  required
>

<p id="email-error" class="form__error" hidden>
  Enter a valid email address.
</p>
```

## Form Validation Rules

1. Validate on submit.
2. Use light inline validation where helpful, but avoid aggressive validation while the user is still typing.
3. Show clear, human-readable messages.
4. Keep validation messages consistent.
5. Trim values before validating or submitting.
6. Do not block valid international names, company names, phone numbers, or email addresses with overly strict patterns.
7. Error messages should clear when corrected.
8. If a submit action is simulated or async, use a loading or disabled state for the submit button.
9. Do not weaken validation without explaining why.

## Console Logging Rules

1. Do not log personal data to the console.
2. Do not log form values, names, email addresses, phone numbers, company names, consent choices, or hidden field values.
3. Remove temporary debugging logs before finishing a task.
4. Use console logs only when they help diagnose non-sensitive technical behaviour.
5. Prefer `console.warn()` for missing optional elements or recoverable setup issues.
6. Prefer `console.error()` only for genuine technical failures.
7. Do not leave noisy logs in production-ready code.
8. Do not log full API responses if they may contain personal data.
9. Do not log CRM payloads or submission payloads.
10. If debug logging is needed, guard it behind a single debug flag.
11. Debug logging must be disabled by default.

Recommended debug pattern:

```js
const DEBUG = false;

function debugLog(message, details = {}) {
  if (!DEBUG) return;

  console.log("[Form Debug]", message, details);
}
```

Safe example:

```js
debugLog("Validation completed", {
  fieldCount: form.elements.length,
  hasErrors: errors.length > 0
});
```

Unsafe example:

```js
console.log("Submitted email:", email);
console.log("Form payload:", payload);
```

## Data Handling

1. Do not store unnecessary personal data.
2. Do not log personal data to the console.
3. Do not expose API keys or secrets in frontend code.
4. Keep hidden fields visible in the HTML source but not visible in the UI.
5. Clearly document any hidden fields and their purpose.
6. Validate and sanitise all data again server-side if a backend is later added.
7. Do not use localStorage or sessionStorage for personal data unless explicitly approved.
8. Do not include test personal data in committed files.

## Privacy and Tracking

1. Do not add tracking pixels, analytics, cookies, localStorage, or sessionStorage without explicit approval.
2. If tracking is added, make it consent-aware.
3. Do not add recipient-level email open tracking assumptions into the form.
4. Keep consent wording clear and separate from general form submission.
5. Do not pre-tick consent checkboxes.
6. Consent fields must be clear, specific, and optional unless legally or operationally required.
7. Do not bundle marketing consent into general form submission consent.

## Browser Support

Target modern versions of:

1. Chrome
2. Edge
3. Safari
4. Firefox
5. Mobile Safari
6. Chrome for Android

Do not use browser APIs without checking support.

## Performance

1. Keep JavaScript lightweight.
2. Avoid unnecessary DOM queries inside repeated events.
3. Avoid layout thrashing.
4. Optimise images before adding them.
5. Do not add heavy dependencies for simple tasks.
6. Keep CSS selectors simple.
7. Avoid large embedded images or base64 assets unless explicitly required.

## Automated Regression Testing

Run the Playwright regression suite before every Sites publish and whenever the user asks for a full review. Run the local suite during implementation, then run the same suite against the deployed URL after publishing:

```sh
npm run test:e2e
BASE_URL="https://forms-v2-mylo.v6pdwnhvws.chatgpt.site" npm run test:e2e
```

Do not publish or describe a full review as complete if the applicable regression run fails. Report the failing test and fix or explicitly defer the issue with the user.

## Testing Checklist

Before finishing any task, check:

1. Form loads without console errors.
2. CSS is inside the `<style>` block in `index.html`.
3. JavaScript is inside the `<script>` block in `index.html`.
4. No external CSS or JS files were created.
5. No inline event handlers were added.
6. Form works with keyboard only.
7. Labels are connected to inputs.
8. Required fields show useful errors.
9. Email validation allows realistic email addresses.
10. Error messages clear when corrected.
11. Submit button has a loading or disabled state if submission is simulated or async.
12. Success state is clear.
13. Layout works on mobile and desktop.
14. The form works at `320px`, `375px`, `390px`, `768px`, `1024px`, and desktop widths.
15. There is no horizontal scrolling on mobile.
16. Inputs, buttons, and validation messages remain usable on small screens.
17. No personal data is logged to the console.
18. No temporary debugging logs remain.
19. Debug logging, if present, is disabled by default.
20. README.md was updated if features, fields, validation, consent, submission behaviour, or usage changed.
21. If README.md was not updated, the change summary explains why.
22. Before each publish or full review, the applicable Playwright regression suite passes.

## Code Formatting

1. Use 2-space indentation.
2. Use double quotes in HTML attributes.
3. Use double quotes in JavaScript strings.
4. End JavaScript statements with semicolons.
5. Use lowercase kebab-case for CSS class names.
6. Use camelCase for JavaScript variables and functions.
7. Keep line lengths readable.
8. Keep the single HTML file organised with clear section comments.
9. Keep related CSS and JavaScript sections grouped together.

## Pull Request / Change Summary Format

When making changes, summarise:

1. What changed
2. Why it changed
3. Files changed
4. Any behaviour changes
5. Any manual testing completed

Example:

```md
## Summary

- Added email and company name validation.
- Added accessible inline error messages.
- Updated mobile spacing for the form layout.

## Files Changed

- `index.html`

## Testing

- Checked required field validation.
- Checked keyboard navigation.
- Checked mobile layout.
- Checked console for errors and temporary logs.
```

## Things Not To Do

1. Do not split CSS into a separate file.
2. Do not split JavaScript into a separate file.
3. Do not rewrite the whole file unless requested.
4. Do not add dependencies without approval.
5. Do not remove accessibility attributes.
6. Do not weaken validation without explaining why.
7. Do not introduce hidden tracking.
8. Do not mix large unrelated changes into one task.
9. Do not add comments that simply repeat the code.
10. Do not add noisy console logs.
11. Do not log personal data.
12. Do not use fixed-width desktop-first layouts.

## Preferred Implementation Style

Use simple, explicit code.

Prefer this:

```js
function showError(field, message) {
  const errorId = field.getAttribute("aria-describedby");
  const errorElement = document.getElementById(errorId);

  if (!errorElement) return;

  field.setAttribute("aria-invalid", "true");
  errorElement.textContent = message;
  errorElement.hidden = false;
}
```

Avoid this:

```js
const showError = (f, m) => document.getElementById(f.dataset.err).innerHTML = m;
```

## Current User Interface Preferences

1. Apply spacing, widths, colours, and typography through shared tokens or reusable selectors; avoid one-off per-stage overrides.
2. Keep every section title on the same shared title-to-first-field spacing.
3. Start enrichment after Stage 1. It must degrade gracefully when data or the local proxy is unavailable, and Stage 2 edits must not cancel an in-flight request.
4. For this prototype, keep submission local-only and log generic technical/prototype outcomes to the console without personal data.
5. Use a green validation edge only for Email, through its shared validation shadow-ring token. Do not add validation icons or validation edges to other fields unless requested.
6. Preserve the mobile-first layouts: a lone action fills the width on mobile; when Back and Continue are both visible, keep them in one mobile row with a one-third/two-thirds split. Desktop Continue uses the shared 190px width.
7. Keep Stage 3 grouped semantically, move focus to the newly displayed stage, and use three columns below the full-width About field at desktop widths.

## Final Instruction

When editing this project, keep everything in one HTML file unless explicitly told otherwise. Keep the code clean, accessible, responsive, predictable, privacy-aware, and easy for a non-specialist developer to understand.
