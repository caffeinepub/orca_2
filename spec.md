# ORCA

## Current State
ORCA is a full-stack React + TypeScript + Vite app. The Board page supports projects, stages, and tasks with full CRUD. A Timeline view is wired when `activeBoardTab === 'timeline'`. The `BoardTab` type already includes `'budget'` but clicking it currently falls through to the default BoardPage render. There are no budget-related types, components, or localStorage keys yet.

## Requested Changes (Diff)

### Add
- `src/frontend/src/types/project.ts` — Budget domain types: `BudgetLineItem`, `BudgetStage`, `BudgetSettings`, `ProjectBudget`, `InvoiceItem`, `Receipt`, `ClientBudgetSettings`, `CustomField`, `ProjectTemplate`
- `src/frontend/src/components/budget/budgetCalculations.ts` — Shared calculation helpers: `calculateLineValues`, `calculateStageTotals`, `calculateProjectTotals`, `formatCurrency`, `getStatusColor`, `calculateExpectedPayment`, `getStageLines`; exports `Invoice` interface
- `src/frontend/src/components/budget/excelExport.ts` — `exportToExcel()` function that generates and downloads a CSV
- `src/frontend/src/components/budget/WorkingBudgetTab.tsx` — Full working budget UI: default settings panel, invoice mode toggle (stage/project level), per-stage collapsible sections with labour + other costs tables, invoice schedules, project totals, export button, mode-switch AlertDialog
- `src/frontend/src/components/budget/ClientBudgetTab.tsx` — Client budget UI: per-stage collapsible sections with simplified table (labour summary row + individual other items), provider toggle (ASC/Client), stage and project totals
- `src/frontend/src/components/budget/BudgetView.tsx` — Top-level wrapper: project selector dropdown, Working/Client sub-tab toggle, loads/saves `orca_project_info_{projectId}` from localStorage

### Modify
- `src/frontend/src/App.tsx` — Add `import BudgetView` and wire `activeBoardTab === 'budget'` case inside `renderPage()` before the default BoardPage return

### Remove
- Nothing

## Implementation Plan
1. Write `src/frontend/src/types/project.ts` with all budget domain types
2. Write `src/frontend/src/components/budget/budgetCalculations.ts`
3. Write `src/frontend/src/components/budget/excelExport.ts`
4. Write `src/frontend/src/components/budget/WorkingBudgetTab.tsx` — full implementation with all 7 features
5. Write `src/frontend/src/components/budget/ClientBudgetTab.tsx`
6. Write `src/frontend/src/components/budget/BudgetView.tsx`
7. Update `src/frontend/src/App.tsx` — add import and budget case in renderPage
8. Typecheck and fix any errors
