# ORCA

## Current State
ORCA is a full-featured project management app with Board, Timeline, Budget, Proposal, Team Talk, Team, Settings, and Calendar pages. The following issues exist in the current codebase:

1. **CalendarDayCell.tsx** — Stage events render as individual full pills on every day, without continuous bar styling. The `isStart`/`isEnd` fields are already computed and passed, but not used for border-radius/margin treatment.

2. **TimelineView.tsx** — The Calendar date column (right side) is rendered as `position: absolute` fixed to the right edge. The resource planning grid and team member avatars in the header are already using `order: 99` / `marginLeft: auto` pattern. Layout is functionally working but user reports positional issues with avatars and the resource column.

3. **WorkingBudgetTab.tsx** — Labour lines start empty for every stage. There's no auto-population from `project.teamMembers` or from `orca_resource_days` localStorage key.

4. **StageSection.tsx** — Stage name is a static `<span>` inside a collapse button. Dates are a static div. Neither supports inline editing.

5. **storage.ts** — `triggerCloudSync()` only iterates keys matching `orca_{principal}_*`. Keys like `orca_project_info_*`, `orca_resource_days`, `orca_rolladex`, `orca_holidays`, `orca_ts_*`, `orca_permissions_config`, `orca_proposal_templates` are NOT synced to the cloud. `triggerCloudSync` is also not exported, so components can't call it.

## Requested Changes (Diff)

### Add
- Inline editing for stage name (click-to-edit input with Enter/Escape/blur save) in `StageSection.tsx`
- Inline editing for stage dates (click-to-edit date inputs with confirm/cancel) in `StageSection.tsx`
- `autoPopulateLabour` function in `WorkingBudgetTab.tsx` that creates labour lines from `project.teamMembers`, summing `orca_resource_days` for each member+stage
- Export of `triggerCloudSync` from `storage.ts` so external components can call it
- `triggerCloudSync()` calls in: `BudgetView.tsx`, `ProposalView.tsx`, `ProposalTemplateModal.tsx`, `RolladexTab.tsx`, `TimesheetsTab.tsx`, `HolidaysTab.tsx`, `PermissionsConfig.tsx`, `GanttChart.tsx`

### Modify
- `CalendarDayCell.tsx` — Change stage pill render to use `borderRadius`, `marginLeft`, `marginRight` based on `ev.isStart`/`ev.isEnd`, and only show label text on start day (non-breaking-space on continuation/end)
- `storage.ts` — `triggerCloudSync()`: change key filter from `startsWith(STORAGE_PREFIX + currentPrincipal)` to `startsWith('orca_')` but exclude `orca_theme`; also update `loadFromCloud` to only restore keys starting with `orca_`
- `WorkingBudgetTab.tsx` — When a stage section renders with zero labour lines, call `autoPopulateLabour` to seed lines from team members and resource days
- `StageSection.tsx` — Replace static stage name span with click-to-edit input pattern; replace static dates div with click-to-edit date inputs pattern; add `isEditingTitle`, `editTitle`, `isEditingDates`, `editStart`, `editEnd`, `titleInputRef` state/ref

### Remove
- Nothing removed

## Implementation Plan

1. **storage.ts**: Expand `triggerCloudSync` to include all `orca_` keys (excluding `orca_theme`). Update `loadFromCloud` to guard with `key.startsWith('orca_')`. Export `triggerCloudSync`.

2. **CalendarDayCell.tsx**: Replace the stage event `<button>` render to apply continuous bar CSS (border-radius, negative margins on non-start/end sides, show label only on start).

3. **WorkingBudgetTab.tsx**: Add `autoPopulateLabour` helper. In the per-stage render loop, when `labourLines.length === 0` and `project.teamMembers?.length > 0`, call it and invoke `updateStageLines` to seed.

4. **StageSection.tsx**: Add inline editing state + refs. Replace static stage name span with conditional input/span. Replace static dates div with conditional date-input row. Ensure the collapse toggle button only wraps the chevron+task-count (not the inline editable name).

5. **BudgetView.tsx**: Import and call `triggerCloudSync` after `localStorage.setItem` in `handleUpdateBudget` and `handleUpdateClientSettings`.

6. **ProposalView.tsx**: Import and call `triggerCloudSync` after saving notes.

7. **ProposalTemplateModal.tsx**: Import and call `triggerCloudSync` after template save/delete.

8. **RolladexTab.tsx**: Import and call `triggerCloudSync` in the contacts save `useEffect`.

9. **TimesheetsTab.tsx**: Import and call `triggerCloudSync` in the entries save `useEffect`.

10. **HolidaysTab.tsx**: Import and call `triggerCloudSync` in the holidays save `useEffect`.

11. **PermissionsConfig.tsx**: Import and call `triggerCloudSync` in the config save `useEffect`.

12. **GanttChart.tsx**: Import and call `triggerCloudSync` after resource days save if applicable.
