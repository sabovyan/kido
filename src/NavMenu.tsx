import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Menu } from '@base-ui/react/menu';

const ITEM = 'flex h-tap-icon items-center gap-3 rounded-md px-4 text-label no-underline transition-colors duration-(--dur-tap) motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500';
const ITEM_ACTIVE = { className: 'bg-ocean-500 text-on-ocean' };
const ITEM_INACTIVE = { className: 'text-fg hover:bg-surface-sunk data-highlighted:bg-surface-sunk' };

export function CompassIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </svg>
  );
}

export function TargetIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

export function BookIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.5C10 5 7.5 4.5 4 4.5v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-14c-3.5 0-6 .5-8 2z" />
      <path d="M12 6.5v14" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// Phones only: the page links live behind a ☰ button at the right of the top bar.
export function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger
        aria-label={open ? 'Close menu' : 'Menu'}
        className="grid size-tap-icon cursor-pointer place-items-center rounded-md border-3 border-outline bg-surface p-0 text-fg shadow-drop-sm transition-transform duration-(--dur-tap) active:translate-y-1 active:shadow-none motion-reduce:transition-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ocean-500 data-popup-open:bg-surface-sunk data-popup-open:shadow-none md:hidden"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Backdrop className="fixed inset-0 bg-scrim" />
        <Menu.Positioner side="bottom" align="end" sideOffset={12} className="outline-none">
          <Menu.Popup className="box-border flex w-65 origin-(--transform-origin) flex-col gap-1 rounded-lg border-3 border-outline bg-surface p-2 font-body shadow-drop-lg outline-none transition-[opacity,scale] duration-(--dur-pop) ease-bouncy data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0 motion-reduce:transition-none">
            <Menu.LinkItem closeOnClick className={ITEM} render={<Link to="/country/discover" activeProps={ITEM_ACTIVE} inactiveProps={ITEM_INACTIVE} />}>
              <CompassIcon />Discover
            </Menu.LinkItem>
            <Menu.LinkItem closeOnClick className={ITEM} render={<Link to="/country/learn" activeProps={ITEM_ACTIVE} inactiveProps={ITEM_INACTIVE} />}>
              <BookIcon />Learn
            </Menu.LinkItem>
            <Menu.LinkItem closeOnClick className={ITEM} render={<Link to="/country/games" activeProps={ITEM_ACTIVE} inactiveProps={ITEM_INACTIVE} />}>
              <TargetIcon />Games
            </Menu.LinkItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
