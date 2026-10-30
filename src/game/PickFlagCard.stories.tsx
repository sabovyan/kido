import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Feedback } from '../ui/Feedback';
import { PickFlagCard } from './PickFlagCard';
import { inDock } from './storyFrames';

// The board lights the country up for this card: see "Boards" → "Learn practice".
const meta = {
  title: 'Learn/Pick the flag card',
  component: PickFlagCard,
  decorators: [inDock],
  args: {
    choices: [
      { code: 'bt', name: 'Bhutan' },
      { code: 'np', name: 'Nepal' },
      { code: 'lk', name: 'Sri Lanka' },
    ],
    onPick: fn(),
  },
} satisfies Meta<typeof PickFlagCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Missed: Story = {
  args: { disabled: true },
  render: args => (
    <>
      <Feedback raised tone="oops" title="Oops, that's the flag of Bhutan" detail="This is Nepal. Look at its flag! We'll try again soon." />
      <PickFlagCard {...args} />
    </>
  ),
};
