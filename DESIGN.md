# Forms v2 design guide

This file holds durable visual and responsive direction. Keep implementation
rules in `AGENTS.md` and user-visible behaviour in `README.md`.

## Visual system

- Use Inter and the existing shared colour, spacing, radius, and elevation
  tokens in `index.html`.
- Apply spacing, widths, colours, and typography through shared tokens or
  reusable selectors, not stage-specific one-offs.
- Raised surfaces use the shared combined shadow-ring token. Do not pair it
  with a visible border unless a design request explicitly calls for one.
- Section titles use the shared title-to-first-field spacing.

## Form flow and feedback

- Stages 1–3 use a compact, centred solid-green progress bar at one-quarter,
  one-half, and three-quarters. It has a 650px desktop cap, stays fluid below
  that width with a 5px inset on both sides, and sits 15px below the form shell.
  Stage 4 hides the bar.
- Stage 1 begins with the shared Inquiry heading and the AI mark beside the
  action row. The mark's accessible explanation is intentionally lightweight.
- Stage 4 centres the inquiry thank-you copy and stars, omits in-form GDPR and
  Debug controls, and keeps both its rating and post-rating containers centred
  within the form shell's inner width. It then displays the 22px feedback
  thank-you message after a rating click.
- From 768px upward, Stage 4 fixes the outer form shell at 500px. The feedback
  page fills the shell's padded inner area so its content remains centred
  without enlarging the outer surface.
- The newsletter is a CSS-only white geometric gradient card. Its optional
  checkbox starts unchecked; preserve the existing topic and Subscribe layout.
  Its desktop banner is 212px tall; mobile stays content-sized with an 8rem
  minimum height. The desktop topic list sits at 48% of the banner height.

## Responsive layout

- Start mobile-first. Below 768px, controls use 16px text to avoid iOS focus
  zoom; fields stack unless the established two-column pair remains usable.
- On mobile, a single action fills its row. Back and Continue remain one row at
  a one-third/two-thirds split.
- At wider widths, use responsive grids: First/Last name and inquiry type/subtype
  pair in Stage 1; Role/Language and Company/Industry pair in Stage 2; the
  enrichment fields use three columns below the full-width About field.
- From 768px upward, the form shell has a 500px minimum height. It may grow for
  taller stages; mobile remains content-sized.
- Phone, Country, and conditional State remain full-width in Stage 2.
- The shared **action row** is the form's final control row on Stages 1–3. It
  uses the shared 50px control height and the same inner bottom inset on each
  stage. Available space sits above the row; a taller stage expands the shell
  rather than compressing actions.
- On desktop, the Continue control uses the same one-third-width, right-aligned
  treatment on Stages 1 and 2. Stage 2 keeps its compact Back control on the
  left; the final stage retains its wider primary action.
- Maintain readable validation and status messages with no horizontal overflow.

## Change discipline

When a visual request supplies an exact measurement, colour, or reference,
preserve it through shared tokens or reusable rules. Update this guide only for
durable design decisions, not one-off experimental work.

## Motion

- Stage changes use a restrained 200ms fade-and-rise entrance; the action row
  remains still. The progress bar eases its width over 240ms.
- The feedback thank-you message uses the same brief fade with a 98% to 100%
  scale. Disable all nonessential motion for `prefers-reduced-motion`.
