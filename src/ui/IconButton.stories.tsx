import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu } from '@base-ui/react/menu';
import { userEvent } from 'storybook/test';
import { IconButton } from './IconButton';
import { MenuIcon, MoonIcon, XIcon } from './icons';

// Pressing sinks it. Tab to it to see the focus ring.
const meta = {
  title: 'UI/IconButton',
  component: IconButton,
  args: { 'aria-label': 'Switch to night', children: <MoonIcon /> },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Inside a card, such as the map card's Close button.
export const Small: Story = { args: { size: 'sm', 'aria-label': 'Close', children: <XIcon /> } };

export const Disabled: Story = { args: { disabled: true } };

export const FocusVisible: Story = {
  name: 'Focus visible',
  // The router mounts the story after play starts, so wait for it before tabbing in.
  play: async ({ canvas }) => {
    await canvas.findAllByRole('button');
    await userEvent.tab();
  },
};

// As a Base UI part. While the menu is open the button looks pressed.
export const MenuTrigger: Story = {
  name: 'Menu trigger',
  render: () => (
    <Menu.Root>
      <Menu.Trigger render={<IconButton aria-label="Menu" />}>
        <MenuIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={12}>
          <Menu.Popup className="rounded-lg border-3 border-outline bg-surface p-2 font-body text-label text-fg shadow-drop-lg">
            <Menu.Item className="flex h-tap-icon items-center rounded-md px-4 data-highlighted:bg-surface-sunk">Discover</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton aria-label="Stop game"><XIcon size={22} strokeWidth="3" /></IconButton>
      <IconButton size="sm" aria-label="Close"><XIcon /></IconButton>
    </div>
  ),
};
