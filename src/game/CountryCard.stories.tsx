import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Feedback } from '../ui/Feedback';
import { CountryCard } from './CountryCard';
import { inDock } from './storyFrames';

// Best-known first, as Learn orders them; the card names neighbours from this list.
const ORDER = [
  { code: 'in', name: 'India' },
  { code: 'cn', name: 'China' },
  { code: 'np', name: 'Nepal' },
  { code: 'lu', name: 'Luxembourg' },
  { code: 'fr', name: 'France' },
  { code: 'de', name: 'Germany' },
  { code: 'be', name: 'Belgium' },
];

const meta = {
  title: 'Learn/Meet card',
  component: CountryCard,
  decorators: [inDock],
  args: {
    target: { code: 'np', name: 'Nepal' },
    order: ORDER,
    board: 'globe',
    open: false,
    saidHi: false,
    onOpenChange: fn(),
    onNext: fn(),
  },
} satisfies Meta<typeof CountryCard>;

export default meta;

type Story = StoryObj<typeof meta>;

// Desktop shows the facts; phones fold them behind "Fun facts".
export const Default: Story = {};

export const FactsOpen: Story = { args: { open: true } };

export const Luxembourg: Story = { args: { target: { code: 'lu', name: 'Luxembourg' } } };

// After a tap on the right country, Next waits for the next step.
export const SaidHi: Story = {
  args: { saidHi: true },
  render: args => (
    <>
      <Feedback raised tone="correct" title="Hi, Nepal!" detail="Nice to meet you." />
      <CountryCard {...args} />
    </>
  ),
};
