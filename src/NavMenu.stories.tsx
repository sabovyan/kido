import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavMenu } from './NavMenu';

// Phones only: the button is hidden from 768px up, so pick the Phone viewport.
const meta = {
  title: 'Shell/NavMenu',
  component: NavMenu,
  parameters: { router: { path: '/country/learn' } },
  globals: { viewport: { value: 'phone' } },
} satisfies Meta<typeof NavMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
