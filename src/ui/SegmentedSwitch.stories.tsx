import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { userEvent } from 'storybook/test';
import { MoonIcon, SunIcon } from './icons';
import { SegmentedSwitch } from './SegmentedSwitch';

// Hover an unselected option to see it tint. Tab in to see the focus ring.
const meta = {
  title: 'UI/SegmentedSwitch',
  component: SegmentedSwitch,
} satisfies Meta<typeof SegmentedSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

function ThemeSwitch() {
  const [theme, setTheme] = useState('light');
  return (
    <SegmentedSwitch
      aria-label="Colour theme"
      value={[theme]}
      // Never allow "nothing selected".
      onValueChange={values => { if (values[0]) setTheme(values[0]); }}
    >
      <SegmentedSwitch.Item value="light"><SunIcon />Day</SegmentedSwitch.Item>
      <SegmentedSwitch.Item value="dark"><MoonIcon />Night</SegmentedSwitch.Item>
      <SegmentedSwitch.Item value="auto">Same as device</SegmentedSwitch.Item>
    </SegmentedSwitch>
  );
}

// Toggles: pick one in place.
export const Toggles: Story = { render: () => <ThemeSwitch /> };

// Links: the options are routes, selected from `aria-current`.
export const Links: Story = {
  parameters: { router: { path: '/country/discover' } },
  render: () => (
    <SegmentedSwitch render={<nav aria-label="View" />}>
      <SegmentedSwitch.Item render={<Link to="/country/discover" activeProps={{}} aria-current="page" />}>Map</SegmentedSwitch.Item>
      <SegmentedSwitch.Item render={<Link to="/country/discover" search={{ view: 'globe' }} activeProps={{}} />}>Globe</SegmentedSwitch.Item>
    </SegmentedSwitch>
  ),
};

export const Disabled: Story = {
  render: () => (
    <SegmentedSwitch aria-label="View" defaultValue={['map']} disabled>
      <SegmentedSwitch.Item value="map">Map</SegmentedSwitch.Item>
      <SegmentedSwitch.Item value="globe">Globe</SegmentedSwitch.Item>
    </SegmentedSwitch>
  ),
};

export const FocusVisible: Story = {
  name: 'Focus visible',
  render: () => <ThemeSwitch />,
  // The router mounts the story after play starts, so wait for it before tabbing in.
  play: async ({ canvas }) => {
    await canvas.findAllByRole('button');
    await userEvent.tab();
  },
};
