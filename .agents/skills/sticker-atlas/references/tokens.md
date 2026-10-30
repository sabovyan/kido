# Sticker Atlas tokens

Defined in `src/styles.css`. Static tokens live in `@theme`; Day/Night tokens are CSS variables on `:root` (Day), overridden for Night under `@media (prefers-color-scheme: dark)` (unless `data-theme="light"`) and under `:root[data-theme="dark"]`, and exposed to Tailwind through `@theme inline`.

## Semantic colours (switch with the theme)

| Use | Tailwind colour | CSS var | Day | Night |
| --- | --- | --- | --- | --- |
| Page background | `page` | `--bg` | #EEF7FF | #0B1630 |
| Cards, tooltips, prompts | `surface` | `--surface` | #FFFFFF | #16264F |
| Tracks, wells, inactive tab bg | `surface-sunk` | `--surface-sunk` | #D6ECFF | #0F1D40 |
| Main text | `fg` | `--text` | #14213D | #F2F6FF |
| Helper text | `fg-muted` | `--text-muted` | #4A5878 | #B9C6E4 |
| Sticker outlines | `outline` | `--outline` | #14213D | #8EA2D6 |
| Sticker drop shadow | `drop` | `--drop` | #14213D | #050A18 |
| Links | `link` | `--link` | #1A63D6 | #8DB8FF |
| Correct message bg / text | `tint-correct` / `on-tint-correct` | `--tint-correct` | #D2F5E2 / #14213D | #12402D / #D2F5E2 |
| Oops message bg / text | `tint-oops` / `on-tint-oops` | `--tint-oops` | #FFE1DD / #14213D | #4A1E22 / #FFE1DD |
| Hint message bg / text | `tint-hint` / `on-tint-hint` | `--tint-hint` | #FFE9A8 / #14213D | #4A3A0E / #FFE9A8 |
| Reward bg / text | `tint-reward` / `on-tint-reward` | `--tint-reward` | #E6DFFF / #14213D | #2E2366 / #E6DFFF |
| Behind the globe | `backdrop` | `--space-bg` | #BFE3FF (sky) | #060C1C (space) |
| Overlay scrim | `scrim` | `--scrim` | ink 35% | night 60% |
| Map sea | `map-sea` | `--map-sea` | #6EC1F5 | #1E4E8C |
| Unpainted land | `map-land` | `--map-land` | #F5EEDB | #D9D1BC |
| Country borders | `map-border` | `--map-border` | #3B4A6B | #0B1630 |
| Right answer on map | `map-answer` | `--map-answer` | Sun 400 | Sun 400 |
| Wrong pick on map | `map-wrong` | `--map-wrong` | Coral 500 | Coral 500 |

Use as `bg-*`, `text-*`, `border-*`, `fill-*`, `stroke-*`, `outline-*` (e.g. `bg-tint-oops text-on-tint-oops`).

## Brand colours (same in both themes)

| Colour | Classes | Hex | Text on it | Use |
| --- | --- | --- | --- | --- |
| Ocean | `ocean-500`, `ocean-700` (pressed) | #1A63D6, #0F4AA8 | `on-ocean` (white) | Continue buttons, active tabs, focus ring |
| Sun | `sun-400`, `sun-600` (pressed) | #FFC83D, #E0A100 | `on-sun` (ink) | The one "do this now" button, score star, answer on map |
| Leaf | `leaf-500`, `leaf-700` | #2DBE7B, #12804F | `on-leaf` (ink) | Correct, collected flags, progress fill |
| Coral | `coral-500`, `coral-700` | #FF6B5E, #C2362B | `on-coral` (ink) | Hearts/lives, wrong pick (always with an icon) |
| Grape | `grape-500`, `grape-700` | #6A4BEB, #4B2FC2 | `on-grape` (white) | Streaks, badges, rewards |

## Type

| Class | Size / line height · weight | Font | Use |
| --- | --- | --- | --- |
| `text-display` | 56 / 60 · 800 | `font-display` | Big celebrations |
| `text-title-1` | 40 / 44 · 800 | `font-display` | Screen titles |
| `text-title-2` | 28 / 32 · 700 | `font-display` | Card titles, game prompt |
| `text-title-3` | 22 / 28 · 700 | `font-display` | Section titles, toast titles |
| `text-body-lg` | 20 / 30 · 600 | `font-body` | Intros, instructions |
| `text-body` | 18 / 28 · 500 | `font-body` | Default text |
| `text-label` | 18 / 20 · 900 | `font-body` | Buttons, tabs, chips |
| `text-number` | 32 / 32 · 800 | `font-display` | Scores (add `tabular-nums`) |
| `text-caption` | 15 / 20 · 800 | `font-body` | Smallest text allowed |

The `text-*` size classes set line height and weight too; override with `leading-*` / `font-*` only if needed. Fonts (Baloo 2 600-800, Nunito 500-900) are loaded in `src/routes/__root.tsx`.

## Space, shape, motion

The `src/ui` primitives already apply the outline, radius, drop and press motion below; use them instead of repeating these classes on buttons, cards, chips or toasts (see `recipes.md`).

- Spacing: Tailwind's 4px scale (`--spacing: 4px`): `1`=4, `2`=8, `3`=12, `4`=16, `6`=24, `8`=32, `12`=48, `16`=64.
- Tap sizes: `tap-min` 48px, `tap-icon` 56px, `tap-main` 64px (`h-tap-main`, `size-tap-icon`, `min-h-tap-min`).
- Radius: `rounded-sm` 12, `rounded-md` 16, `rounded-lg` 24, `rounded-pill` 999.
- Outline: `border-3 border-outline` (2px only on tiny chips inside cards).
- Shadows: `shadow-drop-sm` (0 4px 0), `shadow-drop-md` (0 5px 0), `shadow-drop-lg` (0 6px 0), coloured `--drop`. Never blurred shadows.
- Easing: `ease-bouncy` = cubic-bezier(.34, 1.56, .64, 1).
- Durations (CSS vars, use as `duration-(--dur-pop)`): `--dur-tap` 90ms, `--dur-pop` 240ms, `--dur-wobble` 360ms, `--dur-fly` 1200ms.

## Theme switching

- Default: follow the device (`prefers-color-scheme`).
- Force a theme: set `data-theme="light"` or `data-theme="dark"` on `<html>`. Remove the attribute for "Auto".
- `dark:` utilities follow the same rule.
