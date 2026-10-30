import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';
import { Flag } from './Flag';

const meta = {
  title: 'UI/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

// Start and end cards.
export const Large: Story = {
  args: {
    padding: 'lg',
    render: <section />,
    className: 'flex max-w-[560px] flex-col gap-4',
    children: (
      <>
        <h2 className="m-0 font-display text-title-1">Flag Hunt</h2>
        <p className="m-0 text-body-lg text-fg-muted">A flag pops up. Tap its country on the globe. You have 3 hearts.</p>
      </>
    ),
  },
};

// Game cards.
export const Medium: Story = {
  args: {
    padding: 'md',
    className: 'flex max-w-[480px] flex-col items-center gap-4',
    children: <h2 className="m-0 text-center font-display text-title-2">Build the flag of France</h2>,
  },
};

// Question cards over the board.
export const Small: Story = {
  args: {
    padding: 'sm',
    className: 'flex max-w-[560px] items-center gap-4',
    children: (
      <>
        <Flag code="fr" alt="Flag to find" />
        <span className="flex flex-col gap-0.5">
          <span className="font-display text-title-2">Find this country</span>
          <span className="text-body text-fg-muted">Tap it on the globe.</span>
        </span>
      </>
    ),
  },
};
