# Design-System Alignment Audit — Organisations Prototype

Scope: `prototypes/organisations/src/**`. This is a **report only** (item 10 of the
current work). No code was changed for the audit itself; the fixes below are
recommendations, ordered by impact. Items 1-9 of the same work already brought the
touched areas (workspace tabs, entity list header, group header, service-line editor,
sticky action columns) closer to the design system.

Reference: `AGENTS.md` — "compose from `@wts/ui`, no raw elements or hardcoded values;
if something needs a new reusable component, propose adding it to the library."

## How to read this

Counts below come from a static scan of `*.tsx` in the components folder. Numbers are
occurrences, not severity. "Fix with" points at the existing `@wts/ui` primitive that
should replace the raw markup.

---

## P0 — Highest impact (shared primitives used everywhere)

### 1. Raw form controls in modals (`<input>`, `<select>`, `<textarea>`)
Local `Input` / `Select` wrappers re-implement styling instead of using `@wts/ui`.

| File | approx. raw inputs/selects |
| --- | --- |
| `legal-entity-modal.tsx` | 20 |
| `engagement-modals.tsx` | 5 |
| `access-user-modal.tsx` | 3 |
| `invite-user-modal.tsx` | 2 |
| `engagement-detail-page.tsx` | 1 |
| `organization-panel.tsx` | 1 |

Fix with: `Input`, `Textarea`, `Label` from `@wts/ui`, and the `Select` /
`select-field` primitive. The local `Input`/`Select`/`Label` helpers in
`engagement-modals.tsx` (lines ~23-47) and `legal-entity-modal.tsx` should be deleted in
favour of the library versions.

### 2. Hardcoded focus-ring / brand colors (`oklch(...)`, `rgba(200,16,46,...)`)
These bypass the theme tokens (`--ring`, `--brand`).

| Pattern | Files |
| --- | --- |
| `oklch(0.55 0.22 25)` focus ring (5x) | `engagement-modals.tsx` |
| `rgba(200,16,46,0.1/0.12)` selected-row tint (1x each) | `org-workspace.tsx`, `groups-tab.tsx`, `legal-entity-tree.tsx`, `user-org-workspace.tsx`, `engagement-modals.tsx`, `admin-org-workspace.tsx` |

Fix with: token utilities — `focus-visible:ring-ring`, and `bg-brand/10` /
`text-brand` for the selected tint (brand is `hsl(var(--brand))` = the same red).

### 3. Modal overlays via inline `rgba(0,0,0,0.45)` + hand-rolled modal shell
`engagement-modals.tsx` (4x) and `org-workspace.tsx` (3x) build fixed-position overlays
manually (the local `Modal` component, `DisableEngagementDialog`, etc.).

Fix with: `Dialog` / `AlertDialog` from `@wts/ui` (already used correctly by
`groups-tab.tsx` for its confirm dialogs — use that as the template). This also removes
the manual `z-[100]` / overlay management.

---

## P1 — High impact

### 4. Raw `<button>` instead of `Button`
Raw buttons re-style variants (primary/outline/ghost/link) inline.

| File | approx. raw buttons |
| --- | --- |
| `engagement-modals.tsx` | 20 |
| `org-workspace.tsx` | 15 |
| `legal-entity-modal.tsx` | 11 |
| `access-user-modal.tsx` | 10 |
| `admin-org-workspace.tsx` | 8 |
| `engagement-detail-page.tsx` | 6 |
| `invite-user-modal.tsx` | 6 |
| `user-org-workspace.tsx` | 5 |
| `groups-tab.tsx` | 4 |
| `role-switcher.tsx` | 4 |
| `group-modals.tsx` | 3 |
| `legal-entity-tree.tsx` | 3 |
| `entity-dialogs.tsx` | 2 |

Fix with: `Button` (`variant` = `default` | `outline` | `ghost` | `link` | `brand`,
`size` = `sm` | `icon`). The modal Cancel/confirm footers and the entity/org
Edit/Disable/Enable buttons (org-workspace `OrgDetailsTab`, lines ~1799-1818) are the
biggest wins.

### 5. Raw `<table>` instead of the `Table` primitive / `DataTable`
| File | tables |
| --- | --- |
| `org-workspace.tsx` | 5 |
| `engagement-detail-page.tsx` | 3 |
| `engagement-modals.tsx` | 2 |
| `user-org-workspace.tsx` | 2 |

Fix with: `Table`/`TableHeader`/`TableRow`/`TableHead`/`TableCell`, or `DataTable`.
Note: the shared `Th`/`Td`/`ThActions`/`TdActions` helpers in `org-workspace.tsx` are the
de-facto local table kit; if a full migration is too costly, at minimum move these
helpers into `@wts/ui` (or wrap `DataTable`) so every table shares one implementation and
the new sticky-actions behaviour is consistent.

---

## P2 — Medium impact (typography & spacing tokens)

### 6. Inline `fontFamily` styles
Cera Pro / IBM Plex Sans are applied via `style={{ fontFamily: ... }}` rather than a font
token/utility.

| File | occurrences |
| --- | --- |
| `org-workspace.tsx` | 12 |
| `user-org-workspace.tsx` | 5 |
| `engagement-detail-page.tsx` | 4 |
| `engagement-modals.tsx` | 4 |
| `admin-org-workspace.tsx` | 3 |
| `placeholder-view.tsx` | 2 |
| `entity-dialogs.tsx`, `legal-entity-modal.tsx`, `legal-entity-tree.tsx` | 1 each |

Fix with: the `font-display` utility (already used by `groups-tab.tsx`, e.g.
`font-display text-[22px] font-bold`) for headings, and the default sans stack for body.

### 7. Hardcoded `text-[..px]` / `leading-[..px]` sizes
Pervasive across all files. These map to Tailwind's semantic sizes from the preset
(`text-sm`, `text-base`, `text-lg`, etc.). Lower priority — cosmetic consistency, but
worth a sweep once the component-level fixes above land.

---

## Dead / legacy code to remove (not DS, but found during the audit)

- `admin-org-workspace.tsx` and `user-org-workspace.tsx` appear to be legacy variants of
  the main workspace. If they are not routed to, delete them — they duplicate the raw-markup
  debt (e.g. `admin-org-workspace.tsx` still re-implements tables/buttons and the
  `rgba(200,16,46,...)` tint).
- `legal-entity-tree.tsx` is not used by the main workspace (the entity tree is rendered
  inline in `org-workspace.tsx`). Confirm and remove.

## Suggested sequence if/when we act on this

1. Introduce library `Input`/`Select`/`Label`/`Textarea` in the modals (P0.1) and delete
   local wrappers.
2. Swap overlays to `Dialog`/`AlertDialog` (P0.3).
3. Replace hardcoded colors with tokens (P0.2) — mechanical, low risk.
4. Migrate raw `<button>` to `Button` (P1.4), file by file.
5. Consolidate tables (P1.5) — promote `Th`/`Td`/`*Actions` into `@wts/ui` or adopt
   `DataTable`.
6. Typography sweep (P2.6, P2.7).
7. Delete legacy files.
