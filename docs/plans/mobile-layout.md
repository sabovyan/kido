# Plan: phone layout for Flag Map of the World

Hand this file to a coding agent. It is self-contained: it says what is wrong on phones today, what the target looks like, and how to build it in this repo.

## Before you start

- Read and follow the `sticker-atlas` skill (`.claude/skills/sticker-atlas/SKILL.md`, plus `references/tokens.md` and `references/recipes.md`). Every UI change in this repo goes through it: token classes only, no raw hex, both Day and Night themes, sticker edge, tap sizes, kind copy.
- Follow `~/.claude/CLAUDE.md` and `CLAUDE.md`: never run the formatter, change nothing outside this plan, never start/stop the dev server (the user runs it on `http://localhost:3000`; ask them if it is down), do not commit unless asked.
- If a step needs a different architecture than the one described here (new global state, a new route, a new library), stop and ask the user first.
- Visual reference: the design canvas "Flag Map Mobile Review" at https://claude.ai/artifact/PZ6StSbaUjncM4NZajUKSf. Top row = screenshots of today's phone view with numbered problems; bottom row = the target phone screens (Idea · Discover, Idea · Flag Hunt start, Idea · Flag Hunt playing, Idea · Wrong answer). It is private; if you can't open it, the descriptions below are enough.

## Scope

- **Phones only:** viewport width below Tailwind's `md` breakpoint (768px). Write the phone layout as the base classes and keep today's desktop look behind `md:`, or keep desktop as base and add `max-md:` overrides. Pick one style per file and stay with it.
- **Desktop at 1280px must look exactly as it does now.**
- Files in play: `src/routes/__root.tsx`, `src/routes/country.tsx`, `src/routes/country/discover.tsx`, `src/routes/country/games.tsx`, `src/FlatMap.tsx`, `src/Globe.tsx`, `src/Tooltip.tsx`, `src/game/Game.tsx`, `src/game/FlatBoard.tsx`, `src/game/GlobeBoard.tsx`, `src/styles.css`.

## What is wrong today (measured at 375×812)

1. The header wraps to two rows (157px) and the Discover/Games sub-nav adds 82px, so 239px (29% of the screen) is gone before the map starts. On top of that, three nav levels stack: Country › Discover/Games › Map/Globe.
2. Discover map: the 1600×820 SVG is fit inside a tall card, so it renders as a thin strip with about 70% empty sea. `translateExtent` locks panning to that box. The card also has `px-6 pb-6` padding and a frame, which wastes more width.
3. Country names only show on hover (`mousemove` in `FlatMap.tsx`, `onPointerMove` in `Globe.tsx`), so on a touch screen tapping a country does nothing.
4. Discover › Globe showed an empty dark card after about 2s at 375px. Find out whether it's slow texture loading (8192×4096 canvas plus 250 flag PNGs) or a sizing/rendering bug, and fix it if it's a bug.
5. Flag Hunt (current token version): at 375px the HUD has five chips (hearts, score, streak, flags, land) in a `flex-wrap` that wraps to several rows on the right and collides with the floating Map/Globe switch on the left. The feedback toast stacks on top of the question card, so together they cover a large part of the map kids need to tap. The start card's mode grid and the end card's 64px buttons are sized for desktop.

## Target design

### 1. App shell (`__root.tsx`, `country.tsx`, `styles.css`)

- **Top bar on phones:** one row, 72px tall (`h-18`), `px-4`, `bg-surface`, `border-b-3 border-outline`. Contents: the sun flag logo at 40px (`size-10`), the title shortened to "Flag Map" (`text-title-3`), and the theme button (`size-tap-icon`) pushed right. Hide the main nav (the single "Country" pill) on phones, since it is the only section. Desktop keeps the full title and the nav.
- **Bottom tab bar on phones** for Discover / Games, replacing the sub-nav row in `country.tsx`. Make it ONE sticker (rule 3 for grouped controls): an outer `rounded-pill border-3 border-outline bg-surface shadow-drop-md p-1` container holding two borderless `rounded-pill` links that share the width (`flex-1`), each `h-tap-icon` (56px) with an icon and a word. The selected tab is `bg-ocean-500 text-on-ocean`, as the skill specifies for active tabs. Icons are 24px stroke SVGs: compass for Discover (`circle r=9` + `M15.5 8.5l-2 5-5 2 2-5z`), target for Games (circles r=9, 5, 1). Bar wrapper: `px-4 pt-3`, `border-t-3 border-outline bg-page`, with bottom padding `pb-[max(20px,env(safe-area-inset-bottom))]`.
  - For the safe-area inset to work, add `viewport-fit=cover` to the viewport meta in `__root.tsx`.
  - On desktop, keep today's sub-nav row as it is.
- `.app` uses `height: 100%`. On phones, switch it to `100dvh` so mobile browser toolbars don't cut off the bottom bar. Check that nothing scrolls the page itself (`html, body { overflow: hidden }` stays).

### 2. Discover (`discover.tsx`, `FlatMap.tsx`, `Globe.tsx`, `Tooltip.tsx`)

- **Full bleed on phones:** drop the `px-6 pb-6` wrapper padding and the card frame (`rounded-lg border-3`), so the map fills everything between the top bar and the tab bar.
- **Map fit:** on phones, open the flat map zoomed in so it fills the height (or open on a sensible region) instead of a strip, and loosen `translateExtent` so the whole world can be panned. Keep the `scaleExtent`. Desktop behaviour stays the same.
- **Map/Globe switch:** stays top-left as it is today (it already uses the segmented recipe, 48px items).
- **Zoom buttons (new, phones):** top-right, ONE sticker with a "+" and a "−" button stacked, each at least 48px, with `aria-label` "Zoom in" / "Zoom out". They call d3 `zoom.scaleBy` on the flat map and change the `OrbitControls` distance on the globe. Many kids don't know pinch.
- **Tap a country → country card:** on touch (`pointerType !== 'mouse'`, or `(hover: none)`), a tap selects the country and opens a bottom card instead of the hover tooltip. Mouse hover keeps today's tooltip.
  - Card: `absolute inset-x-3 bottom-4`, `rounded-lg border-3 border-outline bg-surface shadow-drop-lg p-3.5`, row with the flag (`h-16 w-24 rounded-[10px] border-3 border-outline object-cover`, `alt=""` since the name is next to it), the country name in `text-title-2`, a caption "Tap another country to see its flag." in `text-caption text-fg-muted`, and a close button (48px, `aria-label="Close"`).
  - Flat map: a tap must not fire after a drag. Use the d3-zoom click handling the game board already relies on.
  - Globe: use `onClick` with the `e.delta > 6` drag guard from `GlobeBoard.tsx`.
  - Only data in `CountryProps` (`name`, `code`) exists. Don't invent capitals or facts.

### 3. Flag Hunt (`games.tsx`, `Game.tsx`, boards)

- **Start card on phones:**
  - Title "Flag Hunt" (`text-title-1`) and the line "A flag pops up. Tap its country. You have 3 hearts."
  - A "Play on" segmented switch (Map | Globe) inside the card, using the segmented switch recipe. It drives the same `?view=` search param as today's floating switch. On phones, hide the floating switch in `games.tsx` for the whole game (start, playing, over); desktop keeps it.
  - The three modes as full-width stacked rows (`min-h-18`): stars, label (`text-title-3`/`font-display`), blurb (`text-caption`) and "N flags" (`tabular-nums`) on the right. Easy is the ONE `bg-sun-400 text-on-sun` main action; Medium and Hard are `bg-surface` with the outline (rule 6). Keep today's tinted cards on desktop.
- **While playing on phones, hide the app top bar and the bottom tab bar**, so the board gets the whole screen.
  - Suggested mechanism (no state plumbing): put a `data-game-active` attribute on the game root while `phase` is `playing` or `feedback`, then hide the chrome in CSS with `.app:has([data-game-active])` below `md`.
  - If you'd rather lift state through the router instead, ask the user first.
- **HUD on phones:** one row at the top (`absolute inset-x-3 top-3`, `gap-3`):
  - A "Stop game" icon button (`size-tap-icon`, X icon, `aria-label="Stop game"`). It ends the round and shows the existing end card (`setPhase('over')`); confirm with the user whether stopping should ask "Stop this round?" first (Base UI AlertDialog).
  - ONE sticker (`flex-1 h-tap-icon rounded-pill border-3 border-outline bg-surface shadow-drop-sm`) holding hearts, star + score, flag + "n/total", spread with `justify-between`. Keep the existing `sr-only` labels and the hearts `aria-label`.
  - Hide the streak and land chips on phones: best streak and land % are already on the end card. Desktop keeps all five chips.
- **Question card on phones:** `absolute inset-x-3`, bottom `max(16px, env(safe-area-inset-bottom))`, full width. Keep the flag at 96×64. Title "Find this country" (`text-title-2`, two lines max). Hint on touch: "Pinch to zoom, then tap." (desktop keeps the current hints).
- **Feedback on phones:** don't stack a second box. The feedback *replaces* the question card's content for its 1s / 2.6s:
  - Correct: `bg-tint-correct text-on-tint-correct`, check badge.
  - Oops: `bg-tint-oops text-on-tint-oops`, X badge.
  - Same `<output>` semantics, same copy as today ("Oops, that's X" / "Y is the yellow one, N km away.").
  - Desktop keeps the stacked toast.
- **End card on phones:** the buttons go full width and stack (`flex-col`, `w-full`), with the main sun button first. Make the card scroll inside itself (`max-h-full overflow-y-auto`) if it is taller than the screen.
- **Small countries:** on phones, check that `FlatBoard` (scale 1 to 20) and `GlobeBoard` (`minDistance` 1.2) can zoom in far enough that Easy-mode countries are bigger than a fingertip (about 44px). Don't change game rules (like tap tolerance or nearest country) without asking the user.

## Order of work

1. Investigate the blank Discover globe (problem 4). Report the cause before changing anything big.
2. App shell: compact top bar, bottom tab bar, `100dvh`, safe area.
3. Discover: full bleed, map fit, zoom buttons, tap-to-see card.
4. Flag Hunt: start card, hide chrome while playing, HUD, question/feedback card, end card.
5. Verify (below), then report to the user what changed and anything you skipped.

## Done means

- At 375×812 and 390×844, in both Day and Night themes:
  - Discover's map fills the space between the bars.
  - Tapping a country shows its card.
  - The Flag Hunt HUD is one row with no overlap.
  - The question card never sits under the HUD.
  - Every tappable thing is at least 48px with at least 12px between.
  - No horizontal scroll.
- At 768px and 1280px, the layout matches today's desktop (compare with screenshots taken before you start).
- `prefers-reduced-motion` still respected (`motion-reduce:` on any new transitions).
- Checks pass: `npx tsc --noEmit` and `npm run lint`. Do not run `npm run format` or `biome check --write`.
- Use the in-app browser's mobile viewport to check; the user's dev server must already be running.

## Known mismatch to mention, not fix

On desktop, the sub-nav in `country.tsx` marks the active tab with `bg-sun-400`, but the skill reserves sun for the single "do this now" button and uses ocean for active tabs. Leave desktop as is and point it out to the user.
