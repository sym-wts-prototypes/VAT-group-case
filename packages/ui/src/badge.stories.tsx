import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  args: { children: 'Badge' },
  argTypes: {
    tone: {
      control: 'select',
      options: ['gray', 'blue', 'green', 'amber', 'red', 'outline'],
    },
  },
}
export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {}

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {(['gray', 'blue', 'green', 'amber', 'red', 'outline'] as const).map((tone) => (
        <Badge key={tone} tone={tone} className="px-2.5 py-1">
          {tone}
        </Badge>
      ))}
    </div>
  ),
}
