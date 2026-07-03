import type { PrototypeManifest } from '@wts/prototype-kit'

/**
 * Pure-data description of the Organisations prototype for the gallery.
 * The new prototype maps role + selected-org to the URL hash so each
 * (role, orgId?) combo is a discoverable screen on the flow canvas.
 */
const manifest: PrototypeManifest = {
  id: 'organisations',
  title: 'Organisations Management',
  description:
    'Manage organisations, legal entities, engagements, and user access across the platform. Role-based UI for Super Admin, Admin, and User.',
  basePath: '/prototypes/organisations/',
  defaultHash: 'super-admin',
  figmaFileKey: 'aUrc5icpKpWwChJJptZoOX',
  flow: {
    screens: [
      {
        id: 'super-admin',
        label: 'Super Admin · Organisations',
        hash: 'super-admin',
        lane: 'Super Admin',
        col: 0,
        meta: { role: 'Super Admin' },
      },
      {
        id: 'admin',
        label: 'Admin · Organisations',
        hash: 'admin',
        lane: 'Admin',
        col: 0,
        meta: { role: 'Admin' },
      },
      {
        id: 'user',
        label: 'User · Organisations',
        hash: 'user',
        lane: 'User',
        col: 0,
        meta: { role: 'User' },
      },
    ],
    edges: [],
  },
}

export default manifest
