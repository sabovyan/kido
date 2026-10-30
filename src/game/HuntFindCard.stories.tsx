import type { Meta, StoryObj } from '@storybook/react-vite';
import { Feedback } from '../ui/Feedback';
import { HuntFindCard } from './HuntFindCard';
import { inDock } from './storyFrames';

const meta = {
  title: 'Flag Hunt/Find card',
  component: HuntFindCard,
  decorators: [inDock],
  args: { code: 'np' },
} satisfies Meta<typeof HuntFindCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// On phones the feedback takes the card's place.
export const Correct: Story = {
  args: { hidden: true },
  render: args => (
    <>
      <Feedback tone="correct" title="Yes! Nepal" detail="+12 points · +0.10% land painted" phoneCard />
      <HuntFindCard {...args} />
    </>
  ),
};

export const Oops: Story = {
  args: { hidden: true },
  render: args => (
    <>
      <Feedback tone="oops" title="Oops, that's India" detail="Nepal is the yellow one, 1,032 km away." phoneCard />
      <HuntFindCard {...args} />
    </>
  ),
};
