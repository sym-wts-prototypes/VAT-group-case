import { useState, type ReactNode } from 'react'
import { ArrowRight, Check } from 'lucide-react'
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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Avatar,
  AvatarImage,
  AvatarFallback,
  AspectRatio,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  Calendar,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  DataTable,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  SelectField,
  Stepper,
  Dropzone,
  type ButtonProps,
} from '@wts/ui'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

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
      {
        label: 'Loading',
        code: `<Button loading>Saving…</Button>`,
        render: () => (
          <div className="flex items-center gap-3">
            <Button loading>Saving…</Button>
            <Button variant="outline" loading>
              Uploading
            </Button>
          </div>
        ),
      },
    ],
  },
  {
    id: 'badge',
    name: 'Badge',
    description: 'Soft status pill. Tones map to the badge-* CSS variables. Supports sizes and a leading icon.',
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
              <Badge key={tone} tone={tone} size="md">
                {tone}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        label: 'Sizes',
        code: `<Badge size="sm">sm</Badge>\n<Badge size="md">md</Badge>`,
        render: () => (
          <div className="flex items-center gap-2">
            <Badge tone="blue" size="sm">
              <span className="px-1.5 py-[3px]">sm</span>
            </Badge>
            <Badge tone="blue" size="md">
              md
            </Badge>
          </div>
        ),
      },
      {
        label: 'With icon',
        code: `<Badge tone="green" size="md"><Check /> Approved</Badge>`,
        render: () => (
          <div className="flex items-center gap-2">
            <Badge tone="green" size="md">
              <Check /> Approved
            </Badge>
            <Badge tone="amber" size="md">
              <Check /> 3 files
            </Badge>
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
  {
    id: 'card',
    name: 'Card',
    description: 'Surface container with header, content and footer slots.',
    variants: [
      {
        label: 'Default',
        code: `<Card>\n  <CardHeader>\n    <CardTitle>CIT-2847</CardTitle>\n    <CardDescription>Uniper Technologies GmbH</CardDescription>\n  </CardHeader>\n  <CardContent>…</CardContent>\n</Card>`,
        render: () => (
          <Card className="w-72">
            <CardHeader>
              <CardTitle>CIT-2847</CardTitle>
              <CardDescription>Uniper Technologies GmbH</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Corporate income tax return, FY2026.
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm" variant="outline">
                View
              </Button>
              <Button size="sm">Open case</Button>
            </CardFooter>
          </Card>
        ),
      },
    ],
  },
  {
    id: 'avatar',
    name: 'Avatar',
    description: 'User image with text fallback.',
    variants: [
      {
        label: 'Image + fallback',
        code: `<Avatar>\n  <AvatarImage src="…" />\n  <AvatarFallback>EF</AvatarFallback>\n</Avatar>`,
        render: () => (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/80?img=5" alt="" />
              <AvatarFallback>EF</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>PK</AvatarFallback>
            </Avatar>
          </div>
        ),
      },
    ],
  },
  {
    id: 'table',
    name: 'Table',
    description: 'Rows and columns with header, body and footer.',
    variants: [
      {
        label: 'Default',
        code: `<Table>\n  <TableHeader>…</TableHeader>\n  <TableBody>…</TableBody>\n</Table>`,
        render: () => (
          <Table className="w-80">
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>CIT-2847</TableCell>
                <TableCell>Creator</TableCell>
                <TableCell>In Review</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>HR-0193</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell>Draft</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ),
      },
    ],
  },
  {
    id: 'dropdown-menu',
    name: 'Dropdown Menu',
    description: 'Menu triggered by a button.',
    variants: [
      {
        label: 'Default',
        code: `<DropdownMenu>\n  <DropdownMenuTrigger asChild><Button variant="outline">Open</Button></DropdownMenuTrigger>\n  <DropdownMenuContent>…</DropdownMenuContent>\n</DropdownMenu>`,
        render: () => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Case actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Send for review</DropdownMenuItem>
              <DropdownMenuItem>Add requirement</DropdownMenuItem>
              <DropdownMenuItem>Close case</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
  },
  {
    id: 'aspect-ratio',
    name: 'Aspect Ratio',
    description: 'Constrains content to a ratio.',
    variants: [
      {
        label: '16:9',
        code: `<AspectRatio ratio={16 / 9}>…</AspectRatio>`,
        render: () => (
          <div className="w-64">
            <AspectRatio ratio={16 / 9}>
              <div className="flex h-full w-full items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                16 : 9
              </div>
            </AspectRatio>
          </div>
        ),
      },
    ],
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Date picker calendar (react-day-picker).',
    variants: [
      {
        label: 'Single date',
        code: `<Calendar mode="single" selected={date} onSelect={setDate} />`,
        render: () => (
          <div className="inline-block rounded-md border">
            <Calendar mode="single" />
          </div>
        ),
      },
    ],
  },
  {
    id: 'drawer',
    name: 'Drawer',
    description: 'Bottom sheet / drawer (vaul).',
    variants: [
      {
        label: 'Default',
        code: `<Drawer>\n  <DrawerTrigger>Open</DrawerTrigger>\n  <DrawerContent>…</DrawerContent>\n</Drawer>`,
        render: () => (
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Open drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Close case CIT-2847?</DrawerTitle>
                <DrawerDescription>
                  All assessments are resolved. This will move the case to Summary.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <Button>Close case</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ),
      },
    ],
  },
  {
    id: 'data-table',
    name: 'Data Table',
    description: 'TanStack-table-backed table built on the Table primitives.',
    variants: [
      {
        label: 'Default',
        code: `<DataTable columns={columns} data={data} />`,
        render: () => {
          const columns: any[] = [
            { accessorKey: 'case', header: 'Case' },
            { accessorKey: 'role', header: 'Role' },
            { accessorKey: 'status', header: 'Status' },
          ]
          const data = [
            { case: 'CIT-2847', role: 'Creator', status: 'In Review' },
            { case: 'HR-0193', role: 'Reviewer', status: 'Draft' },
            { case: 'VAT-5612', role: 'Partner', status: 'Submitted' },
          ]
          return (
            <div className="w-96">
              <DataTable columns={columns} data={data} />
            </div>
          )
        },
      },
    ],
  },
  {
    id: 'chart',
    name: 'Chart',
    description: 'Recharts wrapper themed via a ChartConfig.',
    variants: [
      {
        label: 'Bar',
        code: `<ChartContainer config={config}>\n  <BarChart data={data}>\n    <Bar dataKey="value" fill="var(--color-value)" />\n  </BarChart>\n</ChartContainer>`,
        render: () => {
          const config = {
            value: { label: 'Cases', color: 'hsl(var(--brand))' },
          } satisfies ChartConfig
          const data = [
            { process: 'CIT', value: 48 },
            { process: 'HR', value: 54 },
            { process: 'VAT', value: 35 },
          ]
          return (
            <ChartContainer config={config} className="h-48 w-96">
              <BarChart data={data}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="process" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={4} />
              </BarChart>
            </ChartContainer>
          )
        },
      },
    ],
  },
  {
    id: 'select-field',
    name: 'Select Field',
    description: 'Select with label, info tooltip, description and error state (matches the DS Select).',
    variants: [
      {
        label: 'With label + description',
        code: `<SelectField label="Reviewer" description="Who signs off." placeholder="Pick…">\n  <SelectItem value="pk">Patricia Klein</SelectItem>\n</SelectField>`,
        render: () => (
          <SelectField
            label="Reviewer"
            info="The person who approves the case."
            description="Who signs off on this case."
            placeholder="Select a reviewer"
            className="w-64"
          >
            <SelectItem value="pk">Patricia Klein</SelectItem>
            <SelectItem value="aw">Amara Weber</SelectItem>
          </SelectField>
        ),
      },
      {
        label: 'Error',
        code: `<SelectField label="Reviewer" error="Required." placeholder="Pick…">…</SelectField>`,
        render: () => (
          <SelectField
            label="Reviewer"
            error="A reviewer is required."
            placeholder="Select a reviewer"
            className="w-64"
          >
            <SelectItem value="pk">Patricia Klein</SelectItem>
          </SelectField>
        ),
      },
    ],
  },
  {
    id: 'stepper',
    name: 'Stepper',
    description: 'Horizontal case-phase stepper (matches the project) — connector line above each step; finished/in-progress/upcoming states.',
    variants: [
      {
        label: 'Case phases',
        code: `<Stepper steps={[\n  { label: 'Draft', state: 'finished' },\n  { label: 'In Preparation', state: 'finished' },\n  { label: 'In Review', state: 'inProgress' },\n  { label: 'Approval', state: 'notStarted' },\n]} />`,
        render: () => (
          <div className="w-[460px]">
            <Stepper
              steps={[
                { label: 'Draft', state: 'finished' },
                { label: 'In Preparation', state: 'finished' },
                { label: 'In Review', state: 'inProgress' },
                { label: 'Approval', state: 'notStarted' },
                { label: 'Submitted', state: 'notStarted' },
              ]}
            />
          </div>
        ),
      },
    ],
  },
  {
    id: 'dropzone',
    name: 'Dropzone',
    description: 'File upload area, drag-and-drop or click (WTS custom).',
    variants: [
      {
        label: 'Default',
        code: `<Dropzone onFiles={(files) => upload(files)} accept=".pdf,.png" multiple />`,
        render: () => (
          <div className="w-80">
            <Dropzone hint="PDF, PNG or JPG up to 10MB" />
          </div>
        ),
      },
    ],
  },
]
