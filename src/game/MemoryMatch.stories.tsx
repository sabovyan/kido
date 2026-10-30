import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MatchCard } from './MatchCard';
import { MemoryMatch, type MemoryCountry } from './MemoryMatch';
import { inScrollOverlay, loadCountries } from './storyFrames';

// The countries come from the story's loader, with their map shapes.
const meta = {
  title: 'Learn/Memory match',
  component: MemoryMatch,
  decorators: [inScrollOverlay],
  args: { countries: [], onMatch: fn(), onDone: fn() },
  render: (args, { loaded }) => (
    <MatchCard>
      <MemoryMatch {...args} countries={loaded.countries as MemoryCountry[]} />
    </MatchCard>
  ),
} satisfies Meta<typeof MemoryMatch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TwoCountries: Story = { loaders: [loadCountries(['np', 'lu'])] };

export const SixCountries: Story = { loaders: [loadCountries(['np', 'lu', 'md', 'fr', 'jp', 'br'])] };
