import { generateId, triggerCloudSync } from "./storage";

export interface FileFolder {
  id: string;
  name: string;
  parentId: string | null;
  projectId: string | null;
  memberId: string | null;
  type:
    | "project"
    | "project_admin"
    | "hr"
    | "studio_mstr"
    | "archive"
    | "custom";
  createdBy: string;
  createdAt: string;
  pinned?: boolean;
}

export interface FileEntry {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  folderId: string;
  dataUrl: string;
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

interface ProjectInput {
  id: string;
  name: string;
  archived?: boolean;
  teamMembers?: { id: string; name: string; role: string }[];
}

export const ensureAllFolders = (
  projects: ProjectInput[],
  currentUserId: string,
  currentUserName: string,
  currentUserRole: string,
): FileFolder[] => {
  const existing = loadFolders();
  let changed = false;
  const isSuperAdmin = currentUserRole === "Super Admin";
  const isAdminPlus = isSuperAdmin || currentUserRole === "Admin";

  const add = (f: Omit<FileFolder, "id" | "createdAt" | "createdBy">) => {
    existing.push({
      ...f,
      id: generateId(),
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
    });
    changed = true;
  };

  // Active project folders
  for (const p of projects) {
    if (p.archived) continue;
    const isMember = p.teamMembers?.some((m) => m.id === currentUserId);
    if (!isMember && !isSuperAdmin) continue;
    if (
      !existing.find(
        (f) =>
          f.projectId === p.id && f.type === "project" && !f.parentId?.length,
      )
    )
      add({
        name: p.name,
        parentId: null,
        projectId: p.id,
        memberId: null,
        type: "project",
      });
    if (
      isAdminPlus &&
      !existing.find((f) => f.projectId === p.id && f.type === "project_admin")
    )
      add({
        name: `${p.name} (Admin)`,
        parentId: null,
        projectId: p.id,
        memberId: null,
        type: "project_admin",
      });
  }

  // ARCHIVE folder
  let archiveFolder = existing.find(
    (f) => f.type === "archive" && f.parentId === null,
  );
  if (!archiveFolder) {
    archiveFolder = {
      id: generateId(),
      name: "ARCHIVE",
      parentId: null,
      projectId: null,
      memberId: null,
      type: "archive",
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
    };
    existing.push(archiveFolder);
    changed = true;
  }
  for (const p of projects) {
    if (!p.archived) continue;
    const isMember = p.teamMembers?.some((m) => m.id === currentUserId);
    if (!isMember && !isSuperAdmin) continue;
    if (
      !existing.find(
        (f) => f.projectId === p.id && f.parentId === archiveFolder!.id,
      )
    )
      add({
        name: p.name,
        parentId: archiveFolder.id,
        projectId: p.id,
        memberId: null,
        type: "project",
      });
  }

  // Personal HR: "NAME - STUDIO"
  if (
    currentUserId &&
    !existing.find(
      (f) =>
        f.type === "hr" && f.memberId === currentUserId && f.parentId === null,
    )
  )
    add({
      name: `${currentUserName} - STUDIO`,
      parentId: null,
      projectId: null,
      memberId: currentUserId,
      type: "hr",
    });

  // STUDIO-MSTR (Super Admin)
  if (isSuperAdmin) {
    let mstr = existing.find(
      (f) => f.type === "studio_mstr" && f.parentId === null,
    );
    if (!mstr) {
      mstr = {
        id: generateId(),
        name: "STUDIO-MSTR",
        parentId: null,
        projectId: null,
        memberId: null,
        type: "studio_mstr",
        createdBy: currentUserId,
        createdAt: new Date().toISOString(),
      };
      existing.push(mstr);
      changed = true;
    }
    const allMembers = new Map<string, string>();
    for (const p of projects)
      for (const m of p.teamMembers || [])
        if (!allMembers.has(m.id)) allMembers.set(m.id, m.name);
    for (const [mid, mname] of allMembers) {
      if (
        !existing.find(
          (f) =>
            f.type === "hr" && f.memberId === mid && f.parentId === mstr!.id,
        )
      )
        add({
          name: `${mname} - HR`,
          parentId: mstr.id,
          projectId: null,
          memberId: mid,
          type: "hr",
        });
    }
  }

  if (changed) saveFolders(existing);
  return existing;
};

export const getVisibleFolders = (
  allFolders: FileFolder[],
  projects: ProjectInput[],
  currentUserId: string,
  currentUserRole: string,
): FileFolder[] => {
  const isSA = currentUserRole === "Super Admin";
  const isAP = isSA || currentUserRole === "Admin";
  return allFolders.filter((f) => {
    if (f.type === "studio_mstr") return isSA;
    if (f.type === "project_admin") {
      if (!isAP) return false;
      const p = projects.find((x) => x.id === f.projectId);
      return isSA || p?.teamMembers?.some((m) => m.id === currentUserId);
    }
    if (f.type === "project") {
      const p = projects.find((x) => x.id === f.projectId);
      return isSA || p?.teamMembers?.some((m) => m.id === currentUserId);
    }
    if (f.type === "hr") {
      if (f.memberId === currentUserId && f.parentId === null) return true;
      return isSA;
    }
    return true;
  });
};

export const togglePin = (folderId: string) => {
  const folders = loadFolders().map((f) =>
    f.id === folderId ? { ...f, pinned: !f.pinned } : f,
  );
  saveFolders(folders);
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
    memberId: null,
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
  saveFolders(loadFolders().filter((f) => f.id !== folderId));
  saveFiles(loadFiles().filter((f) => f.folderId !== folderId));
};
export const renameFolder = (folderId: string, name: string) => {
  saveFolders(
    loadFolders().map((f) => (f.id === folderId ? { ...f, name } : f)),
  );
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
  saveFiles(loadFiles().filter((f) => f.id !== fileId));
};
export const downloadFile = (entry: FileEntry) => {
  const a = document.createElement("a");
  a.href = entry.dataUrl;
  a.download = entry.name;
  a.click();
};
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Legacy shim — kept for callers that pass projects without role info
export const ensureProjectFolders = (
  projects: {
    id: string;
    name: string;
    archived?: boolean;
    teamMembers?: { id: string; name: string; role: string }[];
  }[],
  userId: string,
): FileFolder[] => {
  return ensureAllFolders(projects, userId, "", "Super Admin");
};

// Legacy shim
export const ensureHRFolders = (
  _projects: { id: string; teamMembers?: { id: string; name: string }[] }[],
  _userId: string,
): FileFolder[] => {
  return loadFolders();
};
