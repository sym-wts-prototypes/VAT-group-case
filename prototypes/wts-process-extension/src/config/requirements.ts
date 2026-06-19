/** Shared requirement categories (WTS list) ↔ client buckets. */

export type RequirementItemCheckState = 'done' | 'open'

export type RequirementItem = {
  id: string
  title: string
  description: string
  /** Post-draft list — Figma ItemMarking (Done vs Open). */
  checkState?: RequirementItemCheckState
}

export type RequirementCategoryStatus = 'In Progress' | 'Not started' | 'Done'

export type RequirementCategory = {
  id: string
  title: string
  items: RequirementItem[]
  /** Post-draft category header — files in subtitle. */
  filesUploaded?: number
  status?: RequirementCategoryStatus
}

export const REQUIREMENT_CATEGORIES: RequirementCategory[] = [
  {
    id: 'category-1',
    title: 'Category 1',
    items: [
      {
        id: 'ID1001',
        title: 'Requirement 1',
        description: 'Requirement description',
        checkState: 'done',
      },
      {
        id: 'ID1002',
        title: 'Requirement 2',
        description: 'Requirement description',
        checkState: 'open',
      },
      {
        id: 'ID1003',
        title: 'Requirement 3',
        description: 'Requirement description',
        checkState: 'open',
      },
    ],
    filesUploaded: 2,
    status: 'In Progress',
  },
  {
    id: 'category-2',
    title: 'Category 2',
    items: [
      {
        id: 'ID2001',
        title: 'Requirement 1',
        description: 'Requirement description',
        checkState: 'open',
      },
      {
        id: 'ID2002',
        title: 'Requirement 2',
        description: 'Requirement description',
        checkState: 'open',
      },
    ],
    filesUploaded: 0,
    status: 'Not started',
  },
]

export const DEFAULT_REQUIREMENT_CATEGORY_ID = REQUIREMENT_CATEGORIES[0].id

export function getRequirementCategory(
  id: string,
): RequirementCategory | undefined {
  return REQUIREMENT_CATEGORIES.find((c) => c.id === id)
}

/** Client case cards — one bucket per WTS category. */
export const CLIENT_BUCKET_CARDS = REQUIREMENT_CATEGORIES.map((cat, index) => ({
  categoryId: cat.id,
  title: cat.title,
  items: cat.items.length,
  files: index === 0 ? 2 : 0,
  status: (index === 0 ? 'In Progress' : 'Not started') as
    | 'Done'
    | 'In Progress'
    | 'Not started',
}))
