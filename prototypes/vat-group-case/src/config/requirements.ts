/** Shared requirement categories (WTS list) ↔ client buckets. */

export type RequirementItemCheckState = 'done' | 'open'

/** CIT AI file-matcher simulation — how confident the (simulated) match is. Only two states are
 *  demoed, matching the reference screenshots (green "high" / yellow "medium"). */
export type FileConfidence = 'high' | 'medium'

export type SimulatedFile = { name: string; size: string }

export type MatchedFile = SimulatedFile & { confidence: FileConfidence }

export type RequirementItem = {
  id: string
  title: string
  description: string
  /** Post-draft list — Figma ItemMarking (Done vs Open). */
  checkState?: RequirementItemCheckState
  /** A file already attached to this specific requirement outside of AI matching (e.g. VAT's
   *  preset categories, which never run the matcher) — shown as a plain chip, no confidence. */
  file?: { name: string; size: string }
  /** CIT AI file-matcher simulation — files the matcher sorted into this requirement, each with
   *  its own simulated confidence. Populated reactively by useRequirementsStore's
   *  `matchedFilesByItem` (see `runAiFileMatching`), never set directly here. */
  matchedFiles?: MatchedFile[]
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
  status?: RequirementCategoryStatus
  /** Dummy comment thread for this category's side drawer — distinct per category so they're
   * distinguishable; only category one starts with an unseen (`isNew`) comment. */
  comments?: RequirementComment[]
  /** CIT AI file-matcher simulation — every file "uploaded" for this category before it's been
   *  sorted into a specific requirement. Everything here starts out unmatched; running the
   *  matcher (see `aiMatchAssignments`) moves a subset onto specific items, the rest stays in
   *  this category's unmatched pool (see useRequirementsStore's `useUnmatchedFiles`). */
  aiMatchPool?: SimulatedFile[]
  /** CIT AI file-matcher simulation — the deterministic demo "result" of running the matcher:
   *  which of `aiMatchPool`'s files land on which requirement item, and at what confidence.
   *  Anything in `aiMatchPool` not listed under any item here stays unmatched. */
  aiMatchAssignments?: Record<string, MatchedFile[]>
}

// CIT AI file-matcher simulation ticket — 4 categories, deliberately laid out top-to-bottom
// (array order = render order) to demo every state the matcher can leave a category in:
//   1. category-1 (top)    — has files, but the matcher never finds a home for any of them.
//   2. category-2 (middle) — the matcher's "medium confidence" (yellow) demo.
//   3. category-3 (middle) — the matcher's "high confidence" (green) demo.
//   4. category-4 (bottom) — no files at all, and its item is never checked.
// Every item also carries a plain `file` (except category-4's) — VAT/HR's "preset" attachment,
// shown as-is with no matching UI; CIT ignores `file` entirely and only ever shows
// `matchedFiles`/`aiMatchPool` (see RequirementListAccordion's `process` gating).
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
        checkState: 'done',
        file: { name: 'Requirement_2_Evidence.xlsx', size: '840 KB' },
      },
    ],
    status: 'Done',
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
    // Files exist for this category, but the deterministic demo "match result" (no
    // aiMatchAssignments entries) never sorts any of them onto a requirement — this is the
    // "top category with no files matched to it" case.
    aiMatchPool: [
      { name: 'file_name_01.pdf', size: '210 KB' },
      { name: 'file_name_02.xlsx', size: '1.1 MB' },
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
        checkState: 'done',
        file: { name: 'Requirement_3_Support.pdf', size: '900 KB' },
      },
      {
        id: 'ID2002',
        title: 'Requirement 2',
        description: 'Requirement description',
        checkState: 'done',
        file: { name: 'Requirement_4_Evidence.xlsx', size: '610 KB' },
      },
    ],
    status: 'Done',
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
    // Mixed-confidence demo — 7 pool files total, 3 land on ID2001 (2 'high' + 1 'medium' —
    // still an overall "Medium confidence" badge per `overallConfidence`'s weakest-link rule),
    // the other 4 stay unmatched even after running. Subtitle/"All files" counts must always
    // sum back to exactly 7 (see `filesUploadedCount` in RequirementListAccordion.tsx).
    aiMatchPool: [
      { name: 'file_name_03.pdf', size: '180 KB' },
      { name: 'file_name_04.xlsx', size: '520 KB' },
      { name: 'file_name_05.pdf', size: '300 KB' },
      { name: 'file_name_06.xlsx', size: '260 KB' },
      { name: 'file_name_11.pdf', size: '340 KB' },
      { name: 'file_name_12.xlsx', size: '410 KB' },
      { name: 'file_name_13.pdf', size: '155 KB' },
    ],
    aiMatchAssignments: {
      ID2001: [
        { name: 'file_name_03.pdf', size: '180 KB', confidence: 'high' },
        { name: 'file_name_04.xlsx', size: '520 KB', confidence: 'high' },
        { name: 'file_name_05.pdf', size: '300 KB', confidence: 'medium' },
      ],
    },
  },
  {
    id: 'category-3',
    title: 'Category 3',
    items: [
      {
        id: 'ID3001',
        title: 'Requirement 1',
        description: 'Requirement description',
        checkState: 'done',
        file: { name: 'Requirement_5_Support.pdf', size: '1.4 MB' },
      },
      {
        id: 'ID3002',
        title: 'Requirement 2',
        description: 'Requirement description',
        checkState: 'done',
        file: { name: 'Requirement_6_Evidence.xlsx', size: '720 KB' },
      },
    ],
    status: 'Done',
    comments: [
      {
        id: 'CMT3001',
        author: 'Sophie Martin',
        timestamp: '2 days ago',
        text: 'All documentation for this category looks complete.',
      },
    ],
    // High-confidence (green) demo — 3 of the 4 pool files land on ID3001, all 'high'; 1 stays
    // unmatched even after running.
    aiMatchPool: [
      { name: 'file_name_07.pdf', size: '410 KB' },
      { name: 'file_name_08.xlsx', size: '150 KB' },
      { name: 'file_name_09.pdf', size: '990 KB' },
      { name: 'file_name_10.xlsx', size: '230 KB' },
    ],
    aiMatchAssignments: {
      ID3001: [
        { name: 'file_name_07.pdf', size: '410 KB', confidence: 'high' },
        { name: 'file_name_08.xlsx', size: '150 KB', confidence: 'high' },
        { name: 'file_name_09.pdf', size: '990 KB', confidence: 'high' },
      ],
    },
  },
  {
    id: 'category-4',
    title: 'Category 4',
    items: [
      {
        id: 'ID4001',
        title: 'Requirement 1',
        description: 'Requirement description',
        checkState: 'open',
      },
    ],
    status: 'Not started',
    comments: [],
    // No aiMatchPool at all — this is the "no files, never checked" bottom category.
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
