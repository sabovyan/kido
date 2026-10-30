import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { Card } from './Card';
import { Overlay } from './Overlay';

// The overlay fills its nearest positioned box: here a stand-in for the board.
const meta = {
  title: 'UI/Overlay',
  component: Overlay,
  decorators: [Story => <div className="relative h-[560px] bg-map-sea"><Story /></div>],
  args: {
    children: (
      <Card render={<section />} className="flex max-w-[560px] flex-col gap-4 text-center">
        <h2 className="m-0 font-display text-title-1">Round done!</h2>
        <p className="m-0 text-body-lg">You found <b className="tabular-nums">8</b> of <b className="tabular-nums">10</b> flags.</p>
        <div className="flex flex-wrap justify-center gap-3 max-md:flex-col">
          <Button variant="main" fill>Play again</Button>
        </div>
      </Card>
    ),
  },
} satisfies Meta<typeof Overlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Tall content scrolls, clear of the corner buttons.
export const Scroll: Story = {
  args: {
    scroll: true,
    children: (
      <Card padding="md" render={<section />} className="box-border flex w-[680px] max-w-full flex-col items-center gap-4">
        <h2 className="m-0 font-display text-title-2">Find the pairs</h2>
        <div className="h-[720px] w-full rounded-md bg-surface-sunk" />
      </Card>
    ),
  },
};
