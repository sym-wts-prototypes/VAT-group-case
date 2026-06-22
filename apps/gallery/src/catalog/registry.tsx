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
  Input,
  Textarea,
  Label,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
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
  {
    id: 'input',
    name: 'Input',
    description: 'Single-line text field.',
    variants: [
      {
        label: 'Default',
        code: `<Input placeholder="Email" />`,
        render: () => <Input placeholder="Email" className="w-64" />,
      },
      {
        label: 'Disabled',
        code: `<Input disabled placeholder="Disabled" />`,
        render: () => <Input disabled placeholder="Disabled" className="w-64" />,
      },
      {
        label: 'With label',
        code: `<Label htmlFor="co">Company</Label>\n<Input id="co" placeholder="Uniper Technologies GmbH" />`,
        render: () => (
          <div className="grid w-64 gap-1.5">
            <Label htmlFor="co">Company</Label>
            <Input id="co" placeholder="Uniper Technologies GmbH" />
          </div>
        ),
      },
    ],
  },
  {
    id: 'textarea',
    name: 'Textarea',
    description: 'Multi-line text field.',
    variants: [
      {
        label: 'Default',
        code: `<Textarea placeholder="Add a comment…" />`,
        render: () => <Textarea placeholder="Add a comment…" className="w-72" />,
      },
    ],
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    description: 'Binary toggle with a checked indicator.',
    variants: [
      {
        label: 'With label',
        code: `<Checkbox id="t" />\n<Label htmlFor="t">Tasks done</Label>`,
        render: () => (
          <div className="flex items-center gap-2">
            <Checkbox id="t" defaultChecked />
            <Label htmlFor="t">Tasks done</Label>
          </div>
        ),
      },
    ],
  },
  {
    id: 'radio-group',
    name: 'Radio Group',
    description: 'Mutually exclusive options.',
    variants: [
      {
        label: 'Default',
        code: `<RadioGroup defaultValue="approve">\n  <RadioGroupItem value="approve" /> Approve\n  <RadioGroupItem value="object" /> Object\n</RadioGroup>`,
        render: () => (
          <RadioGroup defaultValue="approve">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="approve" id="r1" />
              <Label htmlFor="r1">Approve</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="object" id="r2" />
              <Label htmlFor="r2">Object</Label>
            </div>
          </RadioGroup>
        ),
      },
    ],
  },
  {
    id: 'switch',
    name: 'Switch',
    description: 'On/off toggle.',
    variants: [
      {
        label: 'With label',
        code: `<Switch id="s" />\n<Label htmlFor="s">Notifications</Label>`,
        render: () => (
          <div className="flex items-center gap-2">
            <Switch id="s" defaultChecked />
            <Label htmlFor="s">Notifications</Label>
          </div>
        ),
      },
    ],
  },
  {
    id: 'tabs',
    name: 'Tabs',
    description: 'Switch between related views.',
    variants: [
      {
        label: 'Default',
        code: `<Tabs defaultValue="cit">\n  <TabsList>\n    <TabsTrigger value="cit">CIT</TabsTrigger>\n    <TabsTrigger value="hr">HR</TabsTrigger>\n  </TabsList>\n</Tabs>`,
        render: () => (
          <Tabs defaultValue="cit" className="w-72">
            <TabsList>
              <TabsTrigger value="cit">CIT</TabsTrigger>
              <TabsTrigger value="hr">HR</TabsTrigger>
              <TabsTrigger value="vat">VAT</TabsTrigger>
            </TabsList>
            <TabsContent value="cit" className="text-sm text-muted-foreground">
              Corporate income tax workflow.
            </TabsContent>
            <TabsContent value="hr" className="text-sm text-muted-foreground">
              Payroll tax workflow.
            </TabsContent>
            <TabsContent value="vat" className="text-sm text-muted-foreground">
              VAT workflow.
            </TabsContent>
          </Tabs>
        ),
      },
    ],
  },
]
