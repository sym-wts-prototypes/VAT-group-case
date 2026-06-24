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

/* ── Data model ── */

export interface CatalogProp {
  name: string
  type: string
  default?: string
}

export interface CatalogExample {
  title: string
  description?: string
  code: string
  render: () => ReactNode
}

export type CatalogSource = 'shadcn' | 'shadcn-customized' | 'wts-custom' | 'foundation'

export interface CatalogEntry {
  id: string
  name: string
  description: string
  source: CatalogSource
  /** CLI command for shadcn components */
  installCommand?: string
  /** Import statement */
  importPath?: string
  /** Primary demo — shown at the top */
  demo?: { code: string; render: () => ReactNode }
  /** Sections with heading + preview + code */
  examples: CatalogExample[]
  /** Props table */
  props?: CatalogProp[]
  /** Interactive playground */
  Playground?: () => ReactNode
}

/* ── Playgrounds ── */

function ButtonPlayground() {
  const [variant, setVariant] = useState<ButtonProps['variant']>('default')
  const [size, setSize] = useState<ButtonProps['size']>('default')
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-xs font-medium">
        Variant
        <Select value={variant ?? 'default'} onValueChange={(v) => setVariant(v as ButtonProps['variant'])}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['default', 'brand', 'secondary', 'outline', 'ghost', 'link', 'destructive'].map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Size
        <Select value={size ?? 'default'} onValueChange={(v) => setSize(v as ButtonProps['size'])}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['default', 'sm', 'lg', 'icon'].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
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

/* ── Catalog ── */

export const CATALOG: CatalogEntry[] = [
  // ────────────────── Components ──────────────────
  {
    id: 'button',
    name: 'Button',
    description: 'Displays a button or a component that looks like a button.',
    source: 'shadcn-customized',
    installCommand: 'pnpm dlx shadcn@latest add button --cwd packages/ui --path src',
    importPath: `import { Button } from '@wts/ui'`,
    Playground: ButtonPlayground,
    demo: {
      code: `<Button variant="brand">Continue</Button>`,
      render: () => <Button variant="brand">Continue</Button>,
    },
    examples: [
      {
        title: 'Default',
        code: `<Button>Button</Button>`,
        render: () => <Button>Button</Button>,
      },
      {
        title: 'Brand',
        description: 'The primary CTA variant using the WTS brand color.',
        code: `<Button variant="brand">Brand</Button>`,
        render: () => <Button variant="brand">Brand</Button>,
      },
      {
        title: 'Secondary',
        code: `<Button variant="secondary">Secondary</Button>`,
        render: () => <Button variant="secondary">Secondary</Button>,
      },
      {
        title: 'Outline',
        code: `<Button variant="outline">Outline</Button>`,
        render: () => <Button variant="outline">Outline</Button>,
      },
      {
        title: 'Ghost',
        code: `<Button variant="ghost">Ghost</Button>`,
        render: () => <Button variant="ghost">Ghost</Button>,
      },
      {
        title: 'Destructive',
        code: `<Button variant="destructive">Destructive</Button>`,
        render: () => <Button variant="destructive">Destructive</Button>,
      },
      {
        title: 'Link',
        code: `<Button variant="link">Link</Button>`,
        render: () => <Button variant="link">Link</Button>,
      },
      {
        title: 'Icon',
        code: `<Button variant="outline" size="icon"><ArrowRight /></Button>`,
        render: () => (
          <Button variant="outline" size="icon"><ArrowRight /></Button>
        ),
      },
      {
        title: 'With Icon',
        code: `<Button>Continue <ArrowRight /></Button>`,
        render: () => <Button>Continue <ArrowRight /></Button>,
      },
      {
        title: 'Size',
        description: 'Use the `size` prop to change the size of the button.',
        code: `<Button size="sm">Small</Button>\n<Button size="default">Default</Button>\n<Button size="lg">Large</Button>`,
        render: () => (
          <div className="flex items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        ),
      },
      {
        title: 'Loading',
        description: 'Use the `loading` prop to show a spinner and disable the button.',
        code: `<Button loading>Saving…</Button>`,
        render: () => (
          <div className="flex items-center gap-3">
            <Button loading>Saving…</Button>
            <Button variant="outline" loading>Uploading</Button>
          </div>
        ),
      },
    ],
    props: [
      { name: 'variant', type: '"default" | "brand" | "secondary" | "outline" | "ghost" | "link" | "destructive"', default: '"default"' },
      { name: 'size', type: '"default" | "sm" | "lg" | "icon"', default: '"default"' },
      { name: 'loading', type: 'boolean', default: 'false' },
      { name: 'asChild', type: 'boolean', default: 'false' },
    ],
  },
  {
    id: 'badge',
    name: 'Badge',
    description: 'Displays a badge or a component that looks like a badge. Supports semantic color tones.',
    source: 'shadcn-customized',
    installCommand: 'pnpm dlx shadcn@latest add badge --cwd packages/ui --path src',
    importPath: `import { Badge } from '@wts/ui'`,
    demo: {
      code: `<Badge tone="blue" size="md">In Review</Badge>`,
      render: () => <Badge tone="blue" size="md">In Review</Badge>,
    },
    examples: [
      {
        title: 'Tones',
        description: 'Semantic color tones using the `badge-*` CSS variables.',
        code: `<Badge tone="gray">gray</Badge>\n<Badge tone="blue">blue</Badge>\n<Badge tone="green">green</Badge>\n<Badge tone="amber">amber</Badge>\n<Badge tone="red">red</Badge>`,
        render: () => (
          <div className="flex flex-wrap items-center gap-2">
            {(['gray', 'blue', 'green', 'amber', 'red', 'outline'] as const).map((tone) => (
              <Badge key={tone} tone={tone} size="md">{tone}</Badge>
            ))}
          </div>
        ),
      },
      {
        title: 'Sizes',
        code: `<Badge size="sm">Small</Badge>\n<Badge size="md">Medium</Badge>`,
        render: () => (
          <div className="flex items-center gap-2">
            <Badge tone="blue" size="sm">Small</Badge>
            <Badge tone="blue" size="md">Medium</Badge>
          </div>
        ),
      },
      {
        title: 'With Icon',
        code: `<Badge tone="green" size="md"><Check /> Approved</Badge>`,
        render: () => (
          <Badge tone="green" size="md"><Check /> Approved</Badge>
        ),
      },
    ],
    props: [
      { name: 'tone', type: '"gray" | "blue" | "green" | "amber" | "red" | "outline"', default: '"gray"' },
      { name: 'size', type: '"sm" | "md"', default: '"sm"' },
    ],
  },
  {
    id: 'alert',
    name: 'Alert',
    description: 'Displays a callout for important information. Supports info, success, warning, and destructive variants.',
    source: 'shadcn-customized',
    importPath: `import { Alert } from '@wts/ui'`,
    demo: {
      code: `<Alert variant="info">Before sending for client approval, confirm each task.</Alert>`,
      render: () => <Alert variant="info">Before sending for client approval, confirm each task is complete again.</Alert>,
    },
    examples: [
      {
        title: 'Info',
        code: `<Alert variant="info">Informational message.</Alert>`,
        render: () => <Alert variant="info">Before sending for client approval, confirm each task is complete again.</Alert>,
      },
      {
        title: 'Success',
        code: `<Alert variant="success" title="Approved">The client approved the data package.</Alert>`,
        render: () => <Alert variant="success" title="Package approved">The client approved the data package.</Alert>,
      },
      {
        title: 'Warning',
        code: `<Alert variant="warning">Some assessments are still outstanding.</Alert>`,
        render: () => <Alert variant="warning">Some assessments are still outstanding.</Alert>,
      },
      {
        title: 'Destructive',
        code: `<Alert variant="destructive" title="Failed">The protocol could not be confirmed.</Alert>`,
        render: () => <Alert variant="destructive" title="Submission failed">The protocol could not be confirmed.</Alert>,
      },
    ],
    props: [
      { name: 'variant', type: '"info" | "success" | "warning" | "destructive"', default: '"info"' },
      { name: 'title', type: 'ReactNode' },
      { name: 'icon', type: 'ComponentType | null' },
    ],
  },
  {
    id: 'input',
    name: 'Input',
    description: 'Displays a form input field.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add input --cwd packages/ui --path src',
    importPath: `import { Input } from '@wts/ui'`,
    demo: {
      code: `<Input placeholder="Email" />`,
      render: () => <Input placeholder="Email" className="max-w-sm" />,
    },
    examples: [
      {
        title: 'Default',
        code: `<Input placeholder="Email" />`,
        render: () => <Input placeholder="Email" className="max-w-sm" />,
      },
      {
        title: 'Disabled',
        code: `<Input disabled placeholder="Disabled" />`,
        render: () => <Input disabled placeholder="Disabled" className="max-w-sm" />,
      },
      {
        title: 'With Label',
        code: `<Label htmlFor="co">Company</Label>\n<Input id="co" placeholder="Uniper Technologies GmbH" />`,
        render: () => (
          <div className="grid max-w-sm gap-1.5">
            <Label htmlFor="co">Company</Label>
            <Input id="co" placeholder="Uniper Technologies GmbH" />
          </div>
        ),
      },
      {
        title: 'With Button',
        code: `<div className="flex gap-2">\n  <Input placeholder="Email" />\n  <Button>Subscribe</Button>\n</div>`,
        render: () => (
          <div className="flex max-w-sm gap-2">
            <Input placeholder="Email" />
            <Button>Subscribe</Button>
          </div>
        ),
      },
    ],
    props: [],
  },
  {
    id: 'textarea',
    name: 'Textarea',
    description: 'Displays a form textarea.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add textarea --cwd packages/ui --path src',
    importPath: `import { Textarea } from '@wts/ui'`,
    demo: {
      code: `<Textarea placeholder="Add a comment…" />`,
      render: () => <Textarea placeholder="Add a comment…" className="max-w-sm" />,
    },
    examples: [
      {
        title: 'Default',
        code: `<Textarea placeholder="Add a comment…" />`,
        render: () => <Textarea placeholder="Add a comment…" className="max-w-sm" />,
      },
      {
        title: 'With Label',
        code: `<Label htmlFor="msg">Message</Label>\n<Textarea id="msg" placeholder="Type your message here." />`,
        render: () => (
          <div className="grid max-w-sm gap-1.5">
            <Label htmlFor="msg">Message</Label>
            <Textarea id="msg" placeholder="Type your message here." />
          </div>
        ),
      },
    ],
    props: [],
  },
  {
    id: 'select',
    name: 'Select',
    description: 'Displays a list of options for the user to pick from — triggered by a button.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add select --cwd packages/ui --path src',
    importPath: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@wts/ui'`,
    demo: {
      code: `<Select>\n  <SelectTrigger className="w-56">\n    <SelectValue placeholder="Select a role" />\n  </SelectTrigger>\n  <SelectContent>\n    <SelectItem value="creator">Creator</SelectItem>\n    <SelectItem value="reviewer">Reviewer</SelectItem>\n  </SelectContent>\n</Select>`,
      render: () => (
        <Select>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="creator">Creator</SelectItem>
            <SelectItem value="reviewer">Reviewer</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    examples: [],
    props: [],
  },
  {
    id: 'select-field',
    name: 'Select Field',
    description: 'Select with label, info tooltip, description, and error state.',
    source: 'wts-custom',
    importPath: `import { SelectField } from '@wts/ui'`,
    demo: {
      code: `<SelectField label="Reviewer" description="Who signs off.">\n  <SelectItem value="pk">Patricia Klein</SelectItem>\n</SelectField>`,
      render: () => (
        <SelectField label="Reviewer" info="The person who approves the case." description="Who signs off on this case." placeholder="Select a reviewer" className="max-w-sm">
          <SelectItem value="pk">Patricia Klein</SelectItem>
          <SelectItem value="aw">Amara Weber</SelectItem>
        </SelectField>
      ),
    },
    examples: [
      {
        title: 'With Label & Description',
        code: `<SelectField\n  label="Reviewer"\n  info="The person who approves the case."\n  description="Who signs off on this case."\n  placeholder="Select a reviewer"\n>\n  <SelectItem value="pk">Patricia Klein</SelectItem>\n</SelectField>`,
        render: () => (
          <SelectField label="Reviewer" info="The person who approves the case." description="Who signs off on this case." placeholder="Select a reviewer" className="max-w-sm">
            <SelectItem value="pk">Patricia Klein</SelectItem>
            <SelectItem value="aw">Amara Weber</SelectItem>
          </SelectField>
        ),
      },
      {
        title: 'Error',
        code: `<SelectField label="Reviewer" error="A reviewer is required." placeholder="Select…">\n  <SelectItem value="pk">Patricia Klein</SelectItem>\n</SelectField>`,
        render: () => (
          <SelectField label="Reviewer" error="A reviewer is required." placeholder="Select a reviewer" className="max-w-sm">
            <SelectItem value="pk">Patricia Klein</SelectItem>
          </SelectField>
        ),
      },
    ],
    props: [
      { name: 'label', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'error', type: 'string | boolean' },
      { name: 'info', type: 'string' },
      { name: 'placeholder', type: 'string' },
      { name: 'value', type: 'string' },
      { name: 'onValueChange', type: '(value: string) => void' },
      { name: 'children', type: 'ReactNode', default: 'required' },
    ],
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    description: 'A control that allows the user to toggle between checked and not checked.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add checkbox --cwd packages/ui --path src',
    importPath: `import { Checkbox } from '@wts/ui'`,
    demo: {
      code: `<div className="flex items-center gap-2">\n  <Checkbox id="terms" />\n  <Label htmlFor="terms">Accept terms</Label>\n</div>`,
      render: () => (
        <div className="flex items-center gap-2">
          <Checkbox id="terms" defaultChecked />
          <Label htmlFor="terms">Accept terms and conditions</Label>
        </div>
      ),
    },
    examples: [
      {
        title: 'CheckboxField',
        description: 'Card-style layout with label and description. Use `CheckboxField` instead of bare `Checkbox` when you need a description.',
        code: `<CheckboxField\n  label="Tasks Done"\n  description="Marks all tasks complete."\n  defaultChecked\n/>`,
        render: () => (
          <div className="max-w-sm">
            <CheckboxField label="Tasks Done" description="Marks all tasks complete and enables Send for review." defaultChecked />
          </div>
        ),
      },
      {
        title: 'CheckboxField (no description)',
        code: `<CheckboxField label="Approved" defaultChecked />`,
        render: () => (
          <div className="max-w-sm">
            <CheckboxField label="Approved" defaultChecked />
          </div>
        ),
      },
    ],
    props: [
      { name: 'label', type: 'string', default: 'required (CheckboxField)' },
      { name: 'description', type: 'string' },
      { name: 'checked', type: 'boolean' },
      { name: 'defaultChecked', type: 'boolean' },
      { name: 'onCheckedChange', type: '(checked: boolean) => void' },
      { name: 'disabled', type: 'boolean' },
    ],
  },
  {
    id: 'radio-group',
    name: 'Radio Group',
    description: 'A set of checkable buttons — known as radio buttons — where no more than one can be checked at a time.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add radio-group --cwd packages/ui --path src',
    importPath: `import { RadioGroup, RadioGroupItem } from '@wts/ui'`,
    demo: {
      code: `<RadioGroup defaultValue="approve">\n  <div className="flex items-center gap-2">\n    <RadioGroupItem value="approve" id="r1" />\n    <Label htmlFor="r1">Approve</Label>\n  </div>\n  <div className="flex items-center gap-2">\n    <RadioGroupItem value="object" id="r2" />\n    <Label htmlFor="r2">Object</Label>\n  </div>\n</RadioGroup>`,
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
    examples: [],
    props: [],
  },
  {
    id: 'radio-pills',
    name: 'Radio Pills',
    description: 'Vertical native-radio group with a label above. Matches the project\'s PhaseRadios pattern.',
    source: 'wts-custom',
    importPath: `import { RadioPills } from '@wts/ui'`,
    demo: {
      code: `<RadioPills\n  label="Phase"\n  value="inReview"\n  options={[\n    { value: 'draft', label: 'Draft' },\n    { value: 'inReview', label: 'In Review' },\n  ]}\n  onChange={setPhase}\n/>`,
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
    examples: [],
    props: [
      { name: 'label', type: 'string', default: 'required' },
      { name: 'value', type: 'string', default: 'required' },
      { name: 'options', type: 'RadioPillItem[]', default: 'required' },
      { name: 'onChange', type: '(value: string) => void', default: 'required' },
    ],
  },
  {
    id: 'option-pills',
    name: 'Option Pills',
    description: 'Segmented pill radio — all options visible, filled primary when selected.',
    source: 'wts-custom',
    importPath: `import { OptionPills } from '@wts/ui'`,
    demo: {
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
    examples: [
      {
        title: 'With Disabled',
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
    props: [
      { name: 'label', type: 'string', default: 'required' },
      { name: 'value', type: 'string', default: 'required' },
      { name: 'options', type: 'OptionPillItem[]', default: 'required' },
      { name: 'onChange', type: '(value: string) => void', default: 'required' },
    ],
  },
  {
    id: 'switch',
    name: 'Switch',
    description: 'A control that allows the user to toggle between on and off.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add switch --cwd packages/ui --path src',
    importPath: `import { Switch } from '@wts/ui'`,
    demo: {
      code: `<div className="flex items-center gap-2">\n  <Switch id="notif" />\n  <Label htmlFor="notif">Notifications</Label>\n</div>`,
      render: () => (
        <div className="flex items-center gap-2">
          <Switch id="notif" defaultChecked />
          <Label htmlFor="notif">Notifications</Label>
        </div>
      ),
    },
    examples: [
      {
        title: 'SwitchField',
        description: 'Card-style layout with label, description and label position.',
        code: `<SwitchField\n  label="Email notifications"\n  description="Receive alerts when tasks change."\n  defaultChecked\n/>`,
        render: () => (
          <div className="max-w-sm">
            <SwitchField label="Email notifications" description="Receive alerts when tasks change." defaultChecked />
          </div>
        ),
      },
      {
        title: 'SwitchField (label left)',
        code: `<SwitchField label="Dark mode" labelPosition="left" />`,
        render: () => (
          <div className="max-w-sm">
            <SwitchField label="Dark mode" labelPosition="left" />
          </div>
        ),
      },
    ],
    props: [
      { name: 'label', type: 'string', default: 'required (SwitchField)' },
      { name: 'description', type: 'string' },
      { name: 'labelPosition', type: '"left" | "right"', default: '"right"' },
      { name: 'checked', type: 'boolean' },
      { name: 'onCheckedChange', type: '(checked: boolean) => void' },
    ],
  },
  {
    id: 'label',
    name: 'Label',
    description: 'Renders an accessible label associated with controls.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add label --cwd packages/ui --path src',
    importPath: `import { Label } from '@wts/ui'`,
    demo: {
      code: `<Label htmlFor="email">Email</Label>`,
      render: () => <Label htmlFor="email">Email</Label>,
    },
    examples: [],
    props: [],
  },
  {
    id: 'separator',
    name: 'Separator',
    description: 'Visually or semantically separates content.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add separator --cwd packages/ui --path src',
    importPath: `import { Separator } from '@wts/ui'`,
    demo: {
      code: `<Separator />`,
      render: () => (
        <div className="w-64 text-sm">
          <p className="pb-3">Section one</p>
          <Separator />
          <p className="pt-3">Section two</p>
        </div>
      ),
    },
    examples: [
      {
        title: 'Vertical',
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
    props: [],
  },
  {
    id: 'tabs',
    name: 'Tabs',
    description: 'A set of layered sections of content — known as tab panels — that are displayed one at a time.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add tabs --cwd packages/ui --path src',
    importPath: `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@wts/ui'`,
    demo: {
      code: `<Tabs defaultValue="cit">\n  <TabsList>\n    <TabsTrigger value="cit">CIT</TabsTrigger>\n    <TabsTrigger value="hr">HR</TabsTrigger>\n  </TabsList>\n  <TabsContent value="cit">…</TabsContent>\n</Tabs>`,
      render: () => (
        <Tabs defaultValue="cit" className="w-72">
          <TabsList>
            <TabsTrigger value="cit">CIT</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
            <TabsTrigger value="vat">VAT</TabsTrigger>
          </TabsList>
          <TabsContent value="cit" className="text-sm text-muted-foreground">Corporate income tax workflow.</TabsContent>
          <TabsContent value="hr" className="text-sm text-muted-foreground">Payroll tax workflow.</TabsContent>
          <TabsContent value="vat" className="text-sm text-muted-foreground">VAT workflow.</TabsContent>
        </Tabs>
      ),
    },
    examples: [],
    props: [],
  },
  {
    id: 'segmented-tabs',
    name: 'Segmented Tabs',
    description: 'Segmented control with muted background and shadow on selected. Optional count badge per tab.',
    source: 'wts-custom',
    importPath: `import { SegmentedTabs } from '@wts/ui'`,
    demo: {
      code: `<SegmentedTabs\n  label="Process"\n  value="cit"\n  options={[\n    { value: 'cit', label: 'CIT' },\n    { value: 'hr', label: 'HR' },\n  ]}\n  onChange={setProcess}\n/>`,
      render: () => (
        <SegmentedTabs
          label="Process" value="cit"
          options={[{ value: 'cit', label: 'CIT' }, { value: 'hr', label: 'HR' }, { value: 'vat', label: 'VAT' }]}
          onChange={() => {}}
        />
      ),
    },
    examples: [
      {
        title: 'With Count Badges',
        code: `<SegmentedTabs\n  label="Status"\n  value="open"\n  options={[\n    { value: 'open', label: 'Open', count: 12 },\n    { value: 'closed', label: 'Closed', count: 5 },\n  ]}\n  onChange={…}\n/>`,
        render: () => (
          <SegmentedTabs
            label="Status" value="open"
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
    props: [
      { name: 'label', type: 'string', default: 'required' },
      { name: 'value', type: 'string', default: 'required' },
      { name: 'options', type: 'SegmentedTabItem[]', default: 'required' },
      { name: 'onChange', type: '(value: string) => void', default: 'required' },
    ],
  },
  {
    id: 'card',
    name: 'Card',
    description: 'Displays a card with header, content, and footer.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add card --cwd packages/ui --path src',
    importPath: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@wts/ui'`,
    demo: {
      code: `<Card>\n  <CardHeader>\n    <CardTitle>CIT-2847</CardTitle>\n    <CardDescription>Uniper Technologies GmbH</CardDescription>\n  </CardHeader>\n  <CardContent>…</CardContent>\n  <CardFooter>…</CardFooter>\n</Card>`,
      render: () => (
        <Card className="w-72">
          <CardHeader>
            <CardTitle>CIT-2847</CardTitle>
            <CardDescription>Uniper Technologies GmbH</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Corporate income tax return, FY2026.</CardContent>
          <CardFooter className="gap-2">
            <Button size="sm" variant="outline">View</Button>
            <Button size="sm">Open case</Button>
          </CardFooter>
        </Card>
      ),
    },
    examples: [],
    props: [],
  },
  {
    id: 'avatar',
    name: 'Avatar',
    description: 'An image element with a fallback for representing the user.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add avatar --cwd packages/ui --path src',
    importPath: `import { Avatar, AvatarImage, AvatarFallback } from '@wts/ui'`,
    demo: {
      code: `<Avatar>\n  <AvatarImage src="…" />\n  <AvatarFallback>EF</AvatarFallback>\n</Avatar>`,
      render: () => (
        <div className="flex items-center gap-3">
          <Avatar><AvatarImage src="https://i.pravatar.cc/80?img=5" alt="" /><AvatarFallback>EF</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>PK</AvatarFallback></Avatar>
        </div>
      ),
    },
    examples: [],
    props: [],
  },
  {
    id: 'table',
    name: 'Table',
    description: 'A responsive table component.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add table --cwd packages/ui --path src',
    importPath: `import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@wts/ui'`,
    demo: {
      code: `<Table>\n  <TableHeader>\n    <TableRow>\n      <TableHead>Case</TableHead>\n      <TableHead>Status</TableHead>\n    </TableRow>\n  </TableHeader>\n  <TableBody>…</TableBody>\n</Table>`,
      render: () => (
        <Table className="w-80">
          <TableHeader>
            <TableRow><TableHead>Case</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>CIT-2847</TableCell><TableCell>Creator</TableCell><TableCell>In Review</TableCell></TableRow>
            <TableRow><TableCell>HR-0193</TableCell><TableCell>Reviewer</TableCell><TableCell>Draft</TableCell></TableRow>
          </TableBody>
        </Table>
      ),
    },
    examples: [],
    props: [],
  },
  {
    id: 'dropdown-menu',
    name: 'Dropdown Menu',
    description: 'Displays a menu to the user — such as a set of actions or functions — triggered by a button.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add dropdown-menu --cwd packages/ui --path src',
    importPath: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@wts/ui'`,
    demo: {
      code: `<DropdownMenu>\n  <DropdownMenuTrigger asChild>\n    <Button variant="outline">Open</Button>\n  </DropdownMenuTrigger>\n  <DropdownMenuContent>\n    <DropdownMenuItem>Action</DropdownMenuItem>\n  </DropdownMenuContent>\n</DropdownMenu>`,
      render: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline">Open menu</Button></DropdownMenuTrigger>
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
    examples: [],
    props: [],
  },
  {
    id: 'aspect-ratio',
    name: 'Aspect Ratio',
    description: 'Displays content within a desired ratio.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add aspect-ratio --cwd packages/ui --path src',
    importPath: `import { AspectRatio } from '@wts/ui'`,
    demo: {
      code: `<AspectRatio ratio={16 / 9}>…</AspectRatio>`,
      render: () => (
        <div className="w-64">
          <AspectRatio ratio={16 / 9}>
            <div className="flex h-full w-full items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">16 : 9</div>
          </AspectRatio>
        </div>
      ),
    },
    examples: [],
    props: [],
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'A date field component that allows users to enter and edit date.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add calendar --cwd packages/ui --path src',
    importPath: `import { Calendar } from '@wts/ui'`,
    demo: {
      code: `<Calendar mode="single" selected={date} onSelect={setDate} />`,
      render: () => (
        <div className="inline-block rounded-md border">
          <Calendar mode="single" />
        </div>
      ),
    },
    examples: [],
    props: [
      { name: 'mode', type: '"single" | "range" | "multiple"' },
      { name: 'selected', type: 'Date | DateRange' },
      { name: 'onSelect', type: '(date: Date) => void' },
      { name: 'showOutsideDays', type: 'boolean', default: 'true' },
    ],
  },
  {
    id: 'drawer',
    name: 'Drawer',
    description: 'A drawer component for React, built on top of Vaul.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add drawer --cwd packages/ui --path src',
    importPath: `import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@wts/ui'`,
    demo: {
      code: `<Drawer>\n  <DrawerTrigger>Open</DrawerTrigger>\n  <DrawerContent>\n    <DrawerHeader>\n      <DrawerTitle>Title</DrawerTitle>\n    </DrawerHeader>\n  </DrawerContent>\n</Drawer>`,
      render: () => (
        <Drawer>
          <DrawerTrigger asChild><Button variant="outline">Open drawer</Button></DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Close case CIT-2847?</DrawerTitle>
              <DrawerDescription>All assessments are resolved. This will move the case to Summary.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>Close case</Button>
              <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ),
    },
    examples: [],
    props: [],
  },
  {
    id: 'data-table',
    name: 'Data Table',
    description: 'Powerful table with sorting, filtering, and pagination built on TanStack Table.',
    source: 'wts-custom',
    importPath: `import { DataTable } from '@wts/ui'`,
    demo: {
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
        return <div className="w-96"><DataTable columns={columns} data={data} /></div>
      },
    },
    examples: [],
    props: [
      { name: 'columns', type: 'ColumnDef<TData>[]', default: 'required' },
      { name: 'data', type: 'TData[]', default: 'required' },
      { name: 'emptyMessage', type: 'string', default: '"No results."' },
    ],
  },
  {
    id: 'chart',
    name: 'Chart',
    description: 'Beautiful charts built using Recharts. Themed via a ChartConfig.',
    source: 'shadcn',
    importPath: `import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@wts/ui'`,
    demo: {
      code: `<ChartContainer config={config}>\n  <BarChart data={data}>\n    <Bar dataKey="value" fill="var(--color-value)" />\n  </BarChart>\n</ChartContainer>`,
      render: () => {
        const config = { value: { label: 'Cases', color: 'hsl(var(--brand))' } } satisfies ChartConfig
        const data = [{ process: 'CIT', value: 48 }, { process: 'HR', value: 54 }, { process: 'VAT', value: 35 }]
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
    examples: [],
    props: [],
  },
  {
    id: 'stepper',
    name: 'Stepper',
    description: 'Horizontal case-phase stepper with connector lines. Shows finished, in-progress, upcoming, and disabled states.',
    source: 'wts-custom',
    importPath: `import { Stepper } from '@wts/ui'`,
    demo: {
      code: `<Stepper steps={[\n  { label: 'Draft', state: 'finished' },\n  { label: 'In Review', state: 'inProgress' },\n  { label: 'Submitted', state: 'notStarted' },\n]} />`,
      render: () => (
        <div className="w-[460px]">
          <Stepper steps={[
            { label: 'Draft', state: 'finished' },
            { label: 'In Preparation', state: 'finished' },
            { label: 'In Review', state: 'inProgress' },
            { label: 'Approval', state: 'notStarted' },
            { label: 'Submitted', state: 'notStarted' },
          ]} />
        </div>
      ),
    },
    examples: [],
    props: [
      { name: 'steps', type: 'StepperStep[]', default: 'required' },
      { name: 'steps[].label', type: 'string', default: 'required' },
      { name: 'steps[].state', type: '"finished" | "inProgress" | "notStarted" | "disabled"', default: 'required' },
    ],
  },
  {
    id: 'dropzone',
    name: 'Dropzone',
    description: 'Simple file upload area, drag-and-drop or click.',
    source: 'wts-custom',
    importPath: `import { Dropzone } from '@wts/ui'`,
    demo: {
      code: `<Dropzone onFiles={(files) => upload(files)} hint="PDF, PNG or JPG up to 10MB" />`,
      render: () => <div className="max-w-sm"><Dropzone hint="PDF, PNG or JPG up to 10MB" /></div>,
    },
    examples: [],
    props: [
      { name: 'onFiles', type: '(files: File[]) => void' },
      { name: 'accept', type: 'string' },
      { name: 'multiple', type: 'boolean' },
      { name: 'hint', type: 'string', default: '"PDF, PNG or JPG up to 10MB"' },
      { name: 'disabled', type: 'boolean' },
    ],
  },
  {
    id: 'file-dropzone',
    name: 'File Dropzone',
    description: 'Rich single-file upload with validation, progress bar, error state, and optional template download.',
    source: 'wts-custom',
    importPath: `import { FileDropzone } from '@wts/ui'`,
    demo: {
      code: `<FileDropzone\n  id="upload"\n  label="Upload document"\n  onFileChange={(name) => console.log(name)}\n/>`,
      render: () => (
        <div className="max-w-md">
          <FileDropzone id="demo-upload" label="Upload document" onFileChange={() => {}} accept=".pdf,.docx" />
        </div>
      ),
    },
    examples: [
      {
        title: 'With Template Download',
        code: `<FileDropzone\n  id="upload"\n  label="Tax return"\n  templateLabel="Download template"\n  onTemplateDownload={() => {}}\n  onFileChange={…}\n/>`,
        render: () => (
          <div className="max-w-md">
            <FileDropzone id="demo-template" label="Tax return" templateLabel="Download template" onTemplateDownload={() => {}} onFileChange={() => {}} />
          </div>
        ),
      },
    ],
    props: [
      { name: 'id', type: 'string', default: 'required' },
      { name: 'label', type: 'string', default: 'required' },
      { name: 'onFileChange', type: '(name: string | null) => void', default: 'required' },
      { name: 'accept', type: 'string', default: '".pdf,.docx"' },
      { name: 'maxBytes', type: 'number', default: '314572800' },
      { name: 'templateLabel', type: 'string' },
      { name: 'onTemplateDownload', type: '() => void' },
    ],
  },

  // ────────────────── Foundations ──────────────────
  {
    id: 'colors',
    name: 'Colors',
    description: 'Semantic color tokens from the WTS-ShadCn DS. Edit CSS variable values in tokens.css to rebrand.',
    source: 'foundation',
    demo: {
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
                <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        )
      },
    },
    examples: [
      {
        title: 'Badge Tones',
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
                <div key={name} className="flex h-10 w-16 items-center justify-center rounded-md text-xs font-medium" style={{ backgroundColor: bg, color: fg }}>{name}</div>
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
    source: 'foundation',
    demo: {
      code: `/* tokens.css */\n--text-4xl: 3rem;    /* H1 48px Bold */\n--text-3xl: 1.875rem; /* H2 30px SemiBold */\n--text-2xl: 1.5rem;  /* H3 24px SemiBold */`,
      render: () => (
        <div className="flex flex-col gap-3">
          <p className="text-4xl font-bold tracking-tight">H1 — 48px Bold</p>
          <p className="border-b pb-2 text-3xl font-semibold tracking-tight">H2 — 30px SemiBold</p>
          <p className="text-2xl font-semibold tracking-tight">H3 — 24px SemiBold</p>
          <p className="text-xl font-semibold tracking-tight">H4 — 20px SemiBold</p>
        </div>
      ),
    },
    examples: [
      {
        title: 'Body Scale',
        code: `--text-lg: 1.125rem; /* Large */\n--text-base: 1rem;   /* Paragraph */\n--text-sm: 0.875rem; /* Small */`,
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
        title: 'Font Families',
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
    source: 'foundation',
    demo: {
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
              <div key={cls} className={`flex h-20 w-24 items-center justify-center rounded-lg bg-background text-xs font-medium ${cls}`}>{label}</div>
            ))}
          </div>
        )
      },
    },
    examples: [],
  },
  {
    id: 'radius',
    name: 'Border Radius',
    description: 'Radius scale derived from --radius base value. Change --radius in tokens.css and all sizes adjust.',
    source: 'foundation',
    demo: {
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
              <div key={cls} className={`flex h-16 w-16 items-center justify-center border bg-muted text-xs font-medium ${cls}`}>{label}</div>
            ))}
          </div>
        )
      },
    },
    examples: [],
  },
]
