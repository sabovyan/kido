import type { Meta, StoryObj } from '@storybook/react-vite';
import { ViewSwitch } from './ViewSwitch';

const meta = {
  title: 'Shell/ViewSwitch',
  component: ViewSwitch,
  args: { from: '/country/games', isMap: true },
} satisfies Meta<typeof ViewSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MapView: Story = { name: 'Map', parameters: { router: { path: '/country/games?view=map' } } };

export const GlobeView: Story = { name: 'Globe', args: { isMap: false }, parameters: { router: { path: '/country/games' } } };
