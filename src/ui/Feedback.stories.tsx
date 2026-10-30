import type { Meta, StoryObj } from '@storybook/react-vite';
import { Feedback } from './Feedback';

const meta = {
  title: 'UI/Feedback',
  component: Feedback,
  decorators: [Story => <div className="flex max-w-[560px] flex-col gap-3"><Story /></div>],
  args: { tone: 'correct', title: 'Yes! France', detail: '+10 points · +0.4% land painted' },
} satisfies Meta<typeof Feedback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Correct: Story = {};

export const Oops: Story = { args: { tone: 'oops', title: "Oops, that's Spain", detail: 'France is the yellow one, 1,050 km away.' } };

export const Hint: Story = { args: { tone: 'hint', title: 'No problem!', detail: "Let's meet this one." } };

// A toast floating over the board (Learn).
export const Raised: Story = { args: { raised: true } };

// On phones it takes the question card's place (Flag Hunt).
export const PhoneCard: Story = { name: 'Phone card', args: { phoneCard: true }, globals: { viewport: { value: 'phone' } } };

// One line, no title (the flag jigsaw).
export const Line: Story = {
  render: () => (
    <>
      <Feedback tone="idle" detail="Drag a piece to its spot. Or tap a piece, then a spot." />
      <Feedback tone="correct" detail="Yes! That piece fits." />
      <Feedback tone="hint" detail="Not there. Try another spot!" />
      <Feedback tone="oops" detail="Oops, try again." />
    </>
  ),
};
