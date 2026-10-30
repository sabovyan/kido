import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ModePicker } from './ModePicker';

const meta = {
  title: 'Flag Hunt/Mode picker',
  component: ModePicker,
  decorators: [Story => <div className="max-w-[704px]"><Story /></div>],
  args: { counts: { easy: 48, medium: 112, hard: 197 }, onPick: fn() },
} satisfies Meta<typeof ModePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// While the map loads.
export const Loading: Story = { args: { disabled: true, counts: {} } };
