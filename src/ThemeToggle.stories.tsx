import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Shell/ThemeToggle',
  component: ThemeToggle,
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

// The icon shows the theme a press switches to: a moon in Day, a sun in Night.
export const Default: Story = {};
