# VAT Group Case

Dedicated home for the **VAT Group Case** workflow — Case Management (Parent
and Child VAT Group Cases), the Single/Group Case creation drawers, and the
VAT Scheduler. Cloned from `wts-process-extension` for full feature parity
before VAT Group Case ownership is split out of that prototype (see that
prototype's own docs/comments for the "temporary until cleanup" context).
Everything below this point, and the rest of the codebase, is otherwise
identical to `wts-process-extension` at clone time.

A small internal tool to design and track the four header types across the
WTS / Client platforms, the three tax processes (**CIT**, **HR**, **VAT**),
and the four roles (**Creator**, **Reviewer**, **Partner**, **Client**).

The whole point of this project: **one config file decides what every header
renders**, so changing a rule in one place propagates everywhere.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui primitives (custom theme)
- `lucide-react` for icons (mirrors the Figma)
- `zustand` for the demo controls, with URL hash sync so a state is shareable

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5176](http://localhost:5176).

```bash
npm run build     # type-check + production build
npm run lint      # TypeScript noEmit check
npm run preview   # local preview via Wrangler (serves ./dist)
```

## Deploy to Cloudflare

This app is a static Vite build hosted on [Cloudflare Workers static assets](https://developers.cloudflare.com/workers/static-assets/).

1. Log in once: `npx wrangler login`
2. Deploy: `npm run deploy`

The first deploy publishes to `https://wts-headers-playground.<your-subdomain>.workers.dev`.
To use a custom domain, add it in the Cloudflare dashboard under the Worker’s **Triggers** tab.

If the worker name is taken, change `name` in `wrangler.jsonc` and deploy again.

Use the control panel to pick process / platform / role / header type / phase
and see the live header plus a placeholder for the content below. The URL hash
reflects the selection (e.g. `#cit/wts/creator/case/inPreparation`) so you can
share a specific state.

## Architecture

```
Controls (UI)
  -> Zustand store (URL hash sync)
    -> resolveHeader(ctx)
      -> config/headers.ts        <-- SINGLE SOURCE OF TRUTH
    -> HeaderDescriptor
  -> HeaderRenderer
    -> CaseWrapperHeader / CaseHeader / RequirementListHeader / RequirementBucketHeader
```

Header components are **dumb**. They only know how to render a
`HeaderDescriptor`. All the "what action shows in which phase for which role"
logic lives in [src/config/headers.ts](src/config/headers.ts).

## Where to edit what

| You want to change... | Edit |
|---|---|
| The text on a phase's primary button for a role | `src/config/headers.ts` -> `CONFIG.{process}.{headerType}.phases.{phase}.{role}` |
| Which phases exist for a (process, headerType) | `src/config/phases.ts` |
| The list of valid roles for a platform | `src/lib/resolveHeader.ts` -> `rolesFor` |
| Whether a header type is valid for a (process, platform) | `src/lib/resolveHeader.ts` -> `headerTypesFor` / `isValidContext` |
| Demo people / company / due date | `src/config/sampleData.ts` |
| Theme colors / radius / shadows | `src/index.css` |

## Config merge order

`resolveHeader(ctx)` merges these layers, last one wins:

1. `GLOBAL_DEFAULT` (cross-process)
2. `CONFIG[process].base`
3. `CONFIG[process][headerType].base`
4. `CONFIG[process][headerType].phases[phase].default`
5. `CONFIG[process][headerType].phases[phase][role]`

This makes it easy to set a rule once at the broadest level and only override
where it diverges - e.g. `inPreparation` defaults apply to Creator, Reviewer,
and Partner; only override `inPreparation.reviewer` if the Reviewer should
see different actions.

## Known TODOs

- **Case Wrapper (HR)** - awaiting Figma. Currently a placeholder modeled
  after the Case header, marked with a dashed border + "Placeholder" pill.
- **HR / VAT phase divergence** - HR and VAT currently clone the CIT phase
  rules. Diverge in `CONFIG.hr.case.phases.*` / `CONFIG.vat.case.phases.*`
  as the actual differences emerge.

## File map

```
src/
  config/
    headers.ts           # SINGLE SOURCE OF TRUTH for header rules
    phases.ts            # which phases exist per (process, headerType)
    sampleData.ts        # demo people / case / due date
  lib/
    resolveHeader.ts     # validity rules + descriptor merge
    cn.ts                # tailwind classnames helper
  store/
    useDemoStore.ts      # zustand + URL hash sync
  components/
    ui/                  # shadcn primitives (Button, Badge, Select, Separator)
    headers/
      parts/             # Breadcrumb, BackLink, Title, Badges, PeopleRow, DueDate, Actions, Icon
      CaseHeader.tsx
      CaseWrapperHeader.tsx       # HR only, placeholder
      RequirementListHeader.tsx   # WTS
      RequirementBucketHeader.tsx # Client
      HeaderRenderer.tsx
    body/
      BodyPlaceholder.tsx  # shows what nests under each header
    controls/
      ControlPanel.tsx     # selects for process / platform / role / headerType / phase
  views/
    PlaygroundView.tsx
  App.tsx
  main.tsx
  types.ts                 # Process, Role, HeaderType, Phase, Platform, HeaderDescriptor
```
