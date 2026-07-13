import type { FlowGraph, PrototypeManifest } from '@wts/prototype-kit'

import flow from './flow.generated.json'

/**
 * Pure-data description of the Organisations prototype for the gallery Flow canvas.
 *
 * The prototype encodes every distinct screen / dialog / state in the URL hash
 * (see src/store/useOrgStore.ts), so each node in `flow.generated.json` is a real,
 * addressable state the canvas renders in a live iframe. Lanes group the journey;
 * columns order it. The flow lives in the JSON so `pnpm snapshots` can enumerate it.
 *
 * Representative data (default "mixed" dataset):
 *   • EUROPIPE   → fully populated org (entities, engagements, users, groups)
 *   • Provinzial → freshly created org → empty states
 */
const manifest: PrototypeManifest = {
  id: 'organisations',
  title: 'Organisations Management',
  description:
    'Manage organisations, legal entities, engagements, and user access across the platform. Role-based UI for Super Admin, Organisation Admin, Engagement Admin, and Contributor.',
  basePath: '/prototypes/organisations/',
  defaultHash: 'super-admin',
  figmaFileKey: 'aUrc5icpKpWwChJJptZoOX',
  flow: flow as FlowGraph,
}

export default manifest
