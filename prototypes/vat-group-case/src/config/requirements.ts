/** Shared requirement categories (WTS list) ↔ client buckets. */

export type RequirementItemCheckState = 'done' | 'open'

export type RequirementItem = {
  id: string
  title: string
  description: string
  /** Post-draft list — Figma ItemMarking (Done vs Open). */
  checkState?: RequirementItemCheckState
  /** The file the client uploaded for this specific requirement, if any — backs the per-row
   *  download button and the category's "Files" switcher view (which is just every item's
   *  file, flattened — no separate file list to keep in sync). */
  file?: { name: string; size: string }
}

export type RequirementCategoryStatus = 'In Progress' | 'Not started' | 'Done'

/** Requirements List comment notifications ticket — one entry in a category's Comments side
 * drawer (see CommentsDrawer.tsx / RequirementListAccordion.tsx). `isNew` marks it unseen —
 * cleared the first time that category's drawer is opened (see RequirementListAccordion's
 * `seenCategoryIds`), never re-set afterwards. */
export type RequirementComment = {
  id: string
  author: string
  timestamp: string
  text: string
  isNew?: boolean
  /** Typed locally this session (see CommentsDrawer's chat composer) rather than seeded dummy
   * data — rendered as an outgoing/"sent" chat bubble instead of an incoming one. */
  isOwn?: boolean
}

export type RequirementCategory = {
  id: string
  title: string
  items: RequirementItem[]
  /** Post-draft category header — files in subtitle. */
  filesUploaded?: number
  status?: RequirementCategoryStatus
  /** Dummy comment thread for this category's side drawer — distinct per category so they're
   * distinguishable; only category one starts with an unseen (`isNew`) comment. */
  comments?: RequirementComment[]
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
        file: { name: 'Requirement_1_Support.pdf', size: '1.2 MB' },
      },
      {
        id: 'ID1002',
        title: 'Requirement 2',
        description: 'Requirement description',
        checkState: 'open',
        file: { name: 'Requirement_2_Evidence.xlsx', size: '840 KB' },
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
    comments: [
      {
        id: 'CMT1001',
        author: 'Maria Fischer',
        timestamp: '3 days ago',
        text: 'Could you confirm the VAT registration number shown on Requirement 2 before we finalize?',
      },
      {
        id: 'CMT1002',
        author: 'Jordan Miller',
        timestamp: 'Just now',
        text: 'Uploaded the missing invoice for Requirement 1 — let me know if this covers it.',
        isNew: true,
      },
    ],
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
    // Feature 2c's "9+ rule" demo — 11 already-read comments, none new.
    comments: [
      { id: 'CMT2001', author: 'Oscar Wilson', timestamp: '3 weeks ago', text: 'Kicking off this category — client documentation still pending for both items.' },
      { id: 'CMT2002', author: 'Lucas Brown', timestamp: '3 weeks ago', text: 'Following up with the client on Requirement 1.' },
      { id: 'CMT2003', author: 'Noah Davis', timestamp: '2 weeks ago', text: 'Client confirmed they will send the documents by Friday.' },
      { id: 'CMT2004', author: 'Olivia Taylor', timestamp: '2 weeks ago', text: 'Still nothing received — following up again.' },
      { id: 'CMT2005', author: 'Emma Johnson', timestamp: '2 weeks ago', text: 'Requirement 2 documentation looks like it might not apply this period.' },
      { id: 'CMT2006', author: 'Sophie Martin', timestamp: '1 week ago', text: 'Confirmed with the client — Requirement 2 does apply this period.' },
      { id: 'CMT2007', author: 'Oscar Wilson', timestamp: '1 week ago', text: 'Thanks — flagging both requirements as still open for now.' },
      { id: 'CMT2008', author: 'Jordan Miller', timestamp: '6 days ago', text: 'Any update on the outstanding documents?' },
      { id: 'CMT2009', author: 'Lucas Brown', timestamp: '4 days ago', text: 'Client says the documents are being prepared.' },
      { id: 'CMT2010', author: 'Noah Davis', timestamp: '2 days ago', text: 'Reminder sent to the client again today.' },
      { id: 'CMT2011', author: 'Olivia Taylor', timestamp: 'Yesterday', text: 'No response yet — will escalate if nothing by end of week.' },
    ],
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
