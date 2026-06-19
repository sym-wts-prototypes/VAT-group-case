# PRD: CIT Process Extension — Assessment & Closure

> Status: Prototype documented (clickable React prototype in this repo).
> Process scope: Corporate Income Tax (CIT). Cross-process banner work also covers HR and VAT.
> Author: WTS Platform team · Last updated: 15 Jun 2026

## Summary

The CIT filing process today effectively ends at **Submission**. But for Corporate Income Tax, the substantive work continues for weeks to months *after* submission: tax authorities issue **assessments** (federal first, then each municipality), and each assessment opens its own **four-week objection window**. There is currently no structured, role-aware way to track incoming assessments, run a two-person (maker/checker) internal review, manage objections against hard deadlines, deliver clean documents to the client, and formally close the case.

This extension adds a new **Assessment & Closure** phase to the CIT process. It gives the **Creator** an interactive workspace to log arrived assessments, propose Approve/Object decisions, upload client-ready ("no yellow pages") copies, and manage objection deadlines; gives the **Reviewer** a confirm/return control; gives the **Partner** read-only oversight; and gives the **Client** a clean, read-only view of their assessments, the data package, and the submission receipt. The case can only be closed once every assessment is resolved.

## Problem

- After submission, CIT assessments arrive unpredictably over **weeks to months**, each with an independent **4-week objection window**. Missing a window means the assessment becomes **final** and the client must pay the assessed tax — even if it is wrong.
- There is no shared, structured tracker for assessment status, so deadlines are managed ad hoc and are easy to miss.
- Review is informal: there is no consistent maker/checker control before a decision (approve vs. object) is finalized.
- Internal working documents contain "yellow pages" (internal annotations) that must **not** reach the client, but there is no clean separation of internal vs. client-facing copies.
- Clients lack visibility: they cannot see assessment status, the final data package, or the submission receipt in one place, generating support load and uncertainty.
- There is no explicit, gated "close the case" step, so cases linger in an ambiguous state.

## Goals

- Make every assessment's status and **objection deadline** visible and hard to miss for the responsible Creator.
- Enforce a lightweight **maker/checker** flow: Creator proposes, Reviewer confirms or returns with a reason.
- Cleanly separate **internal** documents from **client-facing** documents so clients only ever receive the clean copy.
- Give the Client a trustworthy, read-only view of their assessments, data package, and submission receipt.
- Provide a clear, **gated closure** that is only possible once all assessments are resolved.
- Keep the experience consistent with existing WTS platform patterns and Figma designs across roles and processes.

## Success Metrics

- **Missed objection windows**: reduce missed-window incidents toward 0 (primary risk metric).
- **Deadline adherence**: % of objection windows actioned (object or approve) before expiry.
- **Cycle time**: median time from "assessment received" → "resolved".
- **Review quality**: reviewer **return rate** (proposals sent back) trends down as the flow matures.
- **Client self-service**: reduction in client support contacts asking about assessment status / documents.
- **Closure throughput**: median time from "last assessment resolved" → "case closed".
- **Document hygiene**: 0 incidents of an internal ("yellow pages") copy being exposed to a client.

## Users and Key Scenarios

**Roles**
- **Creator** (WTS preparer): interactive owner of the phase.
- **Reviewer** (WTS): confirms or returns the Creator's proposals.
- **Partner** (WTS): read-only oversight.
- **Client**: read-only, restricted view.

**Key scenarios**
1. *Assessment arrives* — Creator adds an item (Federal or Municipal, authority/municipality, date received, original assessment file). The item appears under its group as **Arrived** with an objection-window day counter.
2. *Approve a correct assessment* — Creator opens **Approve**, confirms it matches the working sheet, optionally **flags an issue to carry into next year**, and uploads the clean ("no yellow pages") copy for the client. Item moves to **Under review** as "Proposed: Approve".
3. *Object to an incorrect assessment* — Creator opens **Object**, uploads the clean copy, and the item becomes "Proposed: Object". A confirmed objection creates an internal **objection case** (OBJ_ID) tracked separately.
4. *Reviewer confirms* — Reviewer sees the proposal and either **Confirms** (resolves the item: Approved or Objection created) or **Returns** it with a required reason that is stored as an item comment thread.
5. *Creator recalls / responds to a return* — Creator can **Recall** a proposal, or address a return and re-submit; the returned marker clears while comment history persists.
6. *Objection window expires* — If an objection's window lapses unhandled, the item is shown as **final** with a red accent and a message that the client must pay the assessed tax.
7. *Client checks status* — Client sees the data package banner, the downloadable **submission receipt**, and their assessments (clean copies only) in **Arrived** or **Resolved** states.
8. *Close the case* — Once **all** assessments are resolved, the Creator can **Close case** (the action is disabled until then).

## Scope

### In Scope

- New **Assessment & Closure** phase added to the CIT stepper and the demo control panel.
- **Data Package** banner and a **Submission receipt** download card at the top of the phase.
- **Assessment items** list: grouped **Federal / Municipal**; segmented tabs **All / Arrived / Under review / Resolved** with live counts; search; **Add Item**; **Remove item** (confirmation dialog); expandable cards showing notes and files.
- **Item lifecycle**: Arrived → Under review (Creator proposes Approve/Object) → Resolved (Reviewer confirms). **Recall** and **Return** (with required reason) supported.
- **Approve dialog**: confirm match + optional "flag an issue for next year" (conditional note) + upload of the clean ("no yellow pages") copy.
- **Objection dialog**: single clean-copy upload; produces an internal **Objection created / OBJ_ID** status with an explanatory tooltip.
- **Objection window**: four weeks from the received date, with color tones (fresh/blue, ≤2 weeks/amber, ≤1 week/red, elapsed/missed). Active objections show a day counter; an **expired, unhandled** objection shows a red "window closed — assessment is final" message and red accent.
- **Return comments**: amber "Returned by {Reviewer}" pill opening a read-only comment thread; non-returned items with comments show an icon + count.
- **File lifecycle**: original tax assessment on arrival; the clean (no yellow pages) client copy added on approve/object.
- **Role-based rendering**: Creator interactive; Reviewer confirm/return; Partner read-only; **Client** read-only and filtered (clean copy only, Arrived + Resolved states, always-shown Federal/Municipal groups with empty placeholders).
- **Gated closure**: **Close case** disabled until all assessments are resolved.
- **Cross-process package banners** for the client during **Client Approval** and **Submission** phases (CIT, HR, VAT), including reviewer/client "needs changes" and "approved" states.
- Supporting polish: collapsed-sidebar hover tooltips; CIT-specific preparation task list.

### Out of Scope

- Real integration with tax-authority systems and **actual e-filing** of objections.
- Production authentication, authorization, and role management (roles are demo toggles).
- Automated document generation, OCR, or automated "yellow pages" removal.
- Notifications, email, or reminders for upcoming objection deadlines.
- The full assessment phase for **HR and VAT** (only the cross-process *banners* are in scope here).
- Server-side persistence (the prototype uses an in-memory store; no data is saved).
- Full localization beyond the existing English scaffolding.

## Requirements

### Functional Requirements

1. The CIT process must expose an **Assessment & Closure** phase selectable from the stepper and demo controls.
2. The phase must render a **Data Package** banner and a downloadable **Submission receipt** card at the top, for all roles that can view the phase.
3. Assessment items must be grouped into **Federal** and **Municipal**, and filterable via **All / Arrived / Under review / Resolved** tabs that display live counts; empty tabs are disabled.
4. The Creator must be able to **Add** an assessment item (level, authority/municipality, date received, single original-assessment file) and **Remove** an item via a confirmation dialog.
5. Each non-resolved item must display an **objection-window** badge computed as four weeks from the received date, with tone transitions (blue → amber ≤14d → red ≤7d → missed when elapsed); when the window is missed, the **Object** action is disabled.
6. The Creator's **Approve** action must open a dialog that requires confirming the match, optionally flagging an issue (revealing a required note), and uploading the clean client copy; on submit the item moves to **Under review** as "Proposed: Approve".
7. The Creator's **Object** action must open a dialog requiring the clean client copy; on submit the item moves to **Under review** as "Proposed: Object".
8. The Reviewer must be able to **Confirm** a proposal (resolving it to **Approved** or **Objection created / OBJ_ID**) or **Return** it with a **required reason**.
9. Returns must store a comment as `{ author, role, text, time, type }` in an item-level thread; returned items show an amber accent and a tappable "Returned by {Reviewer}" pill opening a read-only popover; the returned marker clears on re-submit while history persists.
10. The Creator must be able to **Recall** a pending proposal, reverting the item to Arrived.
11. A resolved **objection** must display a day-counter badge while active (no resolved check, no left accent); an **expired, unhandled** objection must display a red left accent and a "Objection window closed — assessment is final; client must pay the assessed tax" message, with item content shown beneath that message when expanded.
12. Files must follow the lifecycle: **original** assessment on arrival; **+ clean (no yellow pages)** copy on approve/object.
13. The **Client** view must be read-only and must: show only the clean copy (never the original/internal file); present internally "under review" items as **Arrived** and resolved items in their resolved state; always show Federal and Municipal groups (with an empty-state placeholder); hide internal review affordances (returns, comment threads, amber accent).
14. The **Close case** action must be disabled until **every** assessment is resolved.
15. During **Client Approval** and **Submission** phases, the client must see the appropriate **package banner** for CIT, HR, and VAT, including "needs changes" and "approved" states; the "before sending for client approval" reconfirm banner must show only to the Creator.

### Non-Functional Requirements

- **Accessibility**: interactive elements expose appropriate roles and ARIA (`aria-label`, `aria-expanded`, `aria-current`, `aria-pressed`); keyboard operable; dialogs focus the primary action.
- **Visual consistency**: right-side badges and action buttons standardize to a 32px (`h-8`) height; styling uses existing design tokens and Tailwind utilities, matching the referenced Figma designs.
- **Performance**: list filtering, counts, and window calculations must be derived efficiently (memoized) and remain responsive for the expected item volume (tens of items per case).
- **Build quality**: the project must pass `tsc -b && vite build` with TypeScript strict mode and no type errors.
- **Deployability**: the app must deploy to Cloudflare Workers via `wrangler deploy`.
- **Maintainability**: shared UI (e.g., file dropzone, comment thread, badges) implemented as reusable components.

## Dependencies and Constraints

- **Tech stack**: React 18, Vite 5, TypeScript (strict), Tailwind CSS, Radix UI, Zustand (in-memory demo store), lucide-react icons.
- **Hosting**: Cloudflare Workers via Wrangler (`npm run deploy`).
- **Design source of truth**: WTS Figma files (assessment phase, objection/approve dialogs, upload component states, package banners, sidebar tooltips, submission receipt card).
- **Prototype constraint**: no backend — state is in-memory and role/phase/state are driven by demo controls (and the URL hash, e.g. `#cit/creator/case/assessmentClosure`).
- **Domain constraint**: the statutory objection window is four weeks from the assessment's received date; this is modeled client-side.

## Risks and Assumptions

- **Assumption**: the objection-window day counter currently derives from the *received* date (4 weeks). A real objection case may run on its own handling window distinct from the received-based window. *(See Open Questions.)*
- **Assumption**: clients should never see the internal/original file; only the clean "no yellow pages" copy is client-facing.
- **Assumption**: internally "under review" items should appear to the client as **Arrived** until resolved.
- **Risk**: if objection deadlines are only surfaced in-app (no notifications), users could still miss them. Reminders are out of scope for this iteration.
- **Risk**: OBJ_IDs are illustrative in the prototype; real objection-case creation/linking is not implemented.
- **Risk**: because state is in-memory, demo states reset on reload; not suitable for real case data.

## Delivery Notes

- Delivered incrementally as a clickable prototype; the **Assessment & Closure** phase, role-based rendering, objection/approve flows, return comments, file lifecycle, client read-only view, and cross-process package banners are implemented.
- Demo controls drive Process (CIT/HR/VAT), Role (Creator/Reviewer/Partner/Client), Header type, Phase, and an **Assessments** state (No Items / Arrived / Mixed / Done) to exercise the UI.
- Key implementation areas: `AssessmentClosureSection`, `Approve/Objection/Return/AddItem/RemoveItem` dialogs, `FileDropzone`, `CommentsThread`, package banner config, CIT task list.

## Acceptance Criteria

- [ ] Selecting **Assessment & Closure** for CIT renders the data package banner, submission-receipt card, grouped assessment list, and working tabs with correct counts. *(Req 1–3)*
- [ ] A Creator can add and remove assessment items; new items appear under the correct group as **Arrived** with an objection-window badge. *(Req 4–5)*
- [ ] When an item's objection window is elapsed, the **Object** action is disabled and the badge shows the "missed" state. *(Req 5)*
- [ ] **Approve** requires match confirmation, supports an optional flag-with-note, requires the clean copy, and moves the item to **Under review / Proposed: Approve**. *(Req 6)*
- [ ] **Object** requires the clean copy and moves the item to **Under review / Proposed: Object**. *(Req 7)*
- [ ] A Reviewer can **Confirm** (→ Approved or Objection created / OBJ_ID) or **Return** with a mandatory reason; returned items show the amber pill and a read-only thread, and the marker clears on re-submit. *(Req 8–9)*
- [ ] A Creator can **Recall** a pending proposal back to Arrived. *(Req 10)*
- [ ] An **active** resolved objection shows a day-counter badge and no left accent; an **expired, unhandled** objection shows the red accent and "window closed / client must pay" message, with content beneath it when expanded. *(Req 11)*
- [ ] Files accrue correctly (original on arrival; + clean copy on approve/object). *(Req 12)*
- [ ] The **Client** view shows only the clean copy, presents under-review items as Arrived, always shows both groups (with empty placeholders), and hides internal review affordances. *(Req 13)*
- [ ] **Close case** is disabled until all assessments are resolved and enabled once they are. *(Req 14)*
- [ ] The client sees the correct package banners (incl. needs-changes/approved) in Client Approval and Submission, and the reconfirm banner shows only to the Creator. *(Req 15)*
- [ ] `tsc -b && vite build` passes and the app deploys to Cloudflare. *(NFRs)*

## Open Questions

- Should the objection **timer** track the statutory 4-week window from the received date, or a separate **objection-case handling deadline** once an objection is created? (Affects Req 5 / 11.)
- For an expired objection, who confirms it was genuinely "not handled on the outside case" — is that status pushed from an external objection-case system?
- Should clients with an item that has **no clean copy yet** see an Arrived row with no document, or should the row be hidden until a client-facing file exists?
- Do **HR** and **VAT** need their own full assessment phases, or only the package banners delivered here?
- Are **objection deadline reminders/notifications** needed before this ships to real users?
- What are the data-retention and audit requirements for the comment thread and document history once this moves beyond a prototype?
