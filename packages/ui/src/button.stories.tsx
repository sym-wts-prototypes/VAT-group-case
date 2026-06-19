import type { Meta, StoryObj } from '@storybook/react'
import { ArrowRight } from 'lucide-react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Button' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'brand'],
    },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
  },
}
export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {}
export const Brand: Story = { args: { variant: 'brand', children: 'Send for review' } }
export const Outline: Story = { args: { variant: 'outline' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Link: Story = { args: { variant: 'link', children: 'Learn more' } }

export const WithIcon: Story = {
  args: {
    children: (
      <>
        Continue <ArrowRight />
      </>
    ),
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(['default', 'brand', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const).map(
        (v) => (
          <Button key={v} variant={v}>
            {v}
          </Button>
        ),
      )}
    </div>
  ),
}
