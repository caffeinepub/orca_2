import { generateId, triggerCloudSync } from "./storage";

export interface FileFolder {
  id: string;
  name: string;
  parentId: string | null; // null = root level
  projectId: string | null; // linked project (auto-created folders)
  type: "project" | "project_admin" | "hr" | "custom";
  createdBy: string;
  createdAt: string;
}

export interface FileEntry {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  folderId: string;
  dataUrl: string; // base64 data URL (blob storage upgrade later)
  uploadedBy: string;
  uploadedAt: string;
}

const FOLDERS_KEY = "orca_folders";
const FILES_KEY = "orca_files";

export const loadFolders = (): FileFolder[] => {
  try {
    return JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveFolders = (folders: FileFolder[]) => {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  triggerCloudSync();
};

export const loadFiles = (): FileEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(FILES_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveFiles = (files: FileEntry[]) => {
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
  triggerCloudSync();
};

/** Ensure each project has its folders. Call on load / project change. */
export const ensureProjectFolders = (
  projects: { id: string; name: string; archived?: boolean }[],
  userId: string,
): FileFolder[] => {
  const existing = loadFolders();
  let changed = false;

  for (const p of projects) {
    if (p.archived) continue;

    // Regular folder
    if (!existing.find((f) => f.projectId === p.id && f.type === "project")) {
      existing.push({
        id: generateId(),
        name: p.name,
        parentId: null,
        projectId: p.id,
        type: "project",
        createdBy: userId,
        createdAt: new Date().toISOString(),
      });
      changed = true;
    }

    // Admin folder
    if (
      !existing.find((f) => f.projectId === p.id && f.type === "project_admin")
    ) {
      existing.push({
        id: generateId(),
        name: `${p.name} (Admin)`,
        parentId: null,
        projectId: p.id,
        type: "project_admin",
        createdBy: userId,
        createdAt: new Date().toISOString(),
      });
      changed = true;
    }
  }

  if (changed) saveFolders(existing);
  return existing;
};

export const createFolder = (
  name: string,
  parentId: string | null,
  userId: string,
): FileFolder => {
  const folder: FileFolder = {
    id: generateId(),
    name,
    parentId,
    projectId: null,
    type: "custom",
    createdBy: userId,
    createdAt: new Date().toISOString(),
  };
  const folders = loadFolders();
  folders.push(folder);
  saveFolders(folders);
  return folder;
};

export const deleteFolder = (folderId: string) => {
  const folders = loadFolders().filter((f) => f.id !== folderId);
  saveFolders(folders);
  const files = loadFiles().filter((f) => f.folderId !== folderId);
  saveFiles(files);
};

export const renameFolder = (folderId: string, name: string) => {
  const folders = loadFolders().map((f) =>
    f.id === folderId ? { ...f, name } : f,
  );
  saveFolders(folders);
};

export const uploadFile = (
  file: File,
  folderId: string,
  userId: string,
): Promise<FileEntry> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const entry: FileEntry = {
        id: generateId(),
        name: file.name,
        size: file.size,
        mimeType: file.type,
        folderId,
        dataUrl: reader.result as string,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      };
      const files = loadFiles();
      files.push(entry);
      saveFiles(files);
      resolve(entry);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const deleteFile = (fileId: string) => {
  const files = loadFiles().filter((f) => f.id !== fileId);
  saveFiles(files);
};

export const downloadFile = (entry: FileEntry) => {
  const link = document.createElement("a");
  link.href = entry.dataUrl;
  link.download = entry.name;
  link.click();
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
