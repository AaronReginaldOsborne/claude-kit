# Content model: every client fact with its source

All copy and facts live in `src/content/*.ts`, never typed straight into components. Each entry records where it came from and whether it is confirmed.

```ts
// src/content/types.ts
export type ContentStatus = "confirmed" | "pending";

export interface Sourced<T> {
  value: T;
  status: ContentStatus;
  source: string; // e.g. "client email 2026-09-30", "logo guide PDF", "price list"
}

export const confirmed = <T,>(value: T, source: string): Sourced<T> => ({ value, status: "confirmed", source });
export const pending = <T,>(value: T, source: string): Sourced<T> => ({ value, status: "pending", source });

/** The value when confirmed, otherwise undefined, so callers render nothing for pending content. */
export const shown = <T,>(entry: Sourced<T>): T | undefined => (entry.status === "confirmed" ? entry.value : undefined);
```

## Files (example)
- **`business.ts`:**
  - name, phone (display and E.164), email, service area and hours;
  - the client's own lines: a tagline once picked (until then, their options as a confirmed list and the tagline as pending);
  - credentials they gave;
  - domain and socials (pending);
  - the street address only with their recorded yes; otherwise there is no field for it.
- **`services.ts`:** the services in the client's words, each with an icon name and a tile colour. Prices stay pending until the price list arrives.
- **`policies.ts`:** the client's policies verbatim. Rewording needs their approval, and tests compare the strings.
- **`before-after.ts`** (or the content for your signature interaction): real items only, with permission. Empty until then.
- **`preview.ts`:** not content. It holds the preview flag and the sample photos (`sample-photos.md`).

## Rules
- **Live site:** a section whose entries are all pending doesn't render.
- **Preview:**
  - it may show a pending item only if it is the client's own words (one of their tagline options, for example), and the review email says it is pending;
  - it never shows placeholder copy you made up.
- **Chips, badges and trust lines are content too:** no "5-star", "#1 in town" or "100% satisfaction" unless the client said it and can stand behind it.
- **Health and dietary claims** (nut-free, gluten-free, organic, hypoallergenic) and **credentials** (certified, licensed, insured) appear only as the client stated them, with the source recorded.
