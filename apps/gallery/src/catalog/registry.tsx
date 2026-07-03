import { type ReactNode } from 'react'
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
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
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
  FileDropzone,
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

export interface PlaygroundControl {
  prop: string
  label?: string
  type: 'select' | 'boolean' | 'text'
  options?: string[]
  defaultValue: string | boolean
  /** When provided, control is only shown if predicate returns true. */
  visible?: (values: Record<string, any>) => boolean
}

export interface Playground {
  controls: PlaygroundControl[]
  render: (
    props: Record<string, any>,
    setValue: (prop: string, value: any) => void,
  ) => ReactNode
  code: (props: Record<string, any>) => string
}

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
  /** Interactive playground with controls */
  playground?: Playground
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
    playground: {
      controls: [
        { prop: 'variant', type: 'select', options: ['default', 'brand', 'secondary', 'outline', 'ghost', 'link', 'destructive'], defaultValue: 'default' },
        { prop: 'size', type: 'select', options: ['default', 'sm', 'lg', 'icon'], defaultValue: 'default' },
        { prop: 'label', type: 'text', defaultValue: 'Button' },
        { prop: 'leftIcon', label: 'left icon', type: 'boolean', defaultValue: false },
        { prop: 'rightIcon', label: 'right icon', type: 'boolean', defaultValue: false },
        { prop: 'disabled', type: 'boolean', defaultValue: false },
        { prop: 'loading', type: 'boolean', defaultValue: false },
      ],
      render: (p) => (
        <Button variant={p.variant} size={p.size} disabled={p.disabled} loading={p.loading}>
          {p.size === 'icon' ? (
            <ArrowRight />
          ) : (
            <>
              {p.leftIcon && <ArrowRight />}
              {p.label || 'Button'}
              {p.rightIcon && <ArrowRight />}
            </>
          )}
        </Button>
      ),
      code: (p) => {
        const a: string[] = []
        if (p.variant !== 'default') a.push(`variant="${p.variant}"`)
        if (p.size !== 'default') a.push(`size="${p.size}"`)
        if (p.disabled) a.push('disabled')
        if (p.loading) a.push('loading')
        const attrs = a.length ? ' ' + a.join(' ') : ''
        if (p.size === 'icon') {
          return `<Button${attrs}>\n  <ArrowRight />\n</Button>`
        }
        const inner: string[] = []
        if (p.leftIcon) inner.push('<ArrowRight />')
        inner.push(p.label || 'Button')
        if (p.rightIcon) inner.push('<ArrowRight />')
        return inner.length === 1
          ? `<Button${attrs}>${inner[0]}</Button>`
          : `<Button${attrs}>\n  ${inner.join('\n  ')}\n</Button>`
      },
    },
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
    description: 'Displays a badge or a component that looks like a badge. Supports Fill and Soft styles with 8 color tones.',
    source: 'shadcn-customized',
    installCommand: 'pnpm dlx shadcn@latest add badge --cwd packages/ui --path src',
    importPath: `import { Badge } from '@wts/ui'`,
    playground: {
      controls: [
        { prop: 'variant', type: 'select', options: ['soft', 'fill'], defaultValue: 'soft' },
        { prop: 'tone', type: 'select', options: ['default', 'gray', 'sky', 'blue', 'green', 'orange', 'red', 'violet'], defaultValue: 'default' },
        { prop: 'size', type: 'select', options: ['sm', 'md', 'lg'], defaultValue: 'sm' },
        { prop: 'label', type: 'text', defaultValue: 'Badge' },
        { prop: 'leftIcon', label: 'left icon', type: 'boolean', defaultValue: false },
        { prop: 'rightIcon', label: 'right icon', type: 'boolean', defaultValue: false },
        { prop: 'disabled', type: 'boolean', defaultValue: false },
      ],
      render: (p) => (
        <Badge variant={p.variant} tone={p.tone} size={p.size} disabled={p.disabled}>
          {p.leftIcon && <Check />}
          {p.label || 'Badge'}
          {p.rightIcon && <Check />}
        </Badge>
      ),
      code: (p) => {
        const a: string[] = []
        if (p.variant !== 'soft') a.push(`variant="${p.variant}"`)
        if (p.tone !== 'default') a.push(`tone="${p.tone}"`)
        if (p.size !== 'sm') a.push(`size="${p.size}"`)
        if (p.disabled) a.push('disabled')
        const attrs = a.length ? ' ' + a.join(' ') : ''
        const inner: string[] = []
        if (p.leftIcon) inner.push('<Check />')
        inner.push(p.label || 'Badge')
        if (p.rightIcon) inner.push('<Check />')
        return inner.length === 1
          ? `<Badge${attrs}>${inner[0]}</Badge>`
          : `<Badge${attrs}>\n  ${inner.join('\n  ')}\n</Badge>`
      },
    },
    demo: {
      code: `<Badge variant="fill" tone="sky" size="md">In Review</Badge>`,
      render: () => <Badge variant="fill" tone="sky" size="md">In Review</Badge>,
    },
    examples: [
      {
        title: 'Fill Tones',
        description: 'Solid background with light text.',
        code: `<Badge variant="fill" tone="default">default</Badge>\n<Badge variant="fill" tone="gray">gray</Badge>\n<Badge variant="fill" tone="sky">sky</Badge>\n<Badge variant="fill" tone="blue">blue</Badge>\n<Badge variant="fill" tone="green">green</Badge>\n<Badge variant="fill" tone="orange">orange</Badge>\n<Badge variant="fill" tone="red">red</Badge>\n<Badge variant="fill" tone="violet">violet</Badge>`,
        render: () => (
          <div className="flex flex-wrap items-center gap-2">
            {(['default', 'gray', 'sky', 'blue', 'green', 'orange', 'red', 'violet'] as const).map((tone) => (
              <Badge key={tone} variant="fill" tone={tone}>{tone}</Badge>
            ))}
          </div>
        ),
      },
      {
        title: 'Soft Tones',
        description: 'Tinted background with border and dark text.',
        code: `<Badge tone="default">default</Badge>\n<Badge tone="gray">gray</Badge>\n<Badge tone="sky">sky</Badge>\n<Badge tone="blue">blue</Badge>\n<Badge tone="green">green</Badge>\n<Badge tone="orange">orange</Badge>\n<Badge tone="red">red</Badge>\n<Badge tone="violet">violet</Badge>`,
        render: () => (
          <div className="flex flex-wrap items-center gap-2">
            {(['default', 'gray', 'sky', 'blue', 'green', 'orange', 'red', 'violet'] as const).map((tone) => (
              <Badge key={tone} tone={tone}>{tone}</Badge>
            ))}
          </div>
        ),
      },
      {
        title: 'Sizes',
        code: `<Badge size="sm">Small</Badge>\n<Badge size="md">Medium</Badge>\n<Badge size="lg">Large</Badge>`,
        render: () => (
          <div className="flex items-center gap-2">
            <Badge variant="fill" tone="sky" size="sm">Small</Badge>
            <Badge variant="fill" tone="sky" size="md">Medium</Badge>
            <Badge variant="fill" tone="sky" size="lg">Large</Badge>
          </div>
        ),
      },
      {
        title: 'With Icon',
        code: `<Badge variant="fill" tone="green" size="md"><Check /> Approved</Badge>`,
        render: () => (
          <Badge variant="fill" tone="green" size="md"><Check /> Approved</Badge>
        ),
      },
      {
        title: 'Disabled',
        code: `<Badge variant="fill" tone="sky" disabled>Disabled</Badge>`,
        render: () => (
          <div className="flex items-center gap-2">
            <Badge variant="fill" tone="sky" disabled>Disabled</Badge>
            <Badge tone="sky" disabled>Disabled</Badge>
          </div>
        ),
      },
    ],
    props: [
      { name: 'variant', type: '"fill" | "soft"', default: '"soft"' },
      { name: 'tone', type: '"default" | "gray" | "red" | "sky" | "orange" | "green" | "violet" | "blue"', default: '"gray"' },
      { name: 'size', type: '"sm" | "md" | "lg"', default: '"sm"' },
      { name: 'disabled', type: 'boolean', default: 'false' },
    ],
  },
  {
    id: 'alert',
    name: 'Alert',
    description: 'Displays a callout for important information. Supports default, info, success, warning, and destructive variants with optional title, badge, action button, and close.',
    source: 'shadcn-customized',
    importPath: `import { Alert } from '@wts/ui'`,
    playground: {
      controls: [
        { prop: 'variant', type: 'select', options: ['default', 'info', 'success', 'warning', 'destructive'], defaultValue: 'info' },
        { prop: 'showIcon', label: 'icon', type: 'boolean', defaultValue: true },
        { prop: 'showTitle', label: 'title', type: 'boolean', defaultValue: true },
        { prop: 'showSubtitle', label: 'subtitle', type: 'boolean', defaultValue: true },
        { prop: 'showBadge', label: 'badge', type: 'boolean', defaultValue: false },
        { prop: 'showButton', label: 'button', type: 'boolean', defaultValue: false },
        { prop: 'showClose', label: 'close', type: 'boolean', defaultValue: false },
      ],
      render: (p) => (
        <Alert
          variant={p.variant}
          icon={p.showIcon ? undefined : null}
          title={p.showTitle ? 'Alert Title' : undefined}
          badge={p.showBadge ? <Badge className="border-border bg-background text-foreground">Additional Info</Badge> : undefined}
          action={p.showButton ? <Button variant="outline" size="sm">Button</Button> : undefined}
          onClose={p.showClose ? () => {} : undefined}
          className="max-w-lg"
        >
          {p.showSubtitle ? 'This is an alert description.' : undefined}
        </Alert>
      ),
      code: (p) => {
        const a: string[] = []
        if (p.variant !== 'info') a.push(`variant="${p.variant}"`)
        if (!p.showIcon) a.push('icon={null}')
        if (p.showTitle) a.push('title="Alert Title"')
        if (p.showBadge) a.push('badge={<Badge variant="outline">Additional Info</Badge>}')
        if (p.showButton) a.push('action={<Button variant="outline" size="sm">Button</Button>}')
        if (p.showClose) a.push('onClose={() => dismiss()}')
        const children = p.showSubtitle ? '\n  This is an alert description.\n' : ''
        return `<Alert${a.length ? '\n  ' + a.join('\n  ') : ''}>${children}</Alert>`
      },
    },
    demo: {
      code: `<Alert variant="info" title="Alert Title">This is an alert description.</Alert>`,
      render: () => <Alert variant="info" title="Alert Title" className="max-w-lg">This is an alert description.</Alert>,
    },
    examples: [
      {
        title: 'Default',
        code: `<Alert variant="default" title="Alert Title">This is an alert description.</Alert>`,
        render: () => <Alert variant="default" title="Alert Title" className="max-w-lg">This is an alert description.</Alert>,
      },
      {
        title: 'Info',
        code: `<Alert variant="info" title="Neue Belegart angelegt">Bitte prüfen Sie die Zuordnung unter Einstellungen.</Alert>`,
        render: () => <Alert variant="info" title="Neue Belegart angelegt" className="max-w-lg">Bitte prüfen Sie die Zuordnung unter Einstellungen.</Alert>,
      },
      {
        title: 'Success',
        code: `<Alert variant="success" title="Package approved">The client approved the data package.</Alert>`,
        render: () => <Alert variant="success" title="Package approved" className="max-w-lg">The client approved the data package.</Alert>,
      },
      {
        title: 'Warning',
        code: `<Alert variant="warning" title="Assessments outstanding">Some assessments are still outstanding.</Alert>`,
        render: () => <Alert variant="warning" title="Assessments outstanding" className="max-w-lg">Some assessments are still outstanding.</Alert>,
      },
      {
        title: 'Destructive',
        code: `<Alert variant="destructive" title="Submission failed">The protocol could not be confirmed.</Alert>`,
        render: () => <Alert variant="destructive" title="Submission failed" className="max-w-lg">The protocol could not be confirmed.</Alert>,
      },
      {
        title: 'Full Featured',
        code: `<Alert\n  variant="info"\n  title="New update available"\n  badge={<Badge>v2.1</Badge>}\n  action={<Button variant="outline" size="sm">Update</Button>}\n  onClose={() => dismiss()}\n>\n  Version 2.1 includes performance improvements.\n</Alert>`,
        render: () => (
          <Alert
            variant="info"
            title="New update available"
            badge={<Badge>v2.1</Badge>}
            action={<Button variant="outline" size="sm">Update</Button>}
            onClose={() => {}}
            className="max-w-lg"
          >
            Version 2.1 includes performance improvements.
          </Alert>
        ),
      },
      {
        title: 'No Icon',
        code: `<Alert variant="warning" icon={null} title="Rate limit reached">Please wait before retrying.</Alert>`,
        render: () => <Alert variant="warning" icon={null} title="Rate limit reached" className="max-w-lg">Please wait before retrying.</Alert>,
      },
    ],
    props: [
      { name: 'variant', type: '"default" | "info" | "success" | "warning" | "destructive"', default: '"info"' },
      { name: 'title', type: 'ReactNode' },
      { name: 'icon', type: 'ComponentType | null' },
      { name: 'badge', type: 'ReactNode' },
      { name: 'action', type: 'ReactNode' },
      { name: 'onClose', type: '() => void' },
    ],
  },
  {
    id: 'input',
    name: 'Input',
    description: 'Displays a form input field.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add input --cwd packages/ui --path src',
    importPath: `import { Input } from '@wts/ui'`,
    playground: {
      controls: [
        { prop: 'type', type: 'select', options: ['text', 'email', 'password', 'number', 'search'], defaultValue: 'text' },
        { prop: 'placeholder', type: 'text', defaultValue: 'Email' },
        { prop: 'disabled', type: 'boolean', defaultValue: false },
      ],
      render: (p) => <Input type={p.type} placeholder={p.placeholder} disabled={p.disabled} className="max-w-sm" />,
      code: (p) => {
        const a: string[] = []
        if (p.type !== 'text') a.push(`type="${p.type}"`)
        if (p.placeholder) a.push(`placeholder="${p.placeholder}"`)
        if (p.disabled) a.push('disabled')
        return `<Input${a.length ? ' ' + a.join(' ') : ''} />`
      },
    },
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
    playground: {
      controls: [
        { prop: 'placeholder', type: 'text', defaultValue: 'Add a comment…' },
        { prop: 'disabled', type: 'boolean', defaultValue: false },
      ],
      render: (p) => <Textarea placeholder={p.placeholder} disabled={p.disabled} className="max-w-sm" />,
      code: (p) => {
        const a: string[] = []
        if (p.placeholder) a.push(`placeholder="${p.placeholder}"`)
        if (p.disabled) a.push('disabled')
        return `<Textarea${a.length ? ' ' + a.join(' ') : ''} />`
      },
    },
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
    playground: {
      controls: [
        { prop: 'checked', label: 'checked', type: 'boolean', defaultValue: true },
        { prop: 'disabled', type: 'boolean', defaultValue: false },
      ],
      render: (p, setValue) => (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={p.checked}
            disabled={p.disabled}
            onCheckedChange={(v) => setValue('checked', v === true)}
          />
          <Label>Accept terms and conditions</Label>
        </div>
      ),
      code: (p) => {
        const a: string[] = []
        if (p.checked) a.push('defaultChecked')
        if (p.disabled) a.push('disabled')
        return `<div className="flex items-center gap-2">\n  <Checkbox id="terms"${a.length ? ' ' + a.join(' ') : ''} />\n  <Label htmlFor="terms">Accept terms</Label>\n</div>`
      },
    },
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
    playground: {
      controls: [
        { prop: 'checked', label: 'active', type: 'boolean', defaultValue: true },
        { prop: 'disabled', type: 'boolean', defaultValue: false },
        { prop: 'showTitle', label: 'title', type: 'boolean', defaultValue: true },
        {
          prop: 'showDescription',
          label: 'description',
          type: 'boolean',
          defaultValue: true,
          visible: (v) => !!v.showTitle,
        },
        {
          prop: 'textLeft',
          label: 'text left',
          type: 'boolean',
          defaultValue: false,
          visible: (v) => !!v.showTitle,
        },
      ],
      render: (p, setValue) => {
        if (p.showTitle) {
          return (
            <div className="max-w-sm">
              <SwitchField
                label="Email notifications"
                description={p.showDescription ? 'Receive alerts when tasks change.' : undefined}
                checked={p.checked}
                disabled={p.disabled}
                labelPosition={p.textLeft ? 'left' : 'right'}
                onCheckedChange={(v) => setValue('checked', v)}
              />
            </div>
          )
        }
        return (
          <Switch
            checked={p.checked}
            disabled={p.disabled}
            onCheckedChange={(v) => setValue('checked', v)}
          />
        )
      },
      code: (p) => {
        if (p.showTitle) {
          const a: string[] = [`  label="Email notifications"`]
          if (p.showDescription) a.push('  description="Receive alerts when tasks change."')
          if (p.checked) a.push('  defaultChecked')
          if (p.disabled) a.push('  disabled')
          if (p.textLeft) a.push('  labelPosition="left"')
          return `<SwitchField\n${a.join('\n')}\n/>`
        }
        const a: string[] = []
        if (p.checked) a.push('defaultChecked')
        if (p.disabled) a.push('disabled')
        return `<Switch${a.length ? ' ' + a.join(' ') : ''} />`
      },
    },
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
    playground: {
      controls: [
        { prop: 'orientation', type: 'select', options: ['horizontal', 'vertical'], defaultValue: 'horizontal' },
      ],
      render: (p) =>
        p.orientation === 'vertical' ? (
          <div className="flex h-8 items-center gap-3 text-sm">
            <span>Creator</span>
            <Separator orientation="vertical" />
            <span>Reviewer</span>
            <Separator orientation="vertical" />
            <span>Partner</span>
          </div>
        ) : (
          <div className="w-64 text-sm">
            <p className="pb-3">Section one</p>
            <Separator />
            <p className="pt-3">Section two</p>
          </div>
        ),
      code: (p) =>
        p.orientation === 'vertical'
          ? `<Separator orientation="vertical" />`
          : `<Separator />`,
    },
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
    description: 'Segmented control with muted background and shadow on selected. Optional count badge per tab.',
    source: 'wts-custom',
    importPath: `import { Tabs } from '@wts/ui'`,
    playground: {
      controls: [
        { prop: 'variant', type: 'select', options: ['button', 'line'], defaultValue: 'button' },
        { prop: 'tabCount', label: 'tab count', type: 'select', options: ['2', '3', '4', '5', '6', '7', '8'], defaultValue: '3' },
        { prop: 'showLabel', label: 'label', type: 'boolean', defaultValue: true },
        { prop: 'showCounts', label: 'counts', type: 'boolean', defaultValue: true },
      ],
      render: (p, setValue) => {
        const all = [
          { value: 'cit', label: 'CIT', count: 12 },
          { value: 'hr', label: 'HR', count: 5 },
          { value: 'vat', label: 'VAT', count: 0 },
          { value: 'gst', label: 'GST', count: 3 },
          { value: 'pit', label: 'PIT', count: 8 },
          { value: 'wht', label: 'WHT', count: 1 },
          { value: 'dgt', label: 'DGT', count: 2 },
          { value: 'mvt', label: 'MVT', count: 4 },
        ]
        const n = parseInt(p.tabCount, 10)
        const options = all.slice(0, n).map((o) =>
          p.showCounts ? o : { value: o.value, label: o.label }
        )
        const selected = options.find((o) => o.value === p.selected)?.value ?? options[0]?.value ?? 'cit'
        return (
          <Tabs
            variant={p.variant}
            label={p.showLabel ? 'Process' : undefined}
            value={selected}
            options={options}
            onChange={(v) => setValue('selected', v)}
          />
        )
      },
      code: (p) => {
        const all = [
          { value: 'cit', label: 'CIT', count: 12 },
          { value: 'hr', label: 'HR', count: 5 },
          { value: 'vat', label: 'VAT', count: 0 },
          { value: 'gst', label: 'GST', count: 3 },
          { value: 'pit', label: 'PIT', count: 8 },
          { value: 'wht', label: 'WHT', count: 1 },
          { value: 'dgt', label: 'DGT', count: 2 },
          { value: 'mvt', label: 'MVT', count: 4 },
        ]
        const n = parseInt(p.tabCount, 10)
        const opts = all.slice(0, n).map((o) => {
          const parts = [`value: '${o.value}'`, `label: '${o.label}'`]
          if (p.showCounts) parts.push(`count: ${o.count}`)
          return `  { ${parts.join(', ')} }`
        }).join(',\n')
        const a: string[] = []
        if (p.variant !== 'button') a.push(`  variant="${p.variant}"`)
        if (p.showLabel) a.push(`  label="Process"`)
        a.push(`  value={value}`)
        a.push(`  options={[\n${opts}\n  ]}`)
        a.push(`  onChange={setValue}`)
        return `<Tabs\n${a.join('\n')}\n/>`
      },
    },
    demo: {
      code: `<Tabs label="Process" value="cit" options={[…]} onChange={setProcess} />`,
      render: () => (
        <Tabs
          label="Process" value="cit"
          options={[{ value: 'cit', label: 'CIT' }, { value: 'hr', label: 'HR' }, { value: 'vat', label: 'VAT' }]}
          onChange={() => {}}
        />
      ),
    },
    examples: [],
    props: [
      { name: 'label', type: 'string' },
      { name: 'value', type: 'string', default: 'required' },
      { name: 'options', type: 'TabItem[]', default: 'required' },
      { name: 'onChange', type: '(value: string) => void', default: 'required' },
      { name: 'options[].count', type: 'number' },
      { name: 'options[].disabled', type: 'boolean' },
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
    playground: {
      controls: [
        { prop: 'mode', type: 'select', options: ['single', 'multiple', 'range'], defaultValue: 'single' },
      ],
      render: (p) => (
        <div className="inline-block rounded-md border">
          <Calendar mode={p.mode} />
        </div>
      ),
      code: (p) => `<Calendar mode="${p.mode}" selected={date} onSelect={setDate} />`,
    },
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
    id: 'dialog',
    name: 'Dialog',
    description: 'A modal window for focused tasks. Centered overlay with title, description, content, and footer actions.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add dialog --cwd packages/ui --path src',
    importPath: `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@wts/ui'`,
    demo: {
      code: `<Dialog>\n  <DialogTrigger asChild><Button variant="outline">Open dialog</Button></DialogTrigger>\n  <DialogContent>\n    <DialogHeader>\n      <DialogTitle>Title</DialogTitle>\n      <DialogDescription>Description</DialogDescription>\n    </DialogHeader>\n    <DialogFooter>\n      <Button>Save</Button>\n    </DialogFooter>\n  </DialogContent>\n</Dialog>`,
      render: () => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create organisation</DialogTitle>
              <DialogDescription>Add a new organisation to the platform. You can edit details later.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ),
    },
    examples: [],
    props: [
      { name: 'open', type: 'boolean' },
      { name: 'onOpenChange', type: '(open: boolean) => void' },
      { name: 'modal', type: 'boolean', default: 'true' },
    ],
  },
  {
    id: 'alert-dialog',
    name: 'Alert Dialog',
    description: 'Confirmation modal for destructive or important actions. Cannot be dismissed by overlay click — requires explicit Cancel or Confirm.',
    source: 'shadcn',
    installCommand: 'pnpm dlx shadcn@latest add alert-dialog --cwd packages/ui --path src',
    importPath: `import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@wts/ui'`,
    demo: {
      code: `<AlertDialog>\n  <AlertDialogTrigger asChild><Button variant="destructive">Disable</Button></AlertDialogTrigger>\n  <AlertDialogContent>\n    <AlertDialogHeader>\n      <AlertDialogTitle>Disable organisation?</AlertDialogTitle>\n      <AlertDialogDescription>This will revoke all access.</AlertDialogDescription>\n    </AlertDialogHeader>\n    <AlertDialogFooter>\n      <AlertDialogCancel>Cancel</AlertDialogCancel>\n      <AlertDialogAction>Disable</AlertDialogAction>\n    </AlertDialogFooter>\n  </AlertDialogContent>\n</AlertDialog>`,
      render: () => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Disable organisation</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable Merck KGaA?</AlertDialogTitle>
              <AlertDialogDescription>
                All user access to this organisation will be revoked. Engagements and entities will be preserved and can be restored by re-enabling the organisation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Disable</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
    examples: [],
    props: [
      { name: 'open', type: 'boolean' },
      { name: 'onOpenChange', type: '(open: boolean) => void' },
    ],
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
    playground: {
      controls: [
        { prop: 'disabled', type: 'boolean', defaultValue: false },
        { prop: 'multiple', type: 'boolean', defaultValue: true },
      ],
      render: (p) => <div className="max-w-sm"><Dropzone hint="PDF, PNG or JPG up to 10MB" disabled={p.disabled} multiple={p.multiple} /></div>,
      code: (p) => {
        const a: string[] = ['onFiles={(files) => upload(files)}', 'hint="PDF, PNG or JPG up to 10MB"']
        if (p.disabled) a.push('disabled')
        if (!p.multiple) a.push('multiple={false}')
        return `<Dropzone ${a.join(' ')} />`
      },
    },
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
    description: 'All semantic color tokens from the WTS-ShadCn DS, grouped by purpose. Edit CSS variable values in tokens.css to rebrand.',
    source: 'foundation',
    demo: {
      code: `/* tokens.css — color tokens are HSL "H S% L%" strings */\n--background: 0 0% 100%;\n--foreground: 240 6% 10%;\n--primary: 240 6% 10%;\n--destructive: 356 70% 52%;\n--brand: 358 75% 52%;`,
      render: () => {
        const groups: { title: string; swatches: [string, string][] }[] = [
          {
            title: 'Surface',
            swatches: [
              ['background', '--background'],
              ['foreground', '--foreground'],
              ['card', '--card'],
              ['card-foreground', '--card-foreground'],
              ['popover', '--popover'],
              ['popover-foreground', '--popover-foreground'],
            ],
          },
          {
            title: 'Interactive',
            swatches: [
              ['primary', '--primary'],
              ['primary-foreground', '--primary-foreground'],
              ['secondary', '--secondary'],
              ['secondary-foreground', '--secondary-foreground'],
              ['accent', '--accent'],
              ['accent-foreground', '--accent-foreground'],
            ],
          },
          {
            title: 'Status',
            swatches: [
              ['muted', '--muted'],
              ['muted-foreground', '--muted-foreground'],
              ['destructive', '--destructive'],
              ['destructive-foreground', '--destructive-foreground'],
            ],
          },
          {
            title: 'Border & focus',
            swatches: [
              ['border', '--border'],
              ['input', '--input'],
              ['ring', '--ring'],
              ['sidebar-border', '--sidebar-border'],
              ['sidebar-ring', '--sidebar-ring'],
            ],
          },
          {
            title: 'WTS brand',
            swatches: [
              ['brand', '--brand'],
              ['brand-foreground', '--brand-foreground'],
              ['link', '--link'],
              ['person-name', '--person-name'],
            ],
          },
        ]
        return (
          <div className="flex flex-col gap-6 w-full">
            {groups.map((g) => (
              <div key={g.title} className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {g.swatches.map(([name, varName]) => (
                    <div key={name} className="flex items-center gap-2">
                      <div
                        className="h-9 w-9 shrink-0 rounded-md border"
                        style={{ backgroundColor: `hsl(var(${varName}))` }}
                      />
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-xs font-medium truncate">{name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground truncate">{varName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-2 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Badge tones (soft / fill)</p>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {(['default', 'gray', 'sky', 'blue', 'green', 'orange', 'red', 'violet'] as const).map((t) => (
                    <Badge key={t} tone={t}>{t}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['default', 'gray', 'sky', 'blue', 'green', 'orange', 'red', 'violet'] as const).map((t) => (
                    <Badge key={t} variant="fill" tone={t}>{t}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      },
    },
    examples: [],
  },
  {
    id: 'typography',
    name: 'Typography',
    description: 'Full type system from the WTS-ShadCn Figma DS. Font: IBM Plex Sans. Edit --text-*, --leading-*, --tracking-*, --font-* in tokens.css.',
    source: 'foundation',
    demo: {
      code: `/* tokens.css */\n--font-sans: 'IBM Plex Sans', …;\n--font-display: 'Cera Pro', …;\n--text-xs: 0.75rem;  /* 12px */\n--text-sm: 0.875rem; /* 14px */\n--text-base: 1rem;   /* 16px */`,
      render: () => {
        const sizes: { token: string; cls: string; px: string }[] = [
          { token: '--text-4xl', cls: 'text-4xl', px: '48px' },
          { token: '--text-3xl', cls: 'text-3xl', px: '30px' },
          { token: '--text-2xl', cls: 'text-2xl', px: '24px' },
          { token: '--text-xl', cls: 'text-xl', px: '20px' },
          { token: '--text-lg', cls: 'text-lg', px: '18px' },
          { token: '--text-base', cls: 'text-base', px: '16px' },
          { token: '--text-sm', cls: 'text-sm', px: '14px' },
          { token: '--text-xs', cls: 'text-xs', px: '12px' },
        ]
        const weights = [
          { name: 'Regular', value: '400', cls: 'font-normal' },
          { name: 'Medium', value: '500', cls: 'font-medium' },
          { name: 'SemiBold', value: '600', cls: 'font-semibold' },
          { name: 'Bold', value: '700', cls: 'font-bold' },
        ]
        const leading = [
          { token: '--leading-none', cls: 'leading-none', value: '1' },
          { token: '--leading-tight', cls: 'leading-tight', value: '1.2' },
          { token: '--leading-relaxed', cls: 'leading-relaxed', value: '1.625' },
          { token: '--leading-normal', cls: 'leading-[1.75]', value: '1.75' },
        ]
        const tracking = [
          { token: '--tracking-tight', cls: 'tracking-tight', value: '-0.025em' },
          { token: '--tracking-normal', cls: 'tracking-normal', value: '0em' },
        ]
        return (
          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Font families</p>
              <p className="font-sans text-lg">IBM Plex Sans — <span className="text-muted-foreground font-mono text-xs">--font-sans</span></p>
              <p className="font-display text-lg">Cera Pro — <span className="text-muted-foreground font-mono text-xs">--font-display</span></p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Size scale</p>
              <div className="flex flex-col gap-1.5">
                {sizes.map((s) => (
                  <div key={s.token} className="flex items-baseline gap-4">
                    <span className="w-20 shrink-0 font-mono text-[10px] text-muted-foreground">{s.token}</span>
                    <span className="w-10 shrink-0 font-mono text-[10px] text-muted-foreground">{s.px}</span>
                    <span className={`${s.cls} font-medium`}>Lorem ipsum</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Weights</p>
              <div className="flex flex-col gap-1.5">
                {weights.map((w) => (
                  <div key={w.value} className="flex items-baseline gap-4">
                    <span className="w-20 shrink-0 font-mono text-[10px] text-muted-foreground">{w.value}</span>
                    <span className={`${w.cls} text-base`}>{w.name} — The quick brown fox</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Line height</p>
              <div className="flex flex-col gap-1.5">
                {leading.map((l) => (
                  <div key={l.token} className="flex items-baseline gap-4">
                    <span className="w-28 shrink-0 font-mono text-[10px] text-muted-foreground">{l.token}</span>
                    <span className="w-10 shrink-0 font-mono text-[10px] text-muted-foreground">{l.value}</span>
                    <span className={`${l.cls} text-sm max-w-md`}>The quick brown fox jumps over the lazy dog to demonstrate line-height at this scale.</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Letter spacing</p>
              <div className="flex flex-col gap-1.5">
                {tracking.map((t) => (
                  <div key={t.token} className="flex items-baseline gap-4">
                    <span className="w-28 shrink-0 font-mono text-[10px] text-muted-foreground">{t.token}</span>
                    <span className="w-16 shrink-0 font-mono text-[10px] text-muted-foreground">{t.value}</span>
                    <span className={`${t.cls} text-lg font-medium`}>Heading sample</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      },
    },
    examples: [],
  },
  {
    id: 'shadows',
    name: 'Shadows',
    description: 'Elevation scale matching the WTS-ShadCn DS effect styles. Synced with Figma shadow/* tokens. Edit --shadow-* in tokens.css.',
    source: 'foundation',
    demo: {
      code: `/* tokens.css — matches Figma shadow/* effect styles */\n--shadow-sm:   0 1px 2px 0 rgb(0 0 0 / 0.05);\n--shadow:      0 1px 2px 0 rgb(0 0 0 / 0.06), 0 1px 3px 0 rgb(0 0 0 / 0.1);\n--shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);\n--shadow-lg:   0 4px 6px -2px rgb(0 0 0 / 0.05), 0 10px 15px -3px rgb(0 0 0 / 0.1);\n--shadow-xl:   0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);\n--shadow-2xl:  0 25px 50px -12px rgb(0 0 0 / 0.25);\n--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.06);`,
      render: () => {
        const levels: { cls: string; token: string; figma?: string }[] = [
          { cls: 'shadow-sm', token: '--shadow-sm', figma: 'shadow/sm' },
          { cls: 'shadow', token: '--shadow', figma: 'shadow/base' },
          { cls: 'shadow-md', token: '--shadow-md' },
          { cls: 'shadow-lg', token: '--shadow-lg', figma: 'shadow/lg' },
          { cls: 'shadow-xl', token: '--shadow-xl' },
          { cls: 'shadow-2xl', token: '--shadow-2xl' },
          { cls: 'shadow-inner', token: '--shadow-inner', figma: 'shadow/inner' },
        ]
        return (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {levels.map((l) => (
              <div key={l.cls} className="flex flex-col items-center gap-2">
                <div className={`flex h-16 w-20 items-center justify-center rounded-lg bg-background text-xs font-medium ${l.cls}`}>
                  {l.cls.replace('shadow-', '').replace('shadow', 'base')}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-mono text-[10px] text-muted-foreground">{l.token}</span>
                  {l.figma && <span className="font-mono text-[10px] text-muted-foreground/70">{l.figma}</span>}
                </div>
              </div>
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
    description: 'Radius scale derived from --radius base value (synced with Figma border radius/lg). Change --radius in tokens.css and all sizes adjust proportionally.',
    source: 'foundation',
    demo: {
      code: `/* tokens.css — all levels derive from --radius */\n--radius: 0.5rem;                            /* 8px — Figma border radius/lg */\n--radius-sm: calc(var(--radius) - 4px);      /* 4px */\n--radius-md: calc(var(--radius) - 2px);      /* 6px — Figma border radius/default,md */\n--radius-lg: var(--radius);                  /* 8px */\n--radius-xl: calc(var(--radius) + 4px);      /* 12px */\n--radius-2xl: calc(var(--radius) + 8px);     /* 16px */\n--radius-full: 9999px;                       /* Figma border radius/full */`,
      render: () => {
        const radii: { cls: string; token: string; px: string }[] = [
          { cls: 'rounded-none', token: '—', px: '0' },
          { cls: 'rounded-sm', token: '--radius-sm', px: '4px' },
          { cls: 'rounded-md', token: '--radius-md', px: '6px' },
          { cls: 'rounded-lg', token: '--radius-lg', px: '8px' },
          { cls: 'rounded-xl', token: '--radius-xl', px: '12px' },
          { cls: 'rounded-2xl', token: '--radius-2xl', px: '16px' },
          { cls: 'rounded-full', token: '--radius-full', px: '9999px' },
        ]
        return (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {radii.map((r) => (
              <div key={r.cls} className="flex flex-col items-center gap-2">
                <div className={`flex h-14 w-14 items-center justify-center border bg-muted text-[10px] font-medium ${r.cls}`}>
                  {r.cls.replace('rounded-', '')}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-mono text-[10px] text-muted-foreground">{r.token}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/70">{r.px}</span>
                </div>
              </div>
            ))}
          </div>
        )
      },
    },
    examples: [],
  },
]
