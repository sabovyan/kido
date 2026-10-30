import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { BoardProps } from './board';
import { GlobeBoard } from './GlobeBoard';
import { PickFlagCard } from './PickFlagCard';
import { QuestionDock } from './QuestionDock';
import { type BoardScene, loadScene, Screen } from './storyFrames';

// The world, paints and focus come from each story's loader.
const meta = {
  title: 'Boards/Globe',
  args: { onPick: fn() },
  render: ({ onPick }, { loaded }) => (
    <Screen globe>
      <GlobeBoard {...(loaded as BoardScene)} onPick={onPick} />
    </Screen>
  ),
} satisfies Meta<Pick<BoardProps, 'onPick'>>;

export default meta;

type Story = StoryObj<typeof meta>;

// A new round: every country blank.
export const Blank: Story = { loaders: [loadScene({})] };

// Nepal lit up as the target, its neighbours India and China showing their flags.
export const Nepal: Story = { loaders: [loadScene({ target: 'np', flags: ['in', 'cn'] })] };

// A tiny target between flags.
export const TinyTarget: Story = { name: 'Tiny target (Luxembourg)', loaders: [loadScene({ target: 'lu', flags: ['be', 'fr', 'de'] })] };

// The target's yellow next to flags with yellow in them (Ukraine, Romania).
export const NextToYellowFlag: Story = { loaders: [loadScene({ target: 'md', flags: ['ua', 'ro'] })] };

// A miss: the tapped country marked wrong, the answer lit up.
export const Missed: Story = { loaders: [loadScene({ target: 'np', flags: ['in'], wrong: ['cn'] })] };

// Learn's practice step, "Which flag is this country's?": the target is lit up on the board
// and the card asks for its flag.
export const LearnPractice: Story = {
  loaders: [loadScene({ target: 'np', flags: ['in', 'cn'] })],
  render: ({ onPick }, { loaded }) => (
    <Screen globe>
      <GlobeBoard {...(loaded as BoardScene)} onPick={onPick} />
      <QuestionDock>
        <PickFlagCard
          choices={[{ code: 'bt', name: 'Bhutan' }, { code: 'np', name: 'Nepal' }, { code: 'lk', name: 'Sri Lanka' }]}
          onPick={fn()}
        />
      </QuestionDock>
    </Screen>
  ),
};
