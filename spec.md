# ORCA

## Current State

- FilesPage.tsx is a placeholder ("coming soon") with no functionality
- ProjectCard.tsx folder icons (Files, Admin Files) show alert() stubs
- TimelineHeader.tsx folder icons have no onClick handlers
- No `filesStorage.ts` utility exists
- No `components/files/` directory exists
- App.tsx renders `<FilesPage />` with no props

## Requested Changes (Diff)

### Add

- `src/frontend/src/utils/filesStorage.ts` — centralised file/folder CRUD using localStorage, following the same triggerCloudSync pattern as storage.ts. Exports: loadFolders, saveFolders, loadFiles, saveFiles, ensureProjectFolders, createFolder, deleteFolder, renameFolder, uploadFile, deleteFile, downloadFile, formatFileSize
- `src/frontend/src/components/files/FilesBreadcrumb.tsx` — breadcrumb nav component showing path from root to current folder
- `src/frontend/src/components/files/FilesList.tsx` — renders folder contents in list or grid view with delete/download actions
- `filesTargetFolderId` state in App.tsx
- `handleNavigateToFiles(projectId, folderType)` handler in App.tsx that finds the matching folder and sets activePage to "files"

### Modify

- `src/frontend/src/pages/FilesPage.tsx` — replace placeholder with full Dropbox-style page: breadcrumb, toolbar (list/grid toggle, new folder, upload), drag & drop, folder tree navigation, file upload/download
- `src/frontend/src/App.tsx` — add filesTargetFolderId state, handleNavigateToFiles handler, update FilesPage render with projects/currentUserId/targetFolderId props, pass onNavigateToFiles to BoardPage and TimelineView
- `src/frontend/src/pages/BoardPage.tsx` — add onNavigateToFiles prop, pass through to Board
- `src/frontend/src/components/Board.tsx` — add onNavigateToFiles prop, pass to each ProjectCard with project.id curried
- `src/frontend/src/components/ProjectCard.tsx` — add onNavigateToFiles prop, replace alert() stubs with onNavigateToFiles?.("project") and onNavigateToFiles?.("project_admin")
- `src/frontend/src/components/TimelineHeader.tsx` — add onNavigateToFiles prop, wire folder icon onClick handlers
- `src/frontend/src/components/TimelineView.tsx` — add onNavigateToFiles prop, pass through to TimelineHeader

### Remove

- alert() stubs for Files and Admin Files in ProjectCard.tsx

## Implementation Plan

1. Create `src/frontend/src/utils/filesStorage.ts` with all exports as specified
2. Create `src/frontend/src/components/files/FilesBreadcrumb.tsx`
3. Create `src/frontend/src/components/files/FilesList.tsx`
4. Replace `src/frontend/src/pages/FilesPage.tsx` with full implementation
5. Modify App.tsx: add state + handler + update FilesPage render + pass onNavigateToFiles to BoardPage + pass onNavigateToFiles to TimelineView
6. Modify BoardPage.tsx: add onNavigateToFiles prop, pass to Board
7. Modify Board.tsx: add onNavigateToFiles prop, pass to each ProjectCard
8. Modify ProjectCard.tsx: add prop, replace alert() stubs
9. Modify TimelineHeader.tsx: add prop, wire folder icon onClick handlers
10. Modify TimelineView.tsx: add prop, pass to TimelineHeader
