# ORCA

## Current State

ORCA8 is live with:
- Full ORCA Clean board layout (projects as columns, stages as vertical sections, tasks as cards)
- All modals use shadcn `<Dialog>` (Radix UI portals)
- Correct icon bar in ProjectCard (7 icons in ORCA Clean order)
- `activeBoardTab` state in `App.tsx` tracks "board" | "timeline" | "budget" | "proposal" | "teamtalk"
- `case "board":` in `renderPage()` always renders `<BoardPage>` regardless of `activeBoardTab`
- `StageModal` has `stage: Stage` typed as required (non-nullable)
- No `TimelineView.tsx` or `ResourcePlanningGrid.tsx` exist yet

## Requested Changes (Diff)

### Add
- `src/frontend/src/components/TimelineView.tsx` — New component (~500 lines): vertical date-axis timeline with horizontal project columns, sticky header with project header cards + icon bar, scrollable stage bars positioned at date rows, task pills inside stage bars, calendar strip (150px right), today line, scroll sync (vertical + horizontal), focus mode, and StageModal integration
- `src/frontend/src/components/ResourcePlanningGrid.tsx` — New component (~185 lines): team member columns (60px each) with editable number inputs per date row, color-coded by workload (white/green/yellow/red), localStorage persistence, cross-project aggregate coloring, grey fill fix with mounted state

### Modify
- `src/frontend/src/App.tsx` — Add `import TimelineView` and update `case "board":` to check `activeBoardTab === "timeline"` and render `<TimelineView>` with all required props; otherwise render `<BoardPage>` as before
- `src/frontend/src/components/modals/StageModal.tsx` — Update `stage` prop type from `Stage` (required) to `Stage | null` so it accepts null from TimelineView's `editingStage` state; guard internal state initialization accordingly

### Remove
- Nothing removed

## Implementation Plan

1. Fix `StageModal.tsx`: change `stage: Stage` to `stage: Stage | null` in the interface, guard `useState` initializers with nullish checks so defaults are empty strings when stage is null
2. Create `TimelineView.tsx` with the exact code specified: all scroll sync logic, stage bars, task pills, project header icon bar, focus mode, ResourcePlanningGrid integration, StageModal integration
3. Create `ResourcePlanningGrid.tsx` with the exact code specified: localStorage resource data, workload color coding, editable inputs, cross-project aggregate, mounted fix
4. Update `App.tsx`: add `import TimelineView` at top; replace `case "board":` block with the new conditional that returns `<TimelineView>` when `activeBoardTab === "timeline"`, else `<BoardPage>`
5. Run typecheck and fix any type errors; run build to verify
