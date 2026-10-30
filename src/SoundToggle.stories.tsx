import type { Meta, StoryObj } from '@storybook/react-vite';
import { SoundToggle } from './SoundToggle';

const meta = {
  title: 'Shell/SoundToggle',
  component: SoundToggle,
} satisfies Meta<typeof SoundToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

// Renders nothing in a browser with no speech voices, as in the app.
export const Default: Story = {};
