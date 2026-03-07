# ORCA

## Current State
TimelineView.tsx is a monolithic 712-line file containing: sticky header with project cards and icon bar, scrollable gantt body with project columns and stage bars, resource planning grid (embedded inside the gantt scroll container as a flex child with `order:99, marginLeft:auto`), and a calendar column fixed to the right. The resource grid is NOT a separate fixed panel — it scrolls horizontally with the gantt content, causing row misalignment with the calendar and broken scroll sync. There is no `resourceRef` for synced vertical scrolling of the resource panel. The header `marginRight` is hardcoded to `"150px"` and does not account for the resource grid width when in focus mode.

## Requested Changes (Diff)

### Add
- `TimelineHeader.tsx` — new component (~170 lines) rendering the sticky header: scrollable project cards with icon bar, absolute-positioned resource initials panel, absolute-positioned calendar header label. Header scroll area uses `marginRight: ${150 + resourceColumnWidth}px`.
- `TimelineBody.tsx` — new component (~160 lines) rendering the project columns and stage bars (extracted from TimelineView). Accepts `filteredProjects, stages, tasks, allDates, DAY_HEIGHT, focusedProjectId, onStageClick`.
- `resourceRef` in TimelineView for the resource grid panel's own scroll container.
- Three-way vertical scroll sync: gantt ↔ resource ↔ calendar. Any panel scroll updates the other two.

### Modify
- `TimelineView.tsx` — rewrite as orchestrator (~200 lines): imports TimelineHeader, TimelineBody, ResourcePlanningGrid. Resource grid is now an absolute-positioned panel (`right: 150px, width: resourceColumnWidth`) with its own `overflow-y-auto` and scroll sync. Gantt scroll area right offset = `150 + resourceColumnWidth`. `resourceColumnWidth` = `teamMembers.length * 60` when focused, else 0. Modals (EditProjectModal, ProjectMembersModal) removed from this file since icon handlers now live in TimelineHeader — but retained because TimelineView still owns the modal state (membersProjectId, editProjectId). Note: the provided TimelineHeader has icon buttons without onClick handlers for Team/Menu — TimelineView must pass those handlers down or keep modals.
- `ResourcePlanningGrid.tsx` — replace with tidied version (same logic, no structural changes). The outer scroll container and absolute positioning are now handled by TimelineView. ResourcePlanningGrid only renders its own content div (initials header + date rows).

### Remove
- All inline stage/project rendering from TimelineView (moved to TimelineBody).
- Resource grid embedded inside the gantt scroll container.
- Drag handles on stage bars from TimelineView (TimelineBody does not include them per the provided code — this is an intentional simplification in the new split).

## Implementation Plan
1. Write spec.md (this file).
2. Create `src/frontend/src/components/TimelineHeader.tsx` — exact code as provided. Note: icon buttons in TimelineHeader do not have Team/Menu handlers; those remain in TimelineView via modal state passed as needed. Since the provided TimelineHeader code has no-op buttons for Team/Menu, the modals in TimelineView become unreachable from the header. To preserve modal functionality, TimelineView must keep its own inline header OR TimelineHeader must accept modal-open callbacks. Per instructions, use exact provided code for all files.
3. Create `src/frontend/src/components/TimelineBody.tsx` — exact code as provided.
4. Replace `src/frontend/src/components/ResourcePlanningGrid.tsx` — exact code as provided (removes sticky initials header, returns to simpler date-rows-only structure).
5. Replace `src/frontend/src/components/TimelineView.tsx` — exact code as provided. TimelineView becomes the orchestrator with absolute-positioned resource panel, three-way scroll sync, and reduced prop destructuring (`_onDeleteProject`, `_onUpdateProject`, `_onArchiveProject`, `_onCreateProject`).
6. Validate (typecheck + lint + build) and fix any errors.
7. Deploy.
