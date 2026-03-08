import type { FileEntry, FileFolder } from "@/utils/filesStorage";
import { downloadFile, formatFileSize, togglePin } from "@/utils/filesStorage";
import {
  Download,
  File,
  FileText,
  FolderOpen,
  Image,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
  Video,
} from "lucide-react";
import { useState } from "react";

interface FilesListProps {
  folders: FileFolder[];
  files: FileEntry[];
  viewMode: "list" | "grid" | "columns";
  onOpenFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRefresh?: () => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return FileText;
  return File;
};

const getFolderColor = (type: string) => {
  if (type === "project_admin") return "text-yellow-500";
  if (type === "hr") return "text-purple-500";
  if (type === "studio_mstr") return "text-red-500";
  if (type === "archive") return "text-gray-400";
  return "text-gray-500";
};

export default function FilesList({
  folders,
  files,
  viewMode,
  onOpenFolder,
  onDeleteFolder,
  onDeleteFile,
  onRefresh,
}: FilesListProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Sort: pinned first, then alphabetical
  const sortedFolders = [...folders].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.name.localeCompare(b.name);
  });

  if (sortedFolders.length === 0 && files.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-gray-400"
        data-ocid="files.list.empty_state"
      >
        <FolderOpen className="w-12 h-12 mb-3" />
        <p className="text-sm">This folder is empty</p>
      </div>
    );
  }

  const handlePin = (folderId: string) => {
    togglePin(folderId);
    onRefresh?.();
  };

  // COLUMNS VIEW — Finder/macOS style side-by-side columns
  if (viewMode === "columns") {
    return (
      <div
        className="flex gap-0 border rounded overflow-x-auto h-full min-h-[300px]"
        data-ocid="files.columns.panel"
      >
        <div className="min-w-[220px] max-w-[260px] border-r overflow-y-auto bg-white shrink-0">
          {sortedFolders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => onOpenFolder(folder.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-100 text-left"
              data-ocid="files.columns.folder.button"
            >
              {folder.pinned && (
                <Pin className="w-3 h-3 text-blue-400 shrink-0" />
              )}
              <FolderOpen
                className={`w-4 h-4 shrink-0 ${getFolderColor(folder.type)}`}
              />
              <span className="truncate flex-1">{folder.name}</span>
              <span className="text-gray-300 text-[10px]">›</span>
            </button>
          ))}
          {files.map((file) => {
            const Icon = getFileIcon(file.mimeType);
            return (
              <div
                key={file.id}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-100"
                data-ocid="files.columns.file.row"
              >
                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate flex-1">{file.name}</span>
                <span className="text-gray-400 text-[10px]">
                  {formatFileSize(file.size)}
                </span>
              </div>
            );
          })}
        </div>
        {/* Preview/info panel */}
        <div className="flex-1 p-4 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
          Select a folder or file
        </div>
      </div>
    );
  }

  // GRID VIEW
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sortedFolders.map((folder) => (
          <div key={folder.id} className="relative group">
            <button
              type="button"
              onClick={() => onOpenFolder(folder.id)}
              className="w-full flex flex-col items-center gap-2 p-4 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors"
              data-ocid="files.grid.folder.button"
            >
              <FolderOpen
                className={`w-10 h-10 ${getFolderColor(folder.type)}`}
              />
              <span className="text-xs text-gray-700 text-center truncate w-full">
                {folder.pinned && (
                  <Pin className="w-3 h-3 inline text-blue-400 mr-1" />
                )}
                {folder.name}
              </span>
            </button>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => handlePin(folder.id)}
                className="p-1 bg-white rounded shadow hover:bg-gray-100"
                title={folder.pinned ? "Unpin" : "Pin"}
                data-ocid="files.grid.folder.toggle"
              >
                {folder.pinned ? (
                  <PinOff className="w-3 h-3" />
                ) : (
                  <Pin className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        ))}
        {files.map((file) => {
          const Icon = getFileIcon(file.mimeType);
          return (
            <div
              key={file.id}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors relative group"
              data-ocid="files.grid.file.card"
            >
              {file.mimeType.startsWith("image/") ? (
                <img
                  src={file.dataUrl}
                  alt={file.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <Icon className="w-10 h-10 text-gray-400" />
              )}
              <span className="text-xs text-gray-700 text-center truncate w-full">
                {file.name}
              </span>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                <button
                  type="button"
                  onClick={() => downloadFile(file)}
                  className="p-1 bg-white rounded shadow hover:bg-gray-100"
                  title="Download"
                  data-ocid="files.grid.file.download.button"
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteFile(file.id)}
                  className="p-1 bg-white rounded shadow hover:bg-red-50"
                  title="Delete"
                  data-ocid="files.grid.file.delete_button"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // LIST VIEW (default)
  return (
    <div
      className="border rounded-lg overflow-hidden"
      data-ocid="files.list.table"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b text-left text-gray-500">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium w-24">Size</th>
            <th className="px-4 py-2 font-medium w-32">Modified</th>
            <th className="px-4 py-2 font-medium w-10" />
          </tr>
        </thead>
        <tbody>
          {sortedFolders.map((folder) => (
            <tr
              key={folder.id}
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => onOpenFolder(folder.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpenFolder(folder.id);
              }}
              data-ocid="files.list.folder.row"
            >
              <td className="px-4 py-2 flex items-center gap-2">
                {folder.pinned && <Pin className="w-3 h-3 text-blue-400" />}
                <FolderOpen
                  className={`w-4 h-4 ${getFolderColor(folder.type)}`}
                />
                {folder.name}
              </td>
              <td className="px-4 py-2 text-gray-400">—</td>
              <td className="px-4 py-2 text-gray-400">
                {new Date(folder.createdAt).toLocaleDateString("en-GB")}
              </td>
              <td className="px-4 py-2 relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === folder.id ? null : folder.id);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  data-ocid="files.list.folder.dropdown_menu"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
                {menuOpen === folder.id && (
                  <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 w-36">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePin(folder.id);
                        setMenuOpen(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center gap-2"
                      data-ocid="files.list.folder.toggle"
                    >
                      {folder.pinned ? (
                        <PinOff className="w-3 h-3" />
                      ) : (
                        <Pin className="w-3 h-3" />
                      )}
                      {folder.pinned ? "Unpin" : "Pin to top"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                        setMenuOpen(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      data-ocid="files.list.folder.delete_button"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {files.map((file) => {
            const Icon = getFileIcon(file.mimeType);
            return (
              <tr
                key={file.id}
                className="border-b hover:bg-gray-50"
                data-ocid="files.list.file.row"
              >
                <td className="px-4 py-2 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-gray-400" /> {file.name}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {formatFileSize(file.size)}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {new Date(file.uploadedAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-2 relative">
                  <button
                    type="button"
                    onClick={() =>
                      setMenuOpen(menuOpen === file.id ? null : file.id)
                    }
                    className="p-1 hover:bg-gray-100 rounded"
                    data-ocid="files.list.file.dropdown_menu"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                  {menuOpen === file.id && (
                    <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 w-32">
                      <button
                        type="button"
                        onClick={() => {
                          downloadFile(file);
                          setMenuOpen(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100"
                        data-ocid="files.list.file.download.button"
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteFile(file.id);
                          setMenuOpen(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                        data-ocid="files.list.file.delete_button"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
