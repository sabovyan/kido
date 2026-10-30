import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Menu } from '@base-ui/react/menu';
import { FOCUS_RING } from './ui/focus';
import { IconButton } from './ui/IconButton';
import { BookIcon, CompassIcon, MenuIcon, TargetIcon, XIcon } from './ui/icons';

const ITEM = `flex h-tap-icon items-center gap-3 rounded-md px-4 text-label no-underline transition-colors duration-(--dur-tap) motion-reduce:transition-none ${FOCUS_RING}`;
const ITEM_ACTIVE = { className: 'bg-ocean-500 text-on-ocean' };
const ITEM_INACTIVE = { className: 'text-fg hover:bg-surface-sunk data-highlighted:bg-surface-sunk' };

// Phones only: the page links live behind a ☰ button at the right of the top bar.
export function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger render={<IconButton aria-label={open ? 'Close menu' : 'Menu'} className="md:hidden" />}>
        {open ? <XIcon /> : <MenuIcon />}
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
