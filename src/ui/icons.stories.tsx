import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import * as icons from './icons';

const meta = {
  title: 'UI/Icons',
  component: icons.Icon,
} satisfies Meta<typeof icons.Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

const all = Object.entries(icons).filter(([name]) => name !== 'Icon') as [string, ComponentType<icons.IconProps>][];

export const All: Story = {
  args: { children: null },
  render: () => (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 p-0">
      {all.map(([name, Glyph]) => (
        <li key={name} className="flex items-center gap-3 rounded-md border-3 border-outline bg-surface px-3 py-2 text-caption text-fg">
          <Glyph />
          {name.replace(/Icon$/, '')}
        </li>
      ))}
      <li className="flex items-center gap-3 rounded-md border-3 border-outline bg-surface px-3 py-2 text-caption text-fg">
        <icons.HeartIcon lost />
        Heart (lost)
      </li>
    </ul>
  ),
};

// Size and stroke can change; the grid and caps stay.
export const Sizes: Story = {
  args: { children: null },
  render: () => (
    <div className="flex items-end gap-4 text-fg">
      <icons.StarIcon size={16} />
      <icons.CheckIcon size={20} />
      <icons.CheckIcon size={22} strokeWidth="3" />
      <icons.StarIcon />
      <icons.GlobeIcon size={40} />
      <icons.StarIcon size={60} />
    </div>
  ),
};
