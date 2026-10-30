import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Feedback } from '../ui/Feedback';
import { CheckCard } from './CheckCard';
import { inDock } from './storyFrames';

const meta = {
  title: 'Learn/Check card',
  component: CheckCard,
  decorators: [inDock],
  args: { code: 'np', board: 'globe', onNotYet: fn() },
} satisfies Meta<typeof CheckCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OnTheMap: Story = { name: 'On the map', args: { board: 'map' } };

// After an answer the feedback sits on top and "Not yet" waits.
export const Answered: Story = {
  args: { disabled: true },
  render: args => (
    <>
      <Feedback raised tone="hint" title="No problem!" detail="Let's meet this one." />
      <CheckCard {...args} />
    </>
  ),
};
