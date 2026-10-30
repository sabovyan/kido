import type { Meta, StoryObj } from '@storybook/react-vite';
import { FindCard } from './FindCard';
import { inDock } from './storyFrames';

const meta = {
  title: 'Learn/Find card',
  component: FindCard,
  decorators: [inDock],
  args: { code: 'np', board: 'globe' },
} satisfies Meta<typeof FindCard>;

export default meta;

type Story = StoryObj<typeof meta>;

// Practice: find a country by name and flag.
export const ByName: Story = { args: { name: 'Nepal' } };

// Practice: the flag is the only clue.
export const FlagOnly: Story = {};
