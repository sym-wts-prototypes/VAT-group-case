import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from './separator'

const meta: Meta<typeof Separator> = {
  title: 'Primitives/Separator',
  component: Separator,
}
export default meta
type Story = StoryObj<typeof Separator>

export const Horizontal: Story = {
  render: () => (
    <div className="w-64 text-sm">
      <p className="pb-3">Section one</p>
      <Separator />
      <p className="pt-3">Section two</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3 text-sm">
      <span>Creator</span>
      <Separator orientation="vertical" />
      <span>Reviewer</span>
      <Separator orientation="vertical" />
      <span>Partner</span>
    </div>
  ),
}
