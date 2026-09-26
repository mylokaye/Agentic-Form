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

- Steps 1 and 2 use a compact, centred solid-green progress bar at one-half and
  full width. It has a 650px desktop cap, stays fluid below that width with a
  5px inset on both sides, and sits 15px below the form shell. The post-submit
  feedback screen hides the bar.
- Step 2 contains the privacy note immediately above its Back and Submit Inquiry
  actions. The post-submit screen centers the inquiry thank-you copy and stars,
  omits the privacy note and in-form Debug controls, and keeps its rating and
  post-rating containers centered
  within the form shell's inner width. It then displays the 22px feedback
  thank-you message after a rating click.
- From 768px upward, the post-submit screen fixes the outer form shell at 500px. The feedback
  page fills the shell's padded inner area so its content remains centred
  without enlarging the outer surface.

## Responsive layout

- Start mobile-first. Below 768px, controls use 16px text to avoid iOS focus
  zoom; fields stack unless the established two-column pair remains usable.
- On mobile, a single action fills its row. Back and Submit Inquiry remain one row at
  a one-third/two-thirds split.
- At wider widths, use responsive grids for First/Last name in Step 1 and
  Role/Language plus Company/Industry in Step 2.
- From 768px upward, the form shell has a 500px minimum height. It may grow for
  taller stages; mobile remains content-sized.
- Phone, Country, and conditional State remain full-width in Stage 2.
- The shared **action row** is the form's final control row on Steps 1 and 2. It
  uses the shared 50px control height and the same inner bottom inset on each
  stage. Available space sits above the row; a taller stage expands the shell
  rather than compressing actions.
- On desktop, Continue and Submit Inquiry use the same right-aligned treatment.
  Step 2 keeps its compact Back control on the left.
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
