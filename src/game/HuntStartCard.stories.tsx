import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ViewSwitch } from '../ViewSwitch';
import { HuntStartCard } from './HuntStartCard';
import { inOverlay } from './storyFrames';

const meta = {
  title: 'Flag Hunt/Start card',
  component: HuntStartCard,
  decorators: [inOverlay],
  args: { view: 'globe', lives: 3, loading: false, counts: { easy: 48, medium: 112, hard: 197 }, onPick: fn() },
} satisfies Meta<typeof HuntStartCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GlobeView: Story = { name: 'Globe' };

export const MapView: Story = { name: 'Map', args: { view: 'map' } };

export const Loading: Story = { args: { loading: true, counts: {} } };

// On phones the card holds the Map / Globe switch.
export const WithViewSwitch: Story = {
  args: { viewSwitch: <ViewSwitch from="/country/games" isMap={false} /> },
  parameters: { router: { path: '/country/games' } },
};
