import FilesBreadcrumb from "@/components/files/FilesBreadcrumb";
import FilesList from "@/components/files/FilesList";
import type { Project } from "@/types";
import {
  type FileEntry,
  type FileFolder,
  createFolder,
  deleteFile,
  deleteFolder,
  ensureProjectFolders,
  loadFiles,
  uploadFile,
} from "@/utils/filesStorage";
import { FolderPlus, Grid3X3, List, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface FilesPageProps {
  projects: Project[];
  currentUserId: string;
  targetFolderId?: string | null;
}

export default function FilesPage({
  projects,
  currentUserId,
  targetFolderId,
}: FilesPageProps) {
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    const f = ensureProjectFolders(projects, currentUserId);
    setFolders(f);
    setFiles(loadFiles());
  }, [projects, currentUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Navigate to target folder from project card icons
  useEffect(() => {
    if (targetFolderId) setCurrentFolderId(targetFolderId);
  }, [targetFolderId]);

  // Focus new folder input
  useEffect(() => {
    if (isCreatingFolder && folderInputRef.current)
      folderInputRef.current.focus();
  }, [isCreatingFolder]);

  const childFolders = folders.filter((f) =>
    currentFolderId ? f.parentId === currentFolderId : f.parentId === null,
  );
  const childFiles = files.filter((f) => f.folderId === currentFolderId);

  const buildPath = (): FileFolder[] => {
    const path: FileFolder[] = [];
    let id = currentFolderId;
    while (id) {
      const folder = folders.find((f) => f.id === id);
      if (!folder) break;
      path.unshift(folder);
      id = folder.parentId;
    }
    return path;
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || !currentFolderId) return;
    for (const file of Array.from(fileList)) {
      await uploadFile(file, currentFolderId, currentUserId);
    }
    refresh();
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim(), currentFolderId, currentUserId);
    setNewFolderName("");
    setIsCreatingFolder(false);
    refresh();
  };

  const handleDeleteFolder = (folderId: string) => {
    if (!confirm("Delete this folder and all its contents?")) return;
    deleteFolder(folderId);
    refresh();
  };

  const handleDeleteFile = (fileId: string) => {
    if (!confirm("Delete this file?")) return;
    deleteFile(fileId);
    refresh();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentFolderId) handleUpload(e.dataTransfer.files);
  };

  return (
    <div
      className="flex-1 flex flex-col p-6 overflow-auto"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-ocid="files.page"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <FilesBreadcrumb path={buildPath()} onNavigate={setCurrentFolderId} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded ${viewMode === "list" ? "bg-gray-200" : "hover:bg-gray-100"}`}
            title="List view"
            data-ocid="files.list_view.toggle"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded ${viewMode === "grid" ? "bg-gray-200" : "hover:bg-gray-100"}`}
            title="Grid view"
            data-ocid="files.grid_view.toggle"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <button
            type="button"
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            data-ocid="files.new_folder.button"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!currentFolderId}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            data-ocid="files.upload.button"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            data-ocid="files.upload.input"
          />
        </div>
      </div>

      {/* Inline new folder input */}
      {isCreatingFolder && (
        <div className="flex items-center gap-2 mb-4">
          <input
            ref={folderInputRef}
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") {
                setIsCreatingFolder(false);
                setNewFolderName("");
              }
            }}
            placeholder="Folder name..."
            className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-ocid="files.new_folder.input"
          />
          <button
            type="button"
            onClick={handleCreateFolder}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            data-ocid="files.new_folder.submit_button"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreatingFolder(false);
              setNewFolderName("");
            }}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            data-ocid="files.new_folder.cancel_button"
          >
            Cancel
          </button>
        </div>
      )}

      {!currentFolderId && (
        <p className="text-xs text-gray-400 mb-4">
          Open a folder to upload files. Drag &amp; drop supported inside
          folders.
        </p>
      )}

      <FilesList
        folders={childFolders}
        files={childFiles}
        viewMode={viewMode}
        onOpenFolder={setCurrentFolderId}
        onDeleteFolder={handleDeleteFolder}
        onDeleteFile={handleDeleteFile}
      />
    </div>
  );
}
