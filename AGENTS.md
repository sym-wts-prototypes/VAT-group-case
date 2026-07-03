# AGENTS.md — WTS Platform

Rules for any AI tool or person creating or editing UI in this repo.
**Read this before writing UI — in Figma or in code.**

> This is the canonical rules file. It is read by Cursor, VS Code, Copilot, Codex,  
> Claude Code and others. `CLAUDE.md` and `.cursor/rules/wts.mdc` just point here, so  
> there is only ever one file to keep up to date — this one.



> **Project status, decisions, and next steps:** see `docs/HANDOFF.md`.

## What this repo is

A pnpm + Turborepo monorepo. `@wts/ui` **(in** `packages/ui`**) is the single source of
truth for all UI.** Prototypes (`prototypes/`*) and the gallery (`apps/gallery`)
*consume* it — they never reimplement it. Design tokens live in
`packages/ui/src/styles/tokens.css` and `packages/ui/tailwind-preset.ts`.

## The one rule

**Compose from** `@wts/ui`**. Never hand-build a primitive the library already provides.**
If something you need doesn't exist, add it to the library — do not inline a one-off
inside a prototype.

## Required flow before building any UI (do not skip)

1. **Check what exists first.** Read `packages/ui/COMPONENTS.md` (the inventory) and
  `packages/ui/src/index.ts` (the exports). Assume the component exists until you've
   confirmed it doesn't. **These two files are the reference for what's available —
   never rely on memory.**
2. **If it exists → import it.** `import { Button, Badge } from '@wts/ui'`. Use its props
  and variants. Do not reproduce its styling inline.
3. **If it doesn't exist → STOP. Do not inline it.** Scaffold it into the library:
  `pnpm gen:component <Name> [figma-node-id]`, build it there, then import it.
4. **From a Figma node:** use the Figma MCP server to get the design context, then map it
  to the existing `@wts/ui` component (Code Connect already links them). Treat the MCP's
   raw React+Tailwind output as a description of intent, not final code: replace its
   arbitrary values with library components and design tokens.
5. **Never hardcode** color, spacing, radius, or type values. Use Tailwind classes backed
  by `tokens.css`.



## Hard don'ts (enforced by lint in `prototypes/**` and `apps/**`)

- **No raw** `<button>`**,** `<input>`**,** `<select>`**,** `<textarea>`**.** Use `Button`, `Input`,
`Select`/`SelectField`, `Textarea`.
- **No** `class-variance-authority`**,** `clsx`**, or** `tailwind-merge` **in consumer code.**
Variants belong in the library. Use `cn` from `@wts/ui`.
- **No reimplementing a library component under a new name.** For a domain alias,
re-export it: `export { RadioPills as PhaseRadios } from '@wts/ui'`.



## Adding to the library (the gate)

A prototype needing a new pattern is the trigger to decide: *is it reusable?*

- **Reusable →** `pnpm gen:component`, style with tokens, add a `*.figma.tsx` Code Connect
mapping if it has a Figma counterpart, export from `index.ts`, document in `COMPONENTS.md`.
- **Genuinely one-off →** it may live in the prototype, but it still composes from
`@wts/ui` primitives and uses tokens (no raw elements, no hardcoded values).



## Checks

- `pnpm lint` — includes the reuse rules above; runs on every PR.
- `pnpm drift:check` — lists Figma components not yet mapped in `@wts/ui`.

