# Design kit: principles, with the first build as the worked example

Every item states the principle first. "Example:" is how the first build did it: a pet-grooming site in a royal blue and gold brand, following a pastel pet-app concept. The client's pick decides the look; keep the principles.

Stack used: Next.js 16 App Router, Tailwind CSS v4 (tokens in `globals.css` under `@theme inline`, with shadcn token names so adapted components read them), motion 12, lucide-react, tw-animate-css.

## Tokens
- **Brand colours from the client's logo.** Where they come from: `brand-from-logo.md`.
  - A light brand colour is never text on a light background. Use it:
    - as a fill (for a button, with dark text);
    - on the dark brand colour;
    - as a swash under dark text.
  - Example: the light gold accent took dark ink text at about 9:1 and sat on the dark blue at about 4.8:1.
- **A soft page tint** in the brand's hue, plus a near-black or near-navy ink for text.
- **Pastel tile pairs** (background and icon colour) for icon tiles and cards. Check every pair with `contrast.mjs`; its example list is an invented palette to replace. Example: five pastel pairs, every icon above 5:1 on its tile.
- **One typeface, or the pair the reference uses,** loaded with `next/font`. Example: Plus Jakarta Sans, extra-bold headings with tight tracking.
- **Radius scale:** pill buttons; cards from 22px (small) to 44px (the hero's subject card).
- **One motif as an SVG data URI** in a CSS variable, as `.bg-motif` on the page and `.motif-overlay` (white, 7 to 8% opacity) on dark panels. Example: paw prints. A bakery might use wheat sprigs or a whisk.
- **A swash under one word of the headline:** `::after` on the word, with `isolation: isolate` on the word itself.
- **Motion:**
  - keyframes `marquee` and `float`, plus `--animate-spin-slow: spin 24s linear infinite` (Tailwind's `spin`, slowed down);
  - every animation stops with `prefers-reduced-motion`;
  - looping decoration also gets a visible pause button that sets `data-motion="paused"` on `<html>`, with CSS setting `animation-play-state: paused`. Hover alone does not meet WCAG 2.2.2.
- **No decorative gradients, radial glows or blurred colour blobs.** Cards are flat colours. A soft shadow under a subject is fine.
- **Focus and scrolling:**
  - give dark panels a white focus ring (`.on-dark { --focus-ring: #fff }`, with `:focus-visible` using `var(--focus-ring)`);
  - set `scroll-padding-top` for a sticky header;
  - give input borders at least 3:1 against the field.

## Section kit (the home page, top to bottom)
1. **Header:**
   - the logo;
   - the page links;
   - the client's preferred contact channel;
   - one pill CTA with an arrow chip.
   Below 1024px the links fold into a menu button. Check it fits at 320px with no sideways scroll. Example: a white pill holding the links, a phone link, and "Request an appointment" (just "Book" on phones).
2. **Hero, split:**
   - Left:
     - an eyebrow chip with a real fact the client gave (none, if none);
     - the factual H1 (service and city);
     - their tagline as the big display line, once they have picked one;
     - their hours line;
     - the primary CTA and a secondary button for their channel (Text, Call or Email);
     - up to three short trust chips.
   - Right: the subject standing in a flat pastel card, with its top breaking out above the card's edge. Around it:
     - a spinning circular badge (the business name and city around the brand mark);
     - two small floating info chips.
   - No "Sample" tag on the photo: the alt text and the review email say it is a sample (`sample-photos.md`).
   - Live, before their photos arrive, the card holds the logo.
   - Entrances are CSS (`tw-animate-css`: `animate-in fade-in slide-in-from-bottom-4 fill-mode-both`, staggered delays), so they need no client JS.
3. **A tilted marquee band** of the services in the dark brand colour, separated by motif icons:
   - `aria-hidden`, because the list appears again below;
   - room above and below for the tilt at any width (`padding-block: calc(1.8vw + 1.5rem)`, side margins about `-6vw`);
   - the pause button sits beside it.
4. **Services as tiles:** a white card with a pastel icon tile, the client's name for the service, and an arrow chip.
   - Group them the way they list them.
   - Each tile opens the questionnaire with that service ticked.
   - No prices until their price list arrives.
5. **The signature interaction:** one, from the client's own idea or the business's core moment. Example: for a groomer, scrubbing a muddy dog clean (a before and after you drag). A bakery might offer icing a cake or filling a box of a dozen.
   - Offer 2 or 3 options at the pick.
   - It works by mouse, touch and keyboard (a button does the same thing).
   - It shows its end state under reduced motion.
   - It hides nothing that isn't also in the page text.
   - It appears on the live site only with real content.
6. **Category cards:** pastel cards with cut-out subjects breaking out of the top. Size a wide (landscape) cut-out by width (about 112%) so it still breaks out. Live, an icon in a white circle stands in for each photo.
7. **Why them:**
   - a checklist of claims the client made themselves (white rows with a filled check circle);
   - a quote card in their own words on the dark brand colour: their initial in a brand-colour circle and one fact chip.
8. **How it works:** three cards with icon tiles. The big faint step numbers are drawn by CSS (`content: attr(data-n)`), so they are not text for contrast checks. Then the CTA.
9. **Their policies, verbatim and quoted.** Long words such as email addresses must wrap inside the card (`overflow-wrap: anywhere`).
10. **A closing CTA card:** the dark brand colour with the motif overlay, the light-brand CTA, and a subject lying along the bottom edge (the brand mark when live).
11. **Footer:**
    - page links, contact and hours;
    - the street address only with the client's recorded yes, matching their Google Business Profile exactly;
    - no social links until their accounts exist.

Every section uses a `SectionHeading`: a white pill eyebrow with a motif icon, an extra-bold H2 and an optional intro.

Lucide icons come by name through a small `NamedIcon` helper: a fixed map of only the icons used (`import { Bath, Dog, … } from "lucide-react"`), looked up by name with a fallback, rendered with `createElement`. That keeps the React Compiler's "components created during render" rule quiet. Never use lucide-react's `icons` export, which pulls the whole library into the bundle.
