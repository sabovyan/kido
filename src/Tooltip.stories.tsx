import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'Map/Tooltip',
  component: Tooltip,
  args: { tip: { x: 24, y: 24, country: { name: 'France', code: 'fr' } } },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Some map shapes have no flag.
export const NoFlag: Story = { args: { tip: { x: 24, y: 24, country: { name: 'Antarctica', code: null } } } };
