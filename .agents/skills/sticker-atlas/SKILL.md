---
name: sticker-atlas
description: Sticker Atlas, the design system of Flag Map of the World (a site for kids aged 6-12). Use for any UI work in this repo — new or changed components, screens, layout, styling, colors, fonts, dark mode / Day-Night theme, icons, animation, accessibility, or user-facing copy (button labels, game messages, errors).
---

# Sticker Atlas

The look of Flag Map of the World: bright, chunky, rounded, like toy blocks and stickers. The audience is kids aged 6-12, so every rule below favours big, clear and kind over dense and clever.

- **Visual source of truth:** the design canvas https://claude.ai/artifact/GfLSY7s94tnfhegLxWJEaR (private; read it with the Artifact tool's `read` action if you have access). Boards: Colors, Typography, Space/shape/motion, Components, Day & Night themes, Learn screen, Flag Hunt screen.
- **Code source of truth:** the tokens in `src/styles.css` (`@theme`, `@theme inline`, and the `:root` Day / Night blocks). If the canvas and the code disagree, the code wins; mention the mismatch.

## Stack

- **Tailwind v4** via `@tailwindcss/vite`. Preflight is OFF (only `theme.css` and `utilities.css` are imported), so browser defaults still apply: set margins, list styles, button borders/backgrounds yourself on new elements.
- **Base UI** (`@base-ui/react`) for every interactive part that has state or a popup: Dialog, AlertDialog, Popover, Tooltip, Tabs, Toggle / ToggleGroup, Switch, Menu, Select, Checkbox, Radio, Slider, Progress, Toast, Accordion. Import per component (`import { Dialog } from '@base-ui/react/dialog'`). Style parts with Tailwind classes and the state data attributes each part documents. Do not hand-roll focus traps, roving tabindex or popup positioning.
- Plain `<button>` / `<a href>` are fine for simple actions and links.
- Before the first Base UI popup lands, give the app root (`.app`) `isolation: isolate` so portals stack above it.
- Do not add another UI kit (MUI, Chakra, Mantine, shadcn defaults): their look fights this one.

## Rules

1. **Tokens only.** Use the token classes in `references/tokens.md` (`bg-surface`, `text-fg`, `border-outline`, `shadow-drop-md`, `text-title-2`, `rounded-lg`...). No raw hex values, no arbitrary colors (`bg-[#...]`), no Tailwind palette colors (`bg-blue-500`). Need a new token? Add it to `src/styles.css` in both Day and Night, then use it.
2. **Both themes, always.** Semantic tokens switch automatically between Day and Night. Brand fills (`ocean`, `sun`, `leaf`, `coral`, `grape`) stay the same in both; text on them uses the matching `on-*` color. Use `dark:` only for genuine exceptions. Check every new UI in both themes.
3. **The sticker edge.** Anything a kid can touch: `border-3 border-outline` plus a solid `shadow-drop-*` (never a blurred shadow). Pressed sinks: `active:translate-y-[5px] active:shadow-none`. Cards: `rounded-lg`; buttons and toasts: `rounded-md`; chips and tabs: `rounded-pill`. Grouped controls (segmented switches, toolbars) are ONE sticker: the container gets the outline and drop, the items inside are borderless and only the selected one is filled.
4. **Tap sizes.** Minimum 48px (`h-tap-min`), icon buttons and tabs 56px (`size-tap-icon`), main actions 64px tall (`h-tap-main`). At least 12px (`gap-3`) between tappable things.
5. **Type.** `font-display` (Baloo 2) for titles, buttons and numbers; `font-body` (Nunito) for text. Body text 18px (`text-body`) or larger; never below 15px (`text-caption`). Line length ~60 characters max; game prompts two lines max. Sentence case. Scores and counters use `tabular-nums`.
6. **One big action per screen.** Only one `bg-sun-400` "do this now" button per view. Ocean = continue, surface/white = the other choice. Settings (theme, sound, language) stay quiet: a corner icon button (`size-tap-icon`) that opens or flips the setting, never bigger or louder than the screen's navigation or main action.
7. **Never colour alone.** Right/wrong, lives and states always pair colour with an icon and a word. Contrast: 4.5:1 for text (all token pairs already pass; keep it that way).
8. **Icons.** Inline stroke SVG, 24px grid, `stroke-width` 2.5, round caps and joins, `currentColor`; always next to a visible word (or `aria-label` on icon-only buttons, decorative SVGs `aria-hidden="true"`). No emoji.
9. **Motion.** Short and bouncy: `ease-bouncy` with `duration-(--dur-pop)` for pops, `--dur-tap` for presses, `--dur-wobble` once for a lost heart, `--dur-fly` for the globe turning. Respect `motion-reduce:` (fades only, globe jumps).
10. **Kind copy.** Short words a 7-year-old knows, digits for numbers, encourage instead of judging.
    - Do: "Oops, that's Spain! France is right next door." / "Yes! France — flag painted."
    - Don't: "Incorrect." / "Error: invalid selection." / "Game over, you failed."
11. **Accessible markup.** Real `<button>`, `<a href>`, `<label>`; never `onClick` on a `div`. Visible focus ring on everything focusable (`focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500`).

## Existing code

The current screens still use the older hand-written classes in `src/styles.css` (below the tokens) and `src/game/game.css`. When you touch one of them, move it to token classes; don't add new raw-hex rules there. Canvas-drawn map colours (`src/game/painter.ts`, `src/Globe.tsx`) should read the `--map-*` variables instead of hardcoded hexes when they are next changed.

## References

- `references/tokens.md` — every token, its Tailwind class and its Day/Night value.
- `references/recipes.md` — copy-ready Tailwind markup for buttons, chips, cards, toasts, the question card, tabs, the segmented switch, theme switch placement, and Base UI patterns. Read it before building any control; if no recipe fits, start from the closest one and match the canvas.
