import { useState, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import {
  Badge,
  Button,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type ButtonProps,
} from '@wts/ui'

/**
 * Component catalog ("storybook-like" page). Each entry lists variants with a
 * live preview + the code that produced it. Add a component = add an entry here.
 */
export interface CatalogVariant {
  label: string
  /** Source snippet shown under the preview (copyable). */
  code: string
  render: () => ReactNode
}

export interface CatalogEntry {
  id: string
  name: string
  description?: string
  /** Optional interactive playground rendered above the variant grid. */
  Playground?: () => ReactNode
  variants: CatalogVariant[]
}

function ButtonPlayground() {
  const [variant, setVariant] = useState<ButtonProps['variant']>('default')
  const [size, setSize] = useState<ButtonProps['size']>('default')
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-xs font-medium">
        Variant
        <Select value={variant ?? 'default'} onValueChange={(v) => setVariant(v as ButtonProps['variant'])}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['default', 'brand', 'secondary', 'outline', 'ghost', 'link', 'destructive'].map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Size
        <Select value={size ?? 'default'} onValueChange={(v) => setSize(v as ButtonProps['size'])}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['default', 'sm', 'lg', 'icon'].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <div className="flex h-16 items-center rounded-lg border border-dashed px-6">
        <Button variant={variant} size={size}>
          {size === 'icon' ? <ArrowRight /> : 'Button'}
        </Button>
      </div>
    </div>
  )
}

export const CATALOG: CatalogEntry[] = [
  {
    id: 'button',
    name: 'Button',
    description: 'Primary action control. Variants map to WTS tokens (brand = red CTA).',
    Playground: ButtonPlayground,
    variants: [
      {
        label: 'Variants',
        code: `<Button>default</Button>
<Button variant="brand">brand</Button>
<Button variant="outline">outline</Button>
<Button variant="ghost">ghost</Button>
<Button variant="link">link</Button>`,
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
      },
      {
        label: 'With icon',
        code: `<Button>Continue <ArrowRight /></Button>`,
        render: () => (
          <Button>
            Continue <ArrowRight />
          </Button>
        ),
      },
      {
        label: 'Sizes',
        code: `<Button size="sm">sm</Button>
<Button size="default">default</Button>
<Button size="lg">lg</Button>`,
        render: () => (
          <div className="flex items-center gap-3">
            <Button size="sm">sm</Button>
            <Button size="default">default</Button>
            <Button size="lg">lg</Button>
          </div>
        ),
      },
    ],
  },
  {
    id: 'badge',
    name: 'Badge',
    description: 'Soft status pill. Tones map to the badge-* CSS variables.',
    variants: [
      {
        label: 'Tones',
        code: `<Badge tone="gray">gray</Badge>
<Badge tone="blue">blue</Badge>
<Badge tone="green">green</Badge>
<Badge tone="amber">amber</Badge>
<Badge tone="red">red</Badge>`,
        render: () => (
          <div className="flex flex-wrap items-center gap-2">
            {(['gray', 'blue', 'green', 'amber', 'red', 'outline'] as const).map((tone) => (
              <Badge key={tone} tone={tone} className="px-2.5 py-1">
                {tone}
              </Badge>
            ))}
          </div>
        ),
      },
    ],
  },
  {
    id: 'separator',
    name: 'Separator',
    description: 'Thin divider, horizontal or vertical.',
    variants: [
      {
        label: 'Horizontal',
        code: `<Separator />`,
        render: () => (
          <div className="w-64 text-sm">
            <p className="pb-3">Section one</p>
            <Separator />
            <p className="pt-3">Section two</p>
          </div>
        ),
      },
      {
        label: 'Vertical',
        code: `<Separator orientation="vertical" />`,
        render: () => (
          <div className="flex h-8 items-center gap-3 text-sm">
            <span>Creator</span>
            <Separator orientation="vertical" />
            <span>Reviewer</span>
            <Separator orientation="vertical" />
            <span>Partner</span>
          </div>
        ),
      },
    ],
  },
  {
    id: 'select',
    name: 'Select',
    description: 'Radix-based dropdown select.',
    variants: [
      {
        label: 'Basic',
        code: `<Select>
  <SelectTrigger className="w-56"><SelectValue placeholder="Select a role" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="creator">Creator</SelectItem>
    <SelectItem value="reviewer">Reviewer</SelectItem>
  </SelectContent>
</Select>`,
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
      },
    ],
  },
]
