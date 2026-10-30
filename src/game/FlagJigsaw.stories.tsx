import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FlagJigsaw } from './FlagJigsaw';
import { inScrollOverlay } from './storyFrames';

// Learn's build step. `key` deals a new puzzle when the country changes.
const meta = {
  title: 'Learn/Flag jigsaw',
  component: FlagJigsaw,
  decorators: [inScrollOverlay],
  args: { code: 'fr', name: 'France', onDone: fn() },
  render: args => (
    <div className="w-[480px] max-w-full">
      <FlagJigsaw key={args.code} {...args} />
    </div>
  ),
} satisfies Meta<typeof FlagJigsaw>;

export default meta;

type Story = StoryObj<typeof meta>;

export const France: Story = {};

// A tall flag: the frame keeps it on screen.
export const Nepal: Story = { args: { code: 'np', name: 'Nepal' } };

export const Japan: Story = { args: { code: 'jp', name: 'Japan' } };
