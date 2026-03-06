import { scheduleCloudSave } from "../App";
import type { Project, Stage, Task } from "../types";

export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const STORAGE_PREFIX = "orca_";

let currentPrincipal = "anonymous";

export const setCurrentPrincipal = (principal: string) => {
  currentPrincipal = principal;
};

const getUserKey = (key: string): string => {
  return `${STORAGE_PREFIX}${currentPrincipal}_${key}`;
};

export function triggerCloudSync() {
  try {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      // Sync ALL orca_ keys except theme (local preference)
      if (key.startsWith("orca_") && key !== "orca_theme") {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || "null");
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    scheduleCloudSave(JSON.stringify(data));
  } catch (e) {
    console.error("Cloud sync trigger failed:", e);
  }
}

export const saveProjects = (projects: Project[]) => {
  try {
    localStorage.setItem(getUserKey("projects"), JSON.stringify(projects));
    triggerCloudSync();
  } catch (e) {
    console.error("Failed to save projects:", e);
  }
};

export const loadProjects = (): Project[] => {
  try {
    const data = localStorage.getItem(getUserKey("projects"));
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load projects:", e);
    return [];
  }
};

export const saveStages = (stages: Stage[]) => {
  try {
    localStorage.setItem(getUserKey("stages"), JSON.stringify(stages));
    triggerCloudSync();
  } catch (e) {
    console.error("Failed to save stages:", e);
  }
};

export const loadStages = (): Stage[] => {
  try {
    const data = localStorage.getItem(getUserKey("stages"));
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load stages:", e);
    return [];
  }
};

export const saveTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem(getUserKey("tasks"), JSON.stringify(tasks));
    triggerCloudSync();
  } catch (e) {
    console.error("Failed to save tasks:", e);
  }
};

export const loadTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(getUserKey("tasks"));
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load tasks:", e);
    return [];
  }
};

export const loadFromCloud = (cloudData: string) => {
  try {
    const data = JSON.parse(cloudData);
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith("orca_")) {
        localStorage.setItem(
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        );
      }
    }
  } catch (e) {
    console.error("Failed to load from cloud:", e);
  }
};
