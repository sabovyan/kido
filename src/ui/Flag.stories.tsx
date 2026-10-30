import type { Meta, StoryObj } from '@storybook/react-vite';
import { Flag } from './Flag';

const meta = {
  title: 'UI/Flag',
  component: Flag,
  args: { code: 'fr', alt: 'Flag of France', size: 'md' },
} satisfies Meta<typeof Flag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      <Flag code="np" size="xs" alt="Flag of Nepal" />
      <Flag code="br" size="sm" alt="Flag of Brazil" />
      <Flag code="jp" size="md" alt="Flag of Japan" />
      <Flag code="ke" size="lg" alt="Flag of Kenya" />
    </div>
  ),
};

// As wide as its box: flag choices and memory cards.
export const Fill: Story = {
  render: () => (
    <div className="grid w-80 grid-cols-3 gap-3">
      <Flag code="it" size="fill" alt="Flag of Italy" />
      <Flag code="ie" size="fill" alt="Flag of Ireland" />
      <Flag code="ci" size="fill" alt="Flag of Côte d'Ivoire" />
    </div>
  ),
};
