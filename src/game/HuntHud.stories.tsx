import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { HuntHud, HuntStats } from './HuntHud';
import { onScreen } from './storyFrames';

const meta = {
  title: 'Flag Hunt/HUD',
  component: HuntHud,
  decorators: [onScreen],
  args: {
    playing: true,
    land: 0.124,
    onStop: fn(),
    children: <HuntStats lives={3} maxLives={3} score={46} streak={3} found={4} total={48} />,
  },
} satisfies Meta<typeof HuntHud>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playing: Story = {};

export const LastHeart: Story = {
  args: { land: 0.0041, children: <HuntStats lives={1} maxLives={3} score={12} streak={0} found={1} total={48} /> },
};

// Behind the end card: no Stop button.
export const RoundOver: Story = {
  args: { playing: false, land: 0.38, children: <HuntStats lives={0} maxLives={3} score={180} streak={0} found={14} total={48} /> },
};

// Desktop: while playing, the stats sit in the app's top bar.
export const TopBar: Story = {
  decorators: [Story => <div className="-m-4 flex justify-end border-b-3 border-outline bg-surface px-4 py-3"><Story /></div>],
  render: ({ children }) => <div className="flex flex-wrap justify-end gap-3 font-body text-fg">{children}</div>,
};
