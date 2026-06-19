import type { Meta, StoryObj } from '@storybook/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
}
export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="creator">Creator</SelectItem>
        <SelectItem value="reviewer">Reviewer</SelectItem>
        <SelectItem value="partner">Partner</SelectItem>
        <SelectItem value="client">Client</SelectItem>
      </SelectContent>
    </Select>
  ),
}
