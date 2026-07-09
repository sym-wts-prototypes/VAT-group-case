# @wts/ui — Component Reconciliation

Each component is tagged with its source and whether it has a Code Connect mapping to the WTS-ShadCn Figma DS. shadcn CLI is initialized (`components.json`) — run `pnpm dlx shadcn@latest add <name> --cwd packages/ui --path src --overwrite` to install/update, then convert `@/` imports to relative `./`.

## Token layer

| Token group | File | Controlled by |
|---|---|---|
| Colors | `tokens.css` | Figma sync (`figma-tokens.mjs --write`) or manual edit |
| Border radius | `tokens.css` `--radius` | Change `--radius`; sm/md/lg/xl/2xl derive from it |
| Typography | `tokens.css` + `tailwind-preset.ts` | Font sizes, line heights, tracking from DS |
| Shadows | `tokens.css` | sm through 2xl, matching DS effect styles |

## Components

| Component | Source | Code Connect | Notes |
|---|---|---|---|
| Accordion | shadcn (Radix) | — | Single/multiple expand-collapse; default chevron + height animation |
| Alert | shadcn + customized | — | info/success/warning/destructive variants |
| AspectRatio | shadcn | `aspect-ratio.figma.tsx` | |
| Avatar | shadcn | `avatar.figma.tsx` | |
| Badge | shadcn + customized | — | Tones (gray/blue/green/amber/red); `size` (sm/md) + icon |
| Button | shadcn + customized | `button.figma.tsx` | 7 variants, 4 sizes; `loading` prop; `brand` variant |
| Calendar | shadcn (v10) | `calendar.figma.tsx` | react-day-picker v10 |
| Card | shadcn | `card.figma.tsx` | |
| Chart | shadcn | `chart.figma.tsx` | Recharts wrapper |
| Checkbox | shadcn (Radix) | `checkbox.figma.tsx` | Bare control; see CheckboxField for card layout |
| CheckboxField | WTS custom | `checkbox.figma.tsx` | Card layout (label + description) wrapping Checkbox |
| DataTable | WTS custom | `data-table.figma.tsx` | TanStack Table |
| DatePicker | WTS custom | — | Single date; Popover + Calendar composite |
| DateRangePicker | WTS custom | — | Date range; Popover + Calendar (`mode="range"`) composite |
| Drawer | shadcn | `drawer.figma.tsx` | vaul; bottom-anchored only — use Sheet for a side panel |
| DropdownMenu | shadcn | `dropdown-menu.figma.tsx` | |
| Dropzone | WTS custom | — | Simple drag-and-drop area |
| FileDropzone | WTS custom | — | Rich: validation, progress bar, error, template download |
| Input | shadcn | `input.figma.tsx` | |
| JurisdictionFlag | WTS custom | — | Country flag (`country-flag-icons`, 3x2) + ISO code; falls back to plain code text |
| Label | shadcn | — | |
| OptionPills | WTS custom | — | Pill-styled radio group (filled primary when selected) |
| Popover | shadcn (Radix) | — | Floating panel primitive; backs DatePicker/DateRangePicker |
| RadioGroup | shadcn (Radix) | — | Bare Radix radio group |
| RadioPills | WTS custom | — | Vertical native-radio group with label |
| SegmentedTabs | WTS custom | — | Segmented control with optional count badge |
| Select | shadcn | `select.figma.tsx` | |
| SelectField | WTS custom | — | Select with label/info/description/error |
| Separator | shadcn | `separator.figma.tsx` | |
| Sheet | shadcn (Radix dialog) | — | Side-anchored panel (drawer); `side` = top/bottom/left/right |
| Stepper | WTS custom | — | Horizontal; finished/inProgress/notStarted/disabled states |
| MiniStepper | WTS custom | — | Compact dot+line row-level progress indicator; same color language as Stepper |
| Switch | shadcn (Radix) | `switch.figma.tsx` | Bare control; see SwitchField for card layout |
| SwitchField | WTS custom | `switch.figma.tsx` | Card layout (label + description + labelPosition) |
| Table | shadcn | `table.figma.tsx` | |
| Tabs | shadcn (Radix) | — | Generic Radix tabs; see SegmentedTabs for project pattern |
| Textarea | shadcn | `textarea.figma.tsx` | |
| Tooltip | shadcn (Radix) | — | Wrap trigger in `TooltipProvider` |
