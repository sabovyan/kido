# Follow-up: phone layout changes after design review

Hand this file to a coding agent. The first plan, [mobile-layout.md](mobile-layout.md), is already built. This file covers three changes the user asked for while reviewing the design. Where the two files disagree, this one wins.

## Before you start

- Same rules as the first plan:
  - Follow the `sticker-atlas` skill (`.claude/skills/sticker-atlas/`), including token classes only, both themes, the sticker edge and tap sizes.
  - Never run the formatter.
  - Change nothing outside this file.
  - Never start or stop the dev server (ask the user if `http://localhost:3000` is down).
  - Don't commit unless asked.
- Phones only (`max-md:` / `md:hidden`, below 768px). Desktop at 768px and up must not change.
- Visual reference: the boards "Idea · Discover", "Idea · Flag Hunt start", "Idea · Flag Hunt playing" and "Idea · Menu open" on https://claude.ai/artifact/PZ6StSbaUjncM4NZajUKSf (private; the descriptions below are enough).

## 1. Replace the phone bottom tab bar with a ☰ menu in the top bar

Today the phone uses a bottom tab bar, the second `<nav aria-label="Country">` in `src/routes/country.tsx`. It takes about 100px. Replace it with a menu button at the far right of the top bar.

- **Remove** the phone tab bar `<nav>` from `country.tsx`, along with the `TAB_LINK` / `TAB_ACTIVE` / `TAB_INACTIVE` constants. Keep `CompassIcon` and `TargetIcon`; move them to wherever the menu lives. Leave the desktop sub-nav (`max-md:hidden`) as it is.
- **Add a menu trigger** to the header in `src/routes/__root.tsx`:
  - Phones only (`md:hidden`), placed after `<ThemeToggle />`, so the right side reads [theme] [☰].
  - It inherits the header's existing `max-md:group-has-[[data-game-active]]/app:hidden`, so it is hidden while playing. Check that this still holds.
  - Style it like the theme button: `size-tap-icon rounded-md border-3 border-outline bg-surface shadow-drop-sm` with the same press, hover and focus classes.
  - Icon: 24px stroke hamburger, `M4 7h16M4 12h16M4 17h16`. `aria-label="Menu"`.
  - While open, show an X icon (`M6 6l12 12M18 6L6 18`) with label "Close menu", and use `bg-surface-sunk` with no drop shadow.
- **Popup:** use Base UI, not a hand-rolled popup (see the skill and `references/recipes.md` › Base UI patterns). `Menu` with the items rendered as TanStack `<Link>` through the `render` prop fits; if links don't work cleanly in `Menu`, use `Popover` with a plain `<nav aria-label="Main">` list.
  - Position: aligned to the right edge (`align="end"`), about 12px below the bar, about 260px wide.
  - Look: one sticker, `rounded-lg border-3 border-outline bg-surface shadow-drop-lg p-2 flex flex-col gap-1`.
  - Items: Discover (compass icon) → `/country/discover`, Games (target icon) → `/country/games`. Each is `h-tap-icon px-4 rounded-md gap-3 text-label`, with the icon next to the word.
  - The current route is `bg-ocean-500 text-on-ocean` with `aria-current="page"`. Others are `text-fg hover:bg-surface-sunk`.
  - A `bg-scrim` backdrop dims the page behind it.
  - It closes on item tap, outside tap, Escape and the X. Focus returns to the trigger.
  - Portals must stack above the app root (`.app` / the root `div` already has `isolate`).
- The `viewport-fit=cover` meta and `pb-[max(...env(safe-area-inset-bottom))]` were only there for the tab bar. Remove the tab bar's padding. Keep `viewport-fit=cover` if the game's question card still uses the safe-area inset (it does today).

## 2. Flag Hunt question card on phones: flag only

In `src/game/Game.tsx`, the card holds the flag plus "Find this country" and "Pinch to zoom, then tap." The user said the text isn't needed and takes too much room.

- On phones, the card shows **only the flag**:
  - Centred at the bottom instead of full width: undo the `max-md:left-3 max-md:right-3 max-md:w-auto max-md:translate-x-0` stretch for the card, but keep the safe-area bottom offset.
  - Card: `rounded-lg border-3 border-outline bg-surface shadow-drop-lg p-2.5`.
  - Flag: 120×80 (`w-30 h-20`), `rounded-sm border-3 border-outline object-cover`, `alt="Find the country with this flag"` so screen readers still get the instruction.
- Remove the phone-only "Pinch to zoom, then tap." line completely. Hide the "Find this country" title on phones (`max-md:hidden` or `max-md:sr-only`; the alt text already says it, so `max-md:hidden` is fine).
- Desktop keeps today's card (title and "Tap it on the globe…" hint).
- Feedback (correct/oops) is unchanged: on phones it still replaces the card, full width, with its icon, title and detail.

## 3. Discover country card: drop the helper line

In `src/Tooltip.tsx` › `CountryCard`, remove the line "Tap another country to see its flag."

- The card is then: flag (96×64), country name (`text-title-2`), close button.
- Collapse the now one-item column `span` if it's no longer needed.
- Centre the close button vertically (drop `self-start`).

## Done means

- At 375×812 and 390×844, in Day and Night:
  - No bottom bar on Discover or the Flag Hunt start screen.
  - The ☰ button is at the far right of the top bar.
  - The menu opens from the right with Discover/Games, the current page is filled blue, and it closes on outside tap, Escape and X.
  - While playing, the top bar and menu are hidden, and the bottom card is just the centred flag.
  - The Discover country card has no helper line.
- At 768px and 1280px nothing changed (desktop sub-nav, desktop question card text, header).
- Keyboard: Tab reaches ☰, Enter opens it, arrow keys or Tab move through the items, Escape closes, and focus returns to ☰.
- Checks pass: `npx tsc --noEmit` and `npm run lint`. Do not run `npm run format` or `biome check --write`.
- Report what changed and anything skipped.
