/**
 * Shared, reactive completion state for the Requirements List (WTS) and Requirement Bucket
 * (Client) views — both render the same underlying REQUIREMENT_CATEGORIES data through two
 * different components, so per-item "done" state and any simulated additions have to live here
 * rather than in either view's own local state, or checking an item as a client wouldn't move
 * the WTS side's progress bar (and vice versa).
 */

import { create } from 'zustand'

import {
  REQUIREMENT_CATEGORIES,
  type RequirementCategory,
  type RequirementComment,
  type RequirementItem,
} from '@/config/requirements'

interface RequirementsState {
  /** Per-item done/open override, keyed by RequirementItem.id. Absent = fall back to the
   *  item's own static `checkState` default from requirements.ts. */
  checkedOverrides: Record<string, boolean>
  /** Items appended by the "simulate adding a requirement" action, keyed by category id. */
  addedItems: Record<string, RequirementItem[]>
  /** How many of a category's original (static) trailing items are hidden by "simulate
   *  removing a requirement" — only used once there's nothing simulated left to un-add. */
  removedCount: Record<string, number>
  toggleItem: (itemId: string, defaultDone: boolean) => void
  addSimulatedRequirement: (categoryId: string) => void
  /** Symmetric with add: undoes the most recently simulated addition first; once none remain,
   *  hides the category's own last original item instead. No-op once nothing is left to remove. */
  removeSimulatedRequirement: (categoryId: string) => void
  /** Requirements comment notifications ticket — lives here (not in either view's own local
   *  state) so the WTS Requirements List and the Client's Requirement Bucket cards share one
   *  comment thread per category: reading a new comment from either side clears it for both,
   *  same reasoning as `checkedOverrides` above. In-memory only, per the "temporary for the
   *  session" ask — a typed comment doesn't survive a reload. */
  categoryComments: Record<string, RequirementComment[]>
  /** Categories whose unseen comment has been shown at least once (see CommentsDrawer's
   *  onRead) — clears that category's red "new" badge in both views. */
  seenCategoryIds: Record<string, true>
  sendComment: (categoryId: string, author: string, text: string) => void
  markCategorySeen: (categoryId: string) => void
}

let simulatedItemCount = 0

export const useRequirementsStore = create<RequirementsState>((set) => ({
  checkedOverrides: {},
  addedItems: {},
  removedCount: {},
  categoryComments: Object.fromEntries(REQUIREMENT_CATEGORIES.map((c) => [c.id, c.comments ?? []])),
  seenCategoryIds: {},
  toggleItem: (itemId, defaultDone) =>
    set((state) => {
      const current = state.checkedOverrides[itemId] ?? defaultDone
      return { checkedOverrides: { ...state.checkedOverrides, [itemId]: !current } }
    }),
  addSimulatedRequirement: (categoryId) => {
    simulatedItemCount += 1
    const n = simulatedItemCount
    set((state) => ({
      addedItems: {
        ...state.addedItems,
        [categoryId]: [
          ...(state.addedItems[categoryId] ?? []),
          {
            id: `IDsim${n}`,
            title: `New requirement ${n}`,
            description: 'Added just now — not yet complete.',
            checkState: 'open',
          },
        ],
      },
    }))
  },
  removeSimulatedRequirement: (categoryId) =>
    set((state) => {
      const added = state.addedItems[categoryId] ?? []
      if (added.length > 0) {
        return { addedItems: { ...state.addedItems, [categoryId]: added.slice(0, -1) } }
      }
      const base = REQUIREMENT_CATEGORIES.find((c) => c.id === categoryId)
      const hidden = state.removedCount[categoryId] ?? 0
      if (!base || hidden >= base.items.length) return {}
      return { removedCount: { ...state.removedCount, [categoryId]: hidden + 1 } }
    }),
  sendComment: (categoryId, author, text) =>
    set((state) => ({
      categoryComments: {
        ...state.categoryComments,
        [categoryId]: [
          ...(state.categoryComments[categoryId] ?? []),
          { id: `local-${categoryId}-${(state.categoryComments[categoryId] ?? []).length}`, author, timestamp: 'Just now', text, isOwn: true },
        ],
      },
    })),
  markCategorySeen: (categoryId) =>
    set((state) => ({ seenCategoryIds: { ...state.seenCategoryIds, [categoryId]: true } })),
}))

/** Requirements comment notifications ticket — a category's comment thread + whether it still
 *  has an unseen new one, reactive and shared between the WTS Requirements List and the
 *  Client's Requirement Bucket cards (see `categoryComments`/`seenCategoryIds` above). */
export function useCommentsForCategory(categoryId: string): {
  comments: RequirementComment[]
  hasUnseen: boolean
} {
  const comments = useRequirementsStore((s) => s.categoryComments[categoryId] ?? [])
  const seen = useRequirementsStore((s) => Boolean(s.seenCategoryIds[categoryId]))
  return { comments, hasUnseen: !seen && comments.some((c) => c.isNew) }
}

/** The single source both the WTS and Client views render from — base demo data plus any
 *  simulated additions/removals, with each item's effective checkState resolved against
 *  overrides. */
export function useRequirementCategories(): RequirementCategory[] {
  const checkedOverrides = useRequirementsStore((s) => s.checkedOverrides)
  const addedItems = useRequirementsStore((s) => s.addedItems)
  const removedCount = useRequirementsStore((s) => s.removedCount)

  return REQUIREMENT_CATEGORIES.map((category) => {
    const hidden = removedCount[category.id] ?? 0
    const baseItems =
      hidden > 0 ? category.items.slice(0, Math.max(0, category.items.length - hidden)) : category.items
    const items = [...baseItems, ...(addedItems[category.id] ?? [])].map((item) => {
      const override = checkedOverrides[item.id]
      if (override === undefined) return item
      return { ...item, checkState: override ? ('done' as const) : ('open' as const) }
    })
    return { ...category, items }
  })
}

export function requirementTotals(categories: RequirementCategory[]): {
  done: number
  total: number
} {
  const items = categories.flatMap((c) => c.items)
  return { done: items.filter((i) => i.checkState === 'done').length, total: items.length }
}
