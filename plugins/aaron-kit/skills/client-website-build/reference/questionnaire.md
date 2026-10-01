# Lead capture: the multi-step questionnaire

A short questionnaire beats a long form: one topic per screen, a card that fills in as people answer, and a finish screen that hands them something real. The first build's version had eight screens, with a pet card on the side and a text-message finish.

## First, where do requests go? (the client's choice, asked at step 0)
- **Text, with no server:**
  - the finish prepares the message and opens `sms:+1…?&body=…`, with the body percent-encoded (`encodeURIComponent` plus `! ' ( ) *`, line breaks as `%0A`; never URLSearchParams, which writes spaces as `+`);
  - add Copy and the number, for computers;
  - nothing is stored or sent;
  - inputs carry no `name` attribute and sit in no `<form>`.
- **Phone:** the finish shows a `tel:` link and the prepared notes to copy, so the caller has them in front of them.
- **Email:** a server route with schema validation, a honeypot, a rate limit and a non-identifying log line. Any mail provider needs the user's OK.
- **More than one:** offer each at the finish.
- **Online ordering, payments or a store:** stop and ask the user. That is a different project.

## Shape
- **One topic per screen:** a single choice, or up to about three related fields; 6 to 8 screens.
  - Example: pet type; the pet (name, breed, age, optional photo); size; services; when; notes; the client's policies; the visitor's name.
  - A bakery might use: occasion; cake (servings, flavour, dietary needs from the client's list); design (an inspiration photo); pickup date; notes; policies; contact.
- **Chrome:**
  - a segmented progress bar (done steps in the dark brand colour, the current one in the light brand colour);
  - "Step X of N";
  - a 40px close button;
  - Back and Continue in a footer that stays visible.
- **Choices:**
  - tiles with an icon tile, a label and a letter key (A, B, C), exposed as `role="radio"` or `role="checkbox"` with `aria-checked`;
  - only the first, simplest single choice moves on by itself, after about 240ms, and its hint says so (WCAG 3.2.2);
  - a screen with an optional field below its choices waits for Continue.
- **Keys:**
  - arrows move between choices without picking;
  - letters pick only while focus is inside a group of choices;
  - Enter continues (not from a button, link or textarea), and the "Press Enter" hint shows only on screens where that is true;
  - Esc closes the pop-up;
  - Tab is trapped in the pop-up, and the page behind is `inert` while it is open.
- **Focus (this is where the first build broke):** with `AnimatePresence mode="wait"` the leaving step is still mounted when the step changes.
  - Wait (on `requestAnimationFrame`) for the entering `[data-step="<id>"]`, then focus its first control.
  - Set the "already focused" ref only after focus lands, so React StrictMode's double effect is harmless.
  - An inline copy (on a Book page) must not take focus on page load.
  - Reset the scroll area to the top on each new step.
  - On close, hand focus back on the next frame (the page is inert until the close renders).
- **No double steps:** ignore Continue and Back for about 450ms after a step change, while it animates.
- **Errors:**
  - checked per step, written for the visitor;
  - `role="alert"`;
  - scrolled into view;
  - focus moved to the first invalid field;
  - fixing one field clears only its own message.
  The final check is a zod schema, and a failure sends the visitor back to the step that owns the field.
- **Dates:** refuse a first choice in the past (an hour's grace), and put the year in the message.
- **Conditional fields:**
  - fields for a choice (an area for at-home visits) show only when it is picked;
  - they are dropped from the request when it is un-picked;
  - optional ones say "(optional)".
- **Notes:** quick tags plus free text. Never cut the visitor's own words to fit the tags; give the merged notes their own, larger limit.
- **The side card:** it fills in as people answer, beside the questions from 1024px and as a small strip above them on smaller screens.
  - An optional photo stays on the device as an object URL and is never uploaded.
  - Offer "Share with the photo" through `navigator.share({ text, files })` only where `navigator.canShare({ files })` is true. Work that out in the event handler, never in an effect.
- **The finish:**
  - a small celebration, with confetti particles made in the click handler and nothing played under reduced motion;
  - honest copy ("Your message to <the owner> is ready", never "booked" or "sent" for a text finish);
  - the buttons first, then the card and the message;
  - "Edit my answers".
  - The draft survives closing and reopening.
- **Persistence:** keep the draft in memory (a reload forgets it), because it can hold a photo and personal details. If the user wants it to survive reloads, use `sessionStorage` without the photo, and record that choice in `docs/DECISIONS.md`.

## Wiring
- A provider wraps the layout and holds the draft. It exports:
  - a `BookButton` (the pill with an arrow chip);
  - a service-tile button (opens with that service ticked);
  - an inline copy for the Book page.
- On the Book page, the buttons scroll to the inline copy instead of stacking a pop-up.
- **Analytics** carry no answers, at most "started" and "finish used (open, copy or share)".
- **Tests:**
  - unit tests for the step checks, the request builder, the message text and the URL encoding (exact strings);
  - a Playwright walk through every branch, waiting for `[data-step=…]` after each Continue;
  - a "no leak" test that fills every field with sentinels and checks no network request carries one.
