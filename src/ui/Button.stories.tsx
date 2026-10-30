import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from '@tanstack/react-router';
import { userEvent } from 'storybook/test';
import { Button } from './Button';
import { ArrowRightIcon, ChevronIcon } from './icons';

// Hover lifts the big buttons; pressing sinks every button. Tab to a button to see its focus ring.
const meta = {
  title: 'UI/Button',
  component: Button,
  args: { variant: 'main', size: 'lg', children: 'Play' },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Main: Story = { args: { children: <>Try Medium <ArrowRightIcon /></> } };

export const Continue: Story = { args: { variant: 'continue', children: 'Play again' } };

export const Other: Story = { args: { variant: 'other', children: 'Change mode' } };

export const Medium: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="continue" size="md">Next <ArrowRightIcon /></Button>
      <Button variant="other" size="md">Fun facts <ChevronIcon /></Button>
      <Button variant="main" size="md">Learn these <ArrowRightIcon /></Button>
    </div>
  ),
};

// Disabled buttons say why in their label.
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="main" disabled>Loading map…</Button>
      <Button variant="continue" size="md" disabled>Next <ArrowRightIcon /></Button>
      <Button variant="other" size="md" disabled>I don't know</Button>
    </div>
  ),
};

export const AsLink: Story = {
  name: 'As a link',
  args: { variant: 'other', render: <Link to="/country/games" />, children: 'Play Flag Hunt' },
};

// Full width on phones, side by side from 768px up.
export const Fill: Story = {
  globals: { viewport: { value: 'phone' } },
  render: () => (
    <div className="flex flex-wrap justify-center gap-3 max-md:flex-col">
      <Button variant="main" fill>Try Medium <ArrowRightIcon /></Button>
      <Button variant="other" fill>Play Easy again</Button>
      <Button variant="other" size="md" fill>Learn these <ArrowRightIcon /></Button>
    </div>
  ),
};

export const FocusVisible: Story = {
  name: 'Focus visible',
  // The router mounts the story after play starts, so wait for it before tabbing in.
  play: async ({ canvas }) => {
    await canvas.findAllByRole('button');
    await userEvent.tab();
  },
};

export const AllVariants: Story = {
  name: 'All variants',
  render: () => (
    <div className="flex flex-col gap-4">
      {(['lg', 'md'] as const).map(size => (
        <div key={size} className="flex flex-wrap items-center gap-3">
          <Button variant="main" size={size}>Play</Button>
          <Button variant="continue" size={size}>Next</Button>
          <Button variant="other" size={size}>Not now</Button>
          <Button variant="other" size={size} disabled>Loading…</Button>
        </div>
      ))}
    </div>
  ),
};
