import { scheduleCloudSave } from "../App";
import type { Project, Stage, Task } from "../types";

const KEY = "orca_app_state";

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function load(): any {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function save(state: any) {
  const json = JSON.stringify(state);
  localStorage.setItem(KEY, json);
  scheduleCloudSave(json);
}

export function loadProjects(): Project[] {
  return load().projects || [];
}
export function saveProjects(p: Project[]) {
  const s = load();
  s.projects = p;
  save(s);
}

export function loadStages(): Stage[] {
  return load().stages || [];
}
export function saveStages(st: Stage[]) {
  const s = load();
  s.stages = st;
  save(s);
}

export function loadTasks(): Task[] {
  return load().tasks || [];
}
export function saveTasks(t: Task[]) {
  const s = load();
  s.tasks = t;
  save(s);
}
