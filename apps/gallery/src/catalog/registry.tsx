import { useState, type ReactNode } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import {
  Badge,
  Alert,
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
  CheckboxField,
  SwitchField,
  OptionPills,
  RadioPills,
  SegmentedTabs,
  FileDropzone,
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
    id: 'alert',
    name: 'Alert',
    description: 'Inline banner (info matches the project banner). info / success / warning / destructive.',
    variants: [
      {
        label: 'Variants',
        code: `<Alert variant="info">…</Alert>\n<Alert variant="success" title="Approved">…</Alert>`,
        render: () => (
          <div className="flex w-[28rem] flex-col gap-2">
            <Alert variant="info">
              Before sending for client approval, confirm each task is complete again.
            </Alert>
            <Alert variant="success" title="Package approved">
              The client approved the data package.
            </Alert>
            <Alert variant="warning">Some assessments are still outstanding.</Alert>
            <Alert variant="destructive" title="Submission failed">
              The protocol could not be confirmed.
            </Alert>
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
    description: 'Radix-based binary toggle. Use bare for simple cases, or CheckboxField for card layout with label + description.',
    variants: [
      {
        label: 'Bare + label',
        code: `<Checkbox id="t" />\n<Label htmlFor="t">Tasks done</Label>`,
        render: () => (
          <div className="flex items-center gap-2">
            <Checkbox id="t" defaultChecked />
            <Label htmlFor="t">Tasks done</Label>
          </div>
        ),
      },
      {
        label: 'CheckboxField (card)',
        code: `<CheckboxField\n  label="Tasks Done"\n  description="Marks all tasks complete."\n  defaultChecked\n/>`,
        render: () => (
          <div className="w-80">
            <CheckboxField
              label="Tasks Done"
              description="Marks all tasks complete and enables Send for review."
              defaultChecked
            />
          </div>
        ),
      },
      {
        label: 'CheckboxField (no description)',
        code: `<CheckboxField label="Approved" defaultChecked />`,
        render: () => (
          <div className="w-80">
            <CheckboxField label="Approved" defaultChecked />
          </div>
        ),
      },
    ],
  },
  {
    id: 'radio-group',
    name: 'Radio Group',
    description: 'Radix-based mutually exclusive options.',
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
    id: 'radio-pills',
    name: 'Radio Pills',
    description: 'Vertical native-radio group matching the project\'s PhaseRadios — label above, radio + text per option.',
    variants: [
      {
        label: 'Phase selection',
        code: `<RadioPills\n  label="Phase"\n  value="inReview"\n  options={[…]}\n  onChange={setPhase}\n/>`,
        render: () => (
          <RadioPills
            label="Phase"
            value="inReview"
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'inPreparation', label: 'In Preparation' },
              { value: 'inReview', label: 'In Review' },
              { value: 'clientApproval', label: 'Client Approval' },
              { value: 'submitted', label: 'Submitted', disabled: true },
            ]}
            onChange={() => {}}
          />
        ),
      },
    ],
  },
  {
    id: 'option-pills',
    name: 'Option Pills',
    description: 'Segmented pill radio — all options visible, filled primary when selected. Matches the project\'s OptionPills.',
    variants: [
      {
        label: 'Role selection',
        code: `<OptionPills\n  label="Role"\n  value="creator"\n  options={[…]}\n  onChange={setRole}\n/>`,
        render: () => (
          <OptionPills
            label="Role"
            value="creator"
            options={[
              { value: 'creator', label: 'Creator' },
              { value: 'reviewer', label: 'Reviewer' },
              { value: 'partner', label: 'Partner' },
              { value: 'client', label: 'Client' },
            ]}
            onChange={() => {}}
          />
        ),
      },
      {
        label: 'With disabled',
        code: `<OptionPills label="Page" value="case" options={[…]} onChange={…} />`,
        render: () => (
          <OptionPills
            label="Page"
            value="case"
            options={[
              { value: 'caseWrapper', label: 'Case Wrapper' },
              { value: 'case', label: 'Case' },
              { value: 'requirementList', label: 'Requirement List', disabled: true },
              { value: 'requirementBucket', label: 'Requirement Bucket', disabled: true },
            ]}
            onChange={() => {}}
          />
        ),
      },
    ],
  },
  {
    id: 'switch',
    name: 'Switch',
    description: 'On/off toggle. Use bare for simple cases, or SwitchField for card layout with label + description.',
    variants: [
      {
        label: 'Bare + label',
        code: `<Switch id="s" />\n<Label htmlFor="s">Notifications</Label>`,
        render: () => (
          <div className="flex items-center gap-2">
            <Switch id="s" defaultChecked />
            <Label htmlFor="s">Notifications</Label>
          </div>
        ),
      },
      {
        label: 'SwitchField (card)',
        code: `<SwitchField\n  label="Email notifications"\n  description="Receive alerts when tasks change."\n  defaultChecked\n/>`,
        render: () => (
          <div className="w-80">
            <SwitchField
              label="Email notifications"
              description="Receive alerts when tasks change."
              defaultChecked
            />
          </div>
        ),
      },
      {
        label: 'SwitchField (label left)',
        code: `<SwitchField label="Dark mode" labelPosition="left" />`,
        render: () => (
          <div className="w-80">
            <SwitchField label="Dark mode" labelPosition="left" />
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
    id: 'segmented-tabs',
    name: 'Segmented Tabs',
    description: 'Segmented control matching the project\'s ProcessTabs — muted background, shadow on selected. Optional count badge per tab.',
    variants: [
      {
        label: 'Process switch',
        code: `<SegmentedTabs\n  label="Process"\n  value="cit"\n  options={[\n    { value: 'cit', label: 'CIT' },\n    { value: 'hr', label: 'HR' },\n    { value: 'vat', label: 'VAT' },\n  ]}\n  onChange={setProcess}\n/>`,
        render: () => (
          <SegmentedTabs
            label="Process"
            value="cit"
            options={[
              { value: 'cit', label: 'CIT' },
              { value: 'hr', label: 'HR' },
              { value: 'vat', label: 'VAT' },
            ]}
            onChange={() => {}}
          />
        ),
      },
      {
        label: 'With count badges',
        code: `<SegmentedTabs\n  label="Status"\n  value="open"\n  options={[\n    { value: 'open', label: 'Open', count: 12 },\n    { value: 'closed', label: 'Closed', count: 5 },\n  ]}\n  onChange={…}\n/>`,
        render: () => (
          <SegmentedTabs
            label="Status"
            value="open"
            options={[
              { value: 'open', label: 'Open', count: 12 },
              { value: 'closed', label: 'Closed', count: 5 },
              { value: 'draft', label: 'Draft', count: 0 },
            ]}
            onChange={() => {}}
          />
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
    description: 'Simple file upload area, drag-and-drop or click.',
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
  {
    id: 'file-dropzone',
    name: 'File Dropzone',
    description: 'Rich single-file upload with validation, progress bar, error state, and optional template download.',
    variants: [
      {
        label: 'Default',
        code: `<FileDropzone\n  id="upload"\n  label="Upload document"\n  onFileChange={(name) => console.log(name)}\n  accept=".pdf,.docx"\n/>`,
        render: () => (
          <div className="w-96">
            <FileDropzone
              id="demo-upload"
              label="Upload document"
              onFileChange={() => {}}
              accept=".pdf,.docx"
            />
          </div>
        ),
      },
      {
        label: 'With template download',
        code: `<FileDropzone\n  id="upload"\n  label="Tax return"\n  templateLabel="Download template"\n  onTemplateDownload={() => {}}\n  onFileChange={…}\n/>`,
        render: () => (
          <div className="w-96">
            <FileDropzone
              id="demo-template"
              label="Tax return"
              templateLabel="Download template"
              onTemplateDownload={() => {}}
              onFileChange={() => {}}
            />
          </div>
        ),
      },
    ],
  },

  // ── Foundations ──

  {
    id: 'colors',
    name: 'Colors',
    description: 'Semantic color tokens from the WTS-ShadCn DS. Edit --variable values in tokens.css to rebrand.',
    variants: [
      {
        label: 'Semantic palette',
        code: `/* tokens.css */\n--primary: 240 6% 10%;\n--brand: 358 75% 52%;\n--destructive: 356 70% 52%;`,
        render: () => {
          const swatches: [string, string][] = [
            ['background', 'hsl(var(--background))'],
            ['foreground', 'hsl(var(--foreground))'],
            ['primary', 'hsl(var(--primary))'],
            ['primary-fg', 'hsl(var(--primary-foreground))'],
            ['secondary', 'hsl(var(--secondary))'],
            ['muted', 'hsl(var(--muted))'],
            ['muted-fg', 'hsl(var(--muted-foreground))'],
            ['accent', 'hsl(var(--accent))'],
            ['brand', 'hsl(var(--brand))'],
            ['destructive', 'hsl(var(--destructive))'],
            ['border', 'hsl(var(--border))'],
            ['ring', 'hsl(var(--ring))'],
          ]
          return (
            <div className="grid grid-cols-4 gap-3">
              {swatches.map(([name, color]) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <div
                    className="h-10 w-10 rounded-md border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          )
        },
      },
      {
        label: 'Badge tones',
        code: `--badge-blue-bg / --badge-green-bg / --badge-amber-bg / --badge-red-bg`,
        render: () => {
          const tones: [string, string, string][] = [
            ['gray', 'hsl(var(--badge-gray-bg))', 'hsl(var(--badge-gray-fg))'],
            ['blue', 'hsl(var(--badge-blue-bg))', 'hsl(var(--badge-blue-fg))'],
            ['green', 'hsl(var(--badge-green-bg))', 'hsl(var(--badge-green-fg))'],
            ['amber', 'hsl(var(--badge-amber-bg))', 'hsl(var(--badge-amber-fg))'],
            ['red', 'hsl(var(--badge-red-bg))', 'hsl(var(--badge-red-fg))'],
          ]
          return (
            <div className="flex gap-3">
              {tones.map(([name, bg, fg]) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <div
                    className="flex h-10 w-16 items-center justify-center rounded-md text-xs font-medium"
                    style={{ backgroundColor: bg, color: fg }}
                  >
                    {name}
                  </div>
                </div>
              ))}
            </div>
          )
        },
      },
    ],
  },
  {
    id: 'typography',
    name: 'Typography',
    description: 'Type scale from the WTS-ShadCn Figma DS. Font: IBM Plex Sans. Adjust --text-* and --leading-* in tokens.css.',
    variants: [
      {
        label: 'Heading scale',
        code: `/* tokens.css */\n--text-4xl: 3rem;    /* H1 48px Bold */\n--text-3xl: 1.875rem; /* H2 30px SemiBold */\n--text-2xl: 1.5rem;  /* H3 24px SemiBold */\n--text-xl: 1.25rem;  /* H4 20px SemiBold */`,
        render: () => (
          <div className="flex flex-col gap-3">
            <p className="text-4xl font-bold tracking-tight">H1 — 48px Bold</p>
            <p className="border-b pb-2 text-3xl font-semibold tracking-tight">H2 — 30px SemiBold</p>
            <p className="text-2xl font-semibold tracking-tight">H3 — 24px SemiBold</p>
            <p className="text-xl font-semibold tracking-tight">H4 — 20px SemiBold</p>
          </div>
        ),
      },
      {
        label: 'Body scale',
        code: `/* tokens.css */\n--text-lg: 1.125rem; /* Large 18px SemiBold */\n--text-base: 1rem;   /* P 16px Regular */\n--text-sm: 0.875rem; /* Small 14px Medium */\n--text-xs: 0.75rem;  /* XS 12px */`,
        render: () => (
          <div className="flex flex-col gap-3">
            <p className="text-xl text-muted-foreground">Lead — 20px Regular (muted)</p>
            <p className="text-lg font-semibold">Large — 18px SemiBold</p>
            <p className="text-base leading-7">Paragraph — 16px Regular, 28px line height. The quick brown fox jumps over the lazy dog to demonstrate paragraph text at the base size.</p>
            <p className="text-sm font-medium">Small — 14px Medium</p>
            <p className="text-xs text-muted-foreground">XS — 12px (captions, metadata)</p>
          </div>
        ),
      },
      {
        label: 'Font families',
        code: `--font-sans: 'IBM Plex Sans', …;\n--font-display: 'Cera Pro', …;`,
        render: () => (
          <div className="flex flex-col gap-3">
            <p className="font-sans text-lg">IBM Plex Sans — body text (font-sans)</p>
            <p className="font-display text-lg">Cera Pro — display headings (font-display)</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'shadows',
    name: 'Shadows',
    description: 'Elevation scale matching the WTS-ShadCn DS effect styles. Edit --shadow-* in tokens.css.',
    variants: [
      {
        label: 'Elevation scale',
        code: `/* tokens.css */\n--shadow-sm: 0 1px 2px …;\n--shadow: 0 1px 3px …;\n--shadow-md: 0 4px 6px …;\n--shadow-lg: 0 10px 15px …;\n--shadow-xl: 0 20px 25px …;\n--shadow-2xl: 0 25px 50px …;`,
        render: () => {
          const levels: [string, string][] = [
            ['shadow-sm', 'sm'],
            ['shadow', 'base'],
            ['shadow-md', 'md'],
            ['shadow-lg', 'lg'],
            ['shadow-xl', 'xl'],
            ['shadow-2xl', '2xl'],
            ['shadow-inner', 'inner'],
          ]
          return (
            <div className="flex flex-wrap gap-6 py-4">
              {levels.map(([cls, label]) => (
                <div
                  key={cls}
                  className={`flex h-20 w-24 items-center justify-center rounded-lg bg-background text-xs font-medium ${cls}`}
                >
                  {label}
                </div>
              ))}
            </div>
          )
        },
      },
    ],
  },
  {
    id: 'radius',
    name: 'Border Radius',
    description: 'Radius scale derived from --radius base value. Change --radius in tokens.css and all sizes adjust.',
    variants: [
      {
        label: 'Radius scale',
        code: `/* tokens.css — change --radius to shift all levels */\n--radius: 0.5rem;\n--radius-sm: calc(var(--radius) - 4px);\n--radius-md: calc(var(--radius) - 2px);\n--radius-lg: var(--radius);\n--radius-xl: calc(var(--radius) + 4px);`,
        render: () => {
          const radii: [string, string][] = [
            ['rounded-none', 'none'],
            ['rounded-sm', 'sm'],
            ['rounded-md', 'md'],
            ['rounded-lg', 'lg'],
            ['rounded-xl', 'xl'],
            ['rounded-2xl', '2xl'],
            ['rounded-full', 'full'],
          ]
          return (
            <div className="flex flex-wrap gap-4">
              {radii.map(([cls, label]) => (
                <div
                  key={cls}
                  className={`flex h-16 w-16 items-center justify-center border bg-muted text-xs font-medium ${cls}`}
                >
                  {label}
                </div>
              ))}
            </div>
          )
        },
      },
    ],
  },
]
