import FilesList from "@/components/files/FilesList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FileEntry, FileFolder } from "@/utils/filesStorage";
import {
  createFolder,
  deleteFile,
  deleteFolder,
  loadFiles,
  loadFolders,
  uploadFile,
} from "@/utils/filesStorage";
import { ChevronRight, FolderPlus, Home, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rootFolderId: string;
  folderName: string;
  currentUserId: string;
}

export default function FolderPopupModal({
  isOpen,
  onClose,
  rootFolderId,
  folderName,
  currentUserId,
}: Props) {
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentId, setCurrentId] = useState(rootFolderId);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setFolders(loadFolders());
    setFiles(loadFiles());
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentId(rootFolderId);
      refresh();
    }
  }, [isOpen, rootFolderId, refresh]);

  const childFolders = folders.filter((f) => f.parentId === currentId);
  const childFiles = files.filter((f) => f.folderId === currentId);

  const buildPath = (): FileFolder[] => {
    const path: FileFolder[] = [];
    let id: string | null = currentId;
    while (id && id !== rootFolderId) {
      const f = folders.find((x) => x.id === id);
      if (!f) break;
      path.unshift(f);
      id = f.parentId;
    }
    return path;
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList) return;
    for (const file of Array.from(fileList)) {
      await uploadFile(file, currentId, currentUserId);
    }
    refresh();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-2xl max-h-[70vh] flex flex-col"
        data-ocid="folder.popup.modal"
      >
        <DialogHeader>
          <DialogTitle className="text-sm">{folderName}</DialogTitle>
        </DialogHeader>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-gray-500 px-1">
          <button
            type="button"
            onClick={() => setCurrentId(rootFolderId)}
            className="hover:text-gray-900 flex items-center gap-1"
            data-ocid="folder.popup.breadcrumb.root.button"
          >
            <Home className="w-3 h-3" /> Root
          </button>
          {buildPath().map((f) => (
            <span key={f.id} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <button
                type="button"
                onClick={() => setCurrentId(f.id)}
                className="hover:text-gray-900"
                data-ocid="folder.popup.breadcrumb.item.button"
              >
                {f.name}
              </button>
            </span>
          ))}
        </nav>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            data-ocid="folder.popup.new_folder.button"
          >
            <FolderPlus className="w-3 h-3" /> New Folder
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded"
            data-ocid="folder.popup.upload.button"
          >
            <Upload className="w-3 h-3" /> Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            data-ocid="folder.popup.upload.input"
          />
        </div>

        {isCreating && (
          <div className="flex items-center gap-2 px-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) {
                  createFolder(newName.trim(), currentId, currentUserId);
                  setNewName("");
                  setIsCreating(false);
                  refresh();
                }
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewName("");
                }
              }}
              placeholder="Folder name..."
              className="border rounded px-2 py-1 text-xs flex-1"
              data-ocid="folder.popup.new_folder.input"
            />
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewName("");
              }}
              className="text-xs text-gray-500"
              data-ocid="folder.popup.new_folder.cancel_button"
            >
              Cancel
            </button>
          </div>
        )}

        {/* File list */}
        <div className="flex-1 overflow-y-auto min-h-[200px]">
          <FilesList
            folders={childFolders}
            files={childFiles}
            viewMode="list"
            onOpenFolder={setCurrentId}
            onDeleteFolder={(id) => {
              deleteFolder(id);
              refresh();
            }}
            onDeleteFile={(id) => {
              deleteFile(id);
              refresh();
            }}
            onRefresh={refresh}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
