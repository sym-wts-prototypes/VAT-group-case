- For table content, define minimal width to not brake the column structure. Introduce horizontal scrolling per table if the minimum column width is exceeded.
- Make all tables action sections a 3-dot menu and move actions in 3 dot menu dropdown
- Fix the issue where the last row dropdown is hidden below the table container
- When Assigning the user on Engagement add search field so user can be found easily
- Add Ability to delete groups
- Add confirmation dialog when selecting new representative or removing the member
- If member is removed move them to inactive members section as past meber
- Activity log should have previous and current state columns for change that happend
- Organisation details page, Organisation Information and Metadata sections should be same height aligned with one that has more content.
- Dont let Organisation Admin to add users to Engagements, and dont let Engagement Admin to add users to Organisation or Entity level
  
 Ten items. Let me batch them into tasks and start executing:

Used 2 tools

Acknowledged — Figma tools not needed for this task. Continuing task setup:

Used 7 tools

Start with V11-A — split user.invite:

Edited a file, read a file, used a tool

Now update `OrgWorkspace` caps to reflect the split:

Ran a command, read a file, edited a file

Acknowledged — will run the verification workflow at the end. Continuing:

Editedorg-workspace.tsx+3-1

Now the three prop passes need to swap to the right variant:

Read a file, edited a file, used a tool

Now V11-B — min-width tables + horizontal scroll. Let me find the table wrappers:

Ran a command, used a tool

Swap all table wrappers to `overflow-x-auto` and add table `min-width`:

Swapped overflow-hidden → overflow-x-auto

Now add `min-w-[...]` to the tables inside those wrappers. Do a bulk edit — table with `w-full` gets `min-w-[720px]`:

Ran a command, used a tool

Now V11-C — 3-dot menu row actions. Check if `@wts/ui` has a `DropdownMenu`:

Ran a command, used a tool

`DropdownMenu` is available. Build a shared `RowActionsMenu` helper and swap all row action columns. Let me find `UserRowActions`:

Ran a command, read a file

Rewrite `UserRowActions` to use DropdownMenu. First add the import to org-workspace.tsx:

Read a file, edited a file

Now rewrite `UserRowActions` and add a shared `RowActionsButton`:

Edited a file, read a file

Now the `EngagementsTab` per-row menu currently uses a hand-rolled dropdown with `engMenuOpen`/`engMenuRef`. Replace with `RowActionsMenu`:

Read a file, edited a file

Now the `EntityEngagementsSection` per-row Remove:

Ran a command, read a file, edited a file

Now `engagement-detail-page.tsx` — Connected entities + Assigned users tables:

Ran a command, edited a file, read a file

Now swap the two rows in engagement-detail-page:

Read a file, edited a file, used a tool

Now V11-D — Search field in Assign Users modal:

Ran a command, read a file, edited a file, used a tool

Now add the search input above the list + change the map source to `visible`:

Editedengagement-detail-page.tsx+15-1

Now close the extra wrappers — find the closing brackets:

Readengagement-detail-page.tsx

I need to close the additional wrappers I opened (the fragment + inner conditional):

Edited a file, used a tool

Now V11-E — Delete group + confirmations. Let me add delete group handler in OrgWorkspace and threaded to GroupsTab, plus AlertDialog confirms for delete/promote/remove:

Ran 2 commands, used a tool

Add group delete + confirmations in `groups-tab.tsx`. First, let me add state and pass a new `onDeleteGroup` prop:

Read a file, edited a file

Now extend `GroupsTabProps` with `onDeleteGroup` and add confirmation dialogs for member removal + rep promotion inside `GroupDetail`. Let me find the props interface:

Ran 2 commands, read a file, edited a file

Now extend GroupsTab props with `onDeleteGroup` and wire through the detail:

Editedgroups-tab.tsx+5-0

Now the `GroupDetail` component: add `onDeleteGroup` + confirm dialogs for rep promotion and member removal. Let me read its current props and body:

Ran a command, read a file, edited a file

Now wrap the promote/remove buttons to open confirm dialog instead. Let me look at them:

Read a file, edited a file

Now add the AlertDialog at the end of GroupDetail. Locate the closing of the function:

Ran a command, read a file, edited a file

Now wire `deleteGroup` in `OrgWorkspace`. Also update `removeMember` for V11-F (end membership instead of delete):

Ran a command, read a file, edited a file, used 2 tools

Now pass `onDeleteGroup` to GroupsTab:

Read a file, edited a file, used a tool

Now V11-G — Activity log before/after. First extend the type + `addLogEntry`, then thread current change events:

Ran a command, read a file, edited a file, used a tool

Update `addLogEntry` to accept an optional `change` param:

Read a file, edited a file

Now wire the highest-value change events. Entity status change is a natural one:

Read a file, edited a file

Also add before/after to `promoteRep`:

Editedorg-workspace.tsx+15-4

Now update the `ActivityLogTab` to render two extra columns:

Ran a command, read a file, edited a file, used a tool

Now V11-H — Org Info + Metadata cards equal height:

Ran a command, used a tool