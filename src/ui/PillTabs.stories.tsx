import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from '@tanstack/react-router';
import { userEvent } from 'storybook/test';
import { BookIcon, CompassIcon, TargetIcon } from './icons';
import { PillTabs } from './PillTabs';

// The active tab follows the story's route.
const meta = {
  title: 'UI/PillTabs',
  component: PillTabs,
  args: { 'aria-label': 'Main' },
  render: args => (
    <PillTabs {...args}>
      <PillTabs.Item render={<Link to="/country/discover" />}><CompassIcon />Discover</PillTabs.Item>
      <PillTabs.Item render={<Link to="/country/learn" />}><BookIcon />Learn</PillTabs.Item>
      <PillTabs.Item render={<Link to="/country/games" />}><TargetIcon />Games</PillTabs.Item>
    </PillTabs>
  ),
} satisfies Meta<typeof PillTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Discover: Story = { parameters: { router: { path: '/country/discover' } } };

export const Learn: Story = { parameters: { router: { path: '/country/learn' } } };

export const FocusVisible: Story = {
  name: 'Focus visible',
  parameters: { router: { path: '/country/games' } },
  // The router mounts the story after play starts, so wait for it before tabbing in.
  play: async ({ canvas }) => {
    await canvas.findAllByRole('link');
    await userEvent.tab();
  },
};
