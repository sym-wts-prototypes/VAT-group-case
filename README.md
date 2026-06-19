# WTS Prototype Platform

A monorepo that hosts a shared component library (with Storybook), a
password-gated **gallery** of interactive prototypes, and per-prototype **screen
access** + a **flow canvas**. Deployed to Cloudflare behind a single password.

> Phase 1 (foundation) is implemented. Phase 2 (full flow-canvas enumeration +
> synced snapshots) and Phase 3 (Figma round-trip) are planned — see
> `.claude/plans/`.

## Layout

```
packages/ui              @wts/ui — ShadCN primitives + Tailwind preset + tokens + Storybook
packages/prototype-kit   @wts/prototype-kit — PrototypeManifest / FlowGraph types
apps/gallery             @wts/gallery — host SPA: index, screen access, flow canvas
prototypes/<id>          one app per prototype (independent Vite build)
worker                   Cloudflare Worker password gate; serves the assembled site
scripts/                 assemble-dist.mjs (deploy tree), new-prototype.mjs (scaffold)
```

The gallery renders prototype screens in **iframes** (`/prototypes/<id>/#<hash>`),
so the canvas shows real, live screens. Each prototype ships a pure-data
`src/manifest.ts` that the gallery auto-discovers via a Vite glob.

## Develop

```bash
pnpm install
pnpm build           # build ui+storybook, every prototype, and the gallery
pnpm gallery         # gallery dev server (run `pnpm build` once so iframes resolve)
pnpm storybook       # component library at :6006
```

Full integrated preview (gallery + prototypes + storybook + auth) via the worker:

```bash
cp worker/.dev.vars.example worker/.dev.vars   # set SITE_PASSWORD + AUTH_SECRET
pnpm build && pnpm assemble && pnpm preview     # http://localhost:8787
```

## Add a prototype (it shows up automatically)

```bash
pnpm gen:prototype my-idea
pnpm install
```

Build it on a branch, open a PR, merge to `main` → CI builds and deploys, and it
appears in the gallery. No edits to the gallery are needed — discovery is driven
by `prototypes/*/src/manifest.ts`.

## Auth

The Worker (`worker/src/index.ts`) gates **every path** with a single universal
password. A correct password sets an HMAC-signed, HttpOnly cookie. Secrets:

```bash
cd worker
wrangler secret put SITE_PASSWORD
wrangler secret put AUTH_SECRET      # long random string used to sign the cookie
```

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) builds + assembles + deploys the
worker on push to `main`. Configure repo secrets `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`. Runtime secrets are set with `wrangler secret put` (not
in CI).
