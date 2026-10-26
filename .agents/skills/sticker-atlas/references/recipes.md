# Sticker Atlas recipes

Copy-ready markup. Preflight is off, so recipes set borders, backgrounds and margins explicitly. Icons are placeholders (`<PlayIcon />` etc.): inline stroke SVGs per the icon rule in SKILL.md.

## Buttons

```tsx
// Main action: one per screen
<button type="button" className="inline-flex h-tap-main items-center gap-2.5 rounded-md border-3 border-outline bg-sun-400 px-7 font-display text-title-2 text-on-sun shadow-drop-md transition-transform duration-(--dur-tap) hover:-translate-y-0.5 active:translate-y-[5px] active:bg-sun-600 active:shadow-none disabled:cursor-default">
  <PlayIcon aria-hidden="true" /> Play
</button>

// Continue
<button type="button" className="h-tap-main rounded-md border-3 border-outline bg-ocean-500 px-7 font-display text-title-2 text-on-ocean shadow-drop-md active:translate-y-[5px] active:bg-ocean-700 active:shadow-none">
  Play again
</button>

// Other choice
<button type="button" className="h-tap-main rounded-md border-3 border-outline bg-surface px-7 font-display text-title-2 text-fg shadow-drop-md active:translate-y-[5px] active:shadow-none">
  Change mode
</button>

// Icon-only
<button type="button" aria-label="Zoom in" className="grid size-tap-icon place-items-center rounded-md border-3 border-outline bg-surface text-fg shadow-drop-sm active:translate-y-1 active:shadow-none">
  <PlusIcon aria-hidden="true" />
</button>
```

Disabled buttons say why in the label ("Loading globe…") and use `border-dashed bg-surface-sunk text-fg-muted shadow-none`.

Every focusable element also gets `focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500`.

## Chips (score bar)

```tsx
<div className="flex h-tap-min items-center gap-2 rounded-pill border-3 border-outline bg-surface px-4 text-fg">
  <StarIcon aria-hidden="true" className="fill-sun-400" />
  <span className="font-display text-title-3 tabular-nums">120</span>
</div>

// Streak (reward)
<div className="flex h-tap-min items-center gap-2 rounded-pill border-3 border-outline bg-grape-500 px-4 text-on-grape">…</div>
```

Lives: filled hearts `fill-coral-500`; a lost heart is dashed and empty (`fill-surface-sunk stroke-fg-muted`), plus `role="img" aria-label="2 of 3 hearts left"` on the group.

## Cards and overlays

```tsx
<section className="flex flex-col gap-4 rounded-lg border-3 border-outline bg-surface p-7 text-fg shadow-drop-lg">
  <h2 className="m-0 font-display text-title-1">Flag Hunt</h2>
  <p className="m-0 text-body-lg text-fg-muted">A flag pops up. Tap its country on the globe.</p>
</section>
```

Overlay behind a card: `fixed inset-0 grid place-items-center bg-scrim p-4`.

## Question card (game prompt)

```tsx
<div className="flex items-center gap-4 rounded-lg border-3 border-outline bg-surface px-5 py-3.5 text-fg shadow-drop-lg">
  <img src={flagUrl(code)} alt="Flag to find" className="h-16 w-24 rounded-sm border-3 border-outline object-cover" />
  <div className="flex flex-col gap-0.5">
    <span className="font-display text-title-2">Find this country</span>
    <span className="text-body font-bold text-fg-muted">Tap it on the globe. Drag to spin.</span>
  </div>
</div>
```

## Answer toasts

```tsx
<div role="status" className="flex items-center gap-3 rounded-md border-3 border-outline bg-tint-correct px-4 py-3 text-on-tint-correct">
  <span className="grid size-10 shrink-0 place-items-center rounded-full border-3 border-on-leaf bg-leaf-500 text-on-leaf"><CheckIcon aria-hidden="true" /></span>
  <div className="flex flex-col">
    <span className="font-display text-title-3">Yes! France</span>
    <span className="text-caption">+10 points · flag painted on the globe</span>
  </div>
</div>
```

Oops: `bg-tint-oops text-on-tint-oops`, `bg-coral-500` badge with an X icon, kind copy ("Oops, that's Spain! France is right next door."). Hint: `bg-tint-hint text-on-tint-hint`, `bg-sun-400` badge with a bulb icon.

Elements on a bright brand fill (badges, Sun/Leaf/Coral buttons) keep an ink edge in both themes: use the matching `border-on-*` (e.g. `border-on-leaf`) instead of `border-outline`, which turns light at night.

## Tabs (pill style)

For route-level navigation (main nav, section tabs), where each tab stands alone.

- Active: `rounded-pill border-3 border-outline bg-ocean-500 text-on-ocean` (main nav) or `bg-sun-400 text-on-sun` (section tabs).
- Inactive: `rounded-pill border-3 border-outline bg-surface text-fg`.
- Standalone tabs use `h-tap-min`. Every tab has an icon and a word.

## Segmented switch (one choice out of 2-4)

For picking one option in place: Day / Night / Auto, Map / Globe, Easy / Medium / Hard filters. It is ONE sticker: the container carries the outline and drop, the options inside are borderless, and only the selected option is filled. Never give each option its own outline and gap; that reads as separate buttons.

```tsx
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';

const OPTION =
  'inline-flex h-tap-min cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-4 font-body text-label text-fg ' +
  'transition-colors duration-(--dur-tap) motion-reduce:transition-none hover:bg-surface-sunk ' +
  'data-[pressed]:bg-ocean-500 data-[pressed]:text-on-ocean ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';

<ToggleGroup
  aria-label="Colour theme"
  value={[theme]}
  onValueChange={(values) => { if (values[0]) setTheme(values[0]); }} // never allow "nothing selected"
  className="inline-flex gap-1 rounded-md border-3 border-outline bg-surface p-1 shadow-drop-sm"
>
  <Toggle value="light" className={OPTION}><SunIcon aria-hidden="true" />Day</Toggle>
  <Toggle value="dark" className={OPTION}><MoonIcon aria-hidden="true" />Night</Toggle>
  <Toggle value="auto" className={OPTION}><DeviceIcon aria-hidden="true" />Same as device</Toggle>
</ToggleGroup>
```

- Options are 48px tall (`h-tap-min`); the whole switch is ~62px with padding and border.
- The selected fill is `ocean-500`. Use `sun-400` only if this switch IS the screen's one main action (rare).
- The container does not sink on press; the option changes fill instantly.
- When the options are routes (Map / Globe search param), render TanStack `<Link>`s with the same classes and set the selected style from the active route instead of `data-[pressed]`.

## Theme switch placement

The theme is a setting, not a main action. Kids rarely change it, so it must never be the loudest thing in a bar.

- **Top bar:** one icon button in the far corner, `size-tap-icon` (see "Icon-only" above), showing the current theme (sun by day, moon at night), `aria-label="Switch to night"` / `"Switch to day"`. A press flips Day ↔ Night and saves it.
- **Full choice (Day / Night / Same as device):** the segmented switch above, inside a settings Popover opened from that icon button or on a settings screen. Never the 3-option switch directly in the top bar.
- Default is "Same as device" (no `data-theme`); store the choice in `localStorage` and apply it in a `<head>` script before paint to avoid a flash.
- The toggle only shows a change on screens built with tokens; old screens with hard-coded colours must be migrated before the theme visibly switches there.

## Base UI patterns

Check the Base UI docs for each component's exact parts and state attributes before styling; style states with Tailwind data variants (e.g. `data-[pressed]:`, `data-[disabled]:`).

```tsx
import { Dialog } from '@base-ui/react/dialog';

<Dialog.Root>
  <Dialog.Trigger className="…secondary button…">Change mode</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop className="fixed inset-0 bg-scrim" />
    <Dialog.Popup className="fixed top-1/2 left-1/2 w-[min(760px,calc(100vw-32px))] -translate-1/2 rounded-lg border-3 border-outline bg-surface p-7 text-fg shadow-drop-lg">
      <Dialog.Title className="m-0 font-display text-title-1">Pick how tricky</Dialog.Title>
      <Dialog.Description className="m-0 text-body-lg text-fg-muted">You have 3 hearts.</Dialog.Description>
      {/* mode cards */}
      <Dialog.Close className="…icon button…" aria-label="Close"><XIcon aria-hidden="true" /></Dialog.Close>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>
```

Use Base UI for: the mode picker and result dialogs (Dialog), the Day / Night / Same as device switch (ToggleGroup + Toggle, see "Segmented switch"), map tooltips that need keyboard access (Tooltip / Popover), section tabs that swap content in place (Tabs), and in-game toasts (Toast). Route changes (Learn / Play, Map / Globe search param) stay TanStack Router `<Link>`s styled as tabs.

Animate popups with `ease-bouncy duration-(--dur-pop)` on Base UI's starting/ending style attributes, and `motion-reduce:transition-none`.
