# @wts/ui — Component Reconciliation

Each component is tagged with its source of truth and whether it has a Code Connect mapping to the WTS-ShadCn Figma DS.

| Component | Source | Code Connect | Notes |
|---|---|---|---|
| Alert | Project (CitInReviewReconfirmBanner) | — | info/success/warning/destructive variants |
| AspectRatio | DS | `aspect-ratio.figma.tsx` | |
| Avatar | DS | `avatar.figma.tsx` | |
| Badge | Project + DS enriched | — | Tones from project; added `size` (sm/md) + icon support |
| Button | Project + DS enriched | `button.figma.tsx` | 7 variants, 4 sizes; added `loading` prop from DS |
| Calendar | DS | `calendar.figma.tsx` | react-day-picker |
| Card | DS | `card.figma.tsx` | |
| Chart | DS | `chart.figma.tsx` | Recharts wrapper |
| Checkbox | DS (Radix) | `checkbox.figma.tsx` | Bare control; see CheckboxField for card layout |
| CheckboxField | Project + DS | `checkbox.figma.tsx` | Card layout (label + description) wrapping Checkbox |
| DataTable | DS | `data-table.figma.tsx` | TanStack Table |
| Drawer | DS | `drawer.figma.tsx` | vaul |
| DropdownMenu | DS | `dropdown-menu.figma.tsx` | |
| Dropzone | Custom | — | Simple drag-and-drop area |
| FileDropzone | Project | — | Rich: validation, progress bar, error, template download |
| Input | DS | `input.figma.tsx` | |
| Label | DS | — | |
| OptionPills | Project | — | Pill-styled radio group (filled primary when selected) |
| RadioGroup | DS (Radix) | — | Bare Radix radio group |
| RadioPills | Project (PhaseRadios) | — | Vertical native-radio group with label |
| SegmentedTabs | Project (ProcessTabs) | — | Segmented control with optional count badge |
| Select | DS | `select.figma.tsx` | |
| SelectField | DS | — | Select with label/info/description/error |
| Separator | DS | `separator.figma.tsx` | |
| Stepper | Project (CasePhaseStepper) | — | Horizontal; finished/inProgress/notStarted/disabled states |
| Switch | DS (Radix) | `switch.figma.tsx` | Bare control; see SwitchField for card layout |
| SwitchField | Project + DS | `switch.figma.tsx` | Card layout (label + description + labelPosition) |
| Table | DS | `table.figma.tsx` | |
| Tabs | DS (Radix) | — | Generic Radix tabs; see SegmentedTabs for project pattern |
| Textarea | DS | `textarea.figma.tsx` | |
