# Sticker Atlas recipes

Which `src/ui` primitive to reach for, and how to call it. The primitives own every visual class (edge, drop, fill, tap size, focus ring, press motion); `className` on them is for layout only (position, width, gap, `max-md:` placement). See each one in Storybook (`bun run storybook`). If none fits, add a variant to the closest primitive and to its story; don't spell the look out inline.

Icons come from `src/ui/icons.tsx`: 24px, stroke 2.5, `currentColor`, `aria-hidden` by default. Pass `size` / `strokeWidth` to change them.

## Buttons

```tsx
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { ArrowRightIcon, PlusIcon } from '../ui/icons';

// Main action: one per screen
<Button variant="main" onClick={start}>Play <ArrowRightIcon /></Button>

// Continue
<Button variant="continue" onClick={again}>Play again</Button>

// Other choice (the default variant)
<Button onClick={changeMode}>Change mode</Button>

// Inside a card: Next, Skip, Fun facts
<Button size="md" variant="continue">Next</Button>

// Full width with the label centred on phones
<Button variant="main" fill>Start</Button>

// As a link
<Button variant="continue" render={<Link to="/country/learn" />}>Learn these</Button>

// Icon-only: 56px by default, `size="sm"` (48px) inside a card
<IconButton aria-label="Zoom in" onClick={zoomIn}><PlusIcon /></IconButton>
```

Disabled buttons say why in the label ("Loading globe…"). `size="md"` buttons and `IconButton` turn dashed and sunk when disabled.

Anything focusable that is not a primitive adds `FOCUS_RING` from `src/ui/focus.ts` (join classes with `cx` from the same file).

## Chips (score bar)

```tsx
import { Chip } from '../ui/Chip';
import { ProgressBar } from '../ui/ProgressBar';
import { FlameIcon, HeartIcon, StarIcon } from '../ui/icons';

<Chip render={<div />}>
  <StarIcon />
  <span className="font-display text-title-3 font-extrabold tabular-nums">120</span>
  <span className="sr-only">points</span>
</Chip>

// Streak (reward)
<Chip tone="reward" render={<div />}><FlameIcon /> …</Chip>

// Lives: a lost heart is empty and grey, not just a different colour
<Chip role="img" aria-label="2 of 3 hearts left" render={<div />}>
  {[0, 1, 2].map(i => <HeartIcon key={i} lost={i >= lives} />)}
</Chip>

// Progress next to its number
<Chip render={<div />}>Land 12% <ProgressBar value={0.12} label="Land painted" /></Chip>

// Small stat pills on an end card
<Chip size="sm" tone="tint-correct">8 flags</Chip>
```

Tones: `surface` (default), `reward`, `sunk`, `tint-hint`, `tint-correct`, `tint-reward`. On phones, `phone="bar"` makes a chip borderless inside one score bar sticker; `phone="sticker"` makes it its own 56px sticker.

## Cards and overlays

```tsx
import { Card } from '../ui/Card';
import { Overlay } from '../ui/Overlay';

<Overlay>
  <Card render={<section />} className="flex w-[760px] max-w-full flex-col gap-4">
    <h2 className="m-0 font-display text-title-1">Flag Hunt</h2>
    <p className="m-0 text-body-lg text-fg-muted">A flag pops up. Tap its country on the globe.</p>
  </Card>
</Overlay>
```

Card paddings: `lg` (default) for start and end cards, `md` for game cards, `sm` for question cards. `Overlay` dims the board and centres the card; `scroll` lets tall content scroll clear of the corner buttons.

## Question card (game prompt)

```tsx
import { Card } from '../ui/Card';
import { Flag } from '../ui/Flag';

<Card padding="sm" className="flex items-center gap-4">
  <Flag code={code} alt="Find the country with this flag" />
  <div className="flex flex-col gap-0.5">
    <span className="font-display text-title-2">Find this country</span>
    <span className="text-body font-bold text-fg-muted">Tap it on the globe. Drag to spin.</span>
  </div>
</Card>
```

`Flag` sizes: `xs` (map tooltip), `sm` (lists), `md` (default, question cards), `lg` (meet card), `fill` (as wide as its box: flag choices, memory cards). `alt` says what the flag is for, or `""` when the text next to it names it.

## Answer toasts

```tsx
import { Feedback } from '../ui/Feedback';

<Feedback tone="correct" title="Yes! France" detail="+10 points · flag painted on the globe" />
<Feedback tone="oops" title="Oops, that's Spain!" detail="France is right next door." />
<Feedback tone="hint" detail="Look for a blue, white and red flag." />
```

Each tone pairs its colour with an icon badge. Without `title`, `detail` is one line as tall as a main button. `raised` adds a small drop for a toast floating over the board; `phoneCard` makes it take the question card's place on phones. `tone="idle"` is a resting how-to line with no badge. It renders an `<output>`, so screen readers hear each new message.

## Tabs (pill style)

For route-level navigation (main nav, section tabs), where each tab stands alone.

```tsx
import { PillTabs } from '../ui/PillTabs';
import { BookIcon, CompassIcon } from '../ui/icons';

<PillTabs aria-label="Main">
  <PillTabs.Item render={<Link to="/country/discover" activeProps={{}} />}><CompassIcon /> Discover</PillTabs.Item>
  <PillTabs.Item render={<Link to="/country/learn" activeProps={{}} />}><BookIcon /> Learn</PillTabs.Item>
</PillTabs>
```

The active tab is filled from `aria-current="page"`, which TanStack's `Link` sets. Every tab has an icon and a word.

## Segmented switch (one choice out of 2-4)

For picking one option in place: Day / Night / Auto, Map / Globe, Easy / Medium / Hard filters. It is ONE sticker: the container carries the outline and drop, the options inside are borderless, and only the selected option is filled (`ocean-500`).

```tsx
import { SegmentedSwitch } from '../ui/SegmentedSwitch';
import { MoonIcon, SunIcon } from '../ui/icons';

<SegmentedSwitch
  aria-label="Colour theme"
  value={[theme]}
  onValueChange={(values) => { if (values[0]) setTheme(values[0]); }} // never allow "nothing selected"
>
  <SegmentedSwitch.Item value="light"><SunIcon />Day</SegmentedSwitch.Item>
  <SegmentedSwitch.Item value="dark"><MoonIcon />Night</SegmentedSwitch.Item>
</SegmentedSwitch>
```

When the options are routes (Map / Globe search param), render a `<nav>` of TanStack `<Link>`s and set `aria-current` yourself (see `src/ViewSwitch.tsx`):

```tsx
<SegmentedSwitch render={<nav aria-label="View" />}>
  <SegmentedSwitch.Item render={<Link search={…} activeProps={{}} activeOptions={{ exact: true }} aria-current={isMap ? 'page' : undefined} />}>Map</SegmentedSwitch.Item>
  …
</SegmentedSwitch>
```

`activeOptions={{ exact: true }}` matters: TanStack's default partial search match would mark both links as current.

## Theme switch placement

The theme is a setting, not a main action. Kids rarely change it, so it must never be the loudest thing in a bar.

- **Top bar:** one `IconButton` in the far corner, showing the current theme (sun by day, moon at night), `aria-label="Switch to night"` / `"Switch to day"`. A press flips Day ↔ Night and saves it (`src/ThemeToggle.tsx`).
- **Full choice (Day / Night / Same as device):** the segmented switch above, inside a settings Popover opened from that icon button or on a settings screen. Never the 3-option switch directly in the top bar.
- Default is "Same as device" (no `data-theme`); store the choice in `localStorage` and apply it in a `<head>` script before paint to avoid a flash.

## Base UI patterns

Base UI parts take a primitive through `render`, so they keep Base UI's behaviour and the primitive's look. Check the Base UI docs for each component's parts and state attributes.

```tsx
import { Dialog } from '@base-ui/react/dialog';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { XIcon } from '../ui/icons';

<Dialog.Root>
  <Dialog.Trigger render={<Button />}>Change mode</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop className="fixed inset-0 bg-scrim" />
    <Dialog.Popup render={<Card />} className="fixed top-1/2 left-1/2 w-[min(760px,calc(100vw-32px))] -translate-1/2">
      <Dialog.Title className="m-0 font-display text-title-1">Pick how tricky</Dialog.Title>
      <Dialog.Description className="m-0 text-body-lg text-fg-muted">You have 3 hearts.</Dialog.Description>
      {/* mode cards */}
      <Dialog.Close render={<IconButton aria-label="Close" />}><XIcon /></Dialog.Close>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>
```

Same for menus: `<Menu.Trigger render={<IconButton aria-label="Menu" />}>` (see `IconButton.stories.tsx`).

Use Base UI for: the mode picker and result dialogs (Dialog), the Day / Night / Same as device switch (`SegmentedSwitch`, a ToggleGroup), map tooltips that need keyboard access (Tooltip / Popover), section tabs that swap content in place (Tabs), and in-game toasts (Toast). Route changes (Learn / Play, Map / Globe search param) stay TanStack Router `<Link>`s inside `PillTabs` or `SegmentedSwitch`.

Animate popups with `ease-bouncy duration-(--dur-pop)` on Base UI's starting/ending style attributes, and `motion-reduce:transition-none`.
