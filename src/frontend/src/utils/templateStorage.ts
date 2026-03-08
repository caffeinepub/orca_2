import type { Project, Stage, Task } from "@/types";
import type { ProjectTemplate } from "@/types/project";
import { generateId } from "./storage";

const TEMPLATES_KEY = "orca_templates";

export const loadTemplates = (): ProjectTemplate[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
    return [...getBuiltInTemplates(), ...saved];
  } catch {
    return getBuiltInTemplates();
  }
};

export const saveUserTemplates = (templates: ProjectTemplate[]) => {
  const userOnly = templates.filter((t) => t.id !== "builtin-asc-stages-01");
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(userOnly));
};

export const deleteTemplate = (id: string) => {
  const all = loadTemplates().filter(
    (t) => t.id !== id && t.id !== "builtin-asc-stages-01",
  );
  saveUserTemplates(all);
};

export const getBuiltInTemplates = (): ProjectTemplate[] => [
  {
    id: "builtin-asc-stages-01",
    name: "ASC Stages 01",
    createdAt: "2024-01-01",
    projectId: "",
    projectName: "Built-in",
    projectColor: "#bde0fe",
    stages: [
      { name: "Briefing", color: "#dbeafe", order: 0 },
      { name: "Concept", color: "#fef3c7", order: 1 },
      { name: "Design Development", color: "#d1fae5", order: 2 },
      { name: "Technical", color: "#e0e7ff", order: 3 },
      { name: "Fabrication", color: "#fce7f3", order: 4 },
      { name: "Install / Exhibit / De-install", color: "#f3e8ff", order: 5 },
    ],
    customFields: [],
    includeStages: true,
    includeStageDates: false,
    includeTasks: false,
    includeBudget: false,
    includeCustomFields: false,
  },
];

export interface SaveTemplateOptions {
  name: string;
  includeStages: boolean;
  includeStageDates: boolean;
  includeTasks: boolean;
  includeMilestones: boolean;
  includeBudget: boolean;
  includeCustomFields: boolean;
}

export const saveProjectAsTemplate = (
  project: Project,
  stages: Stage[],
  tasks: Task[],
  options: SaveTemplateOptions,
): ProjectTemplate => {
  const projectStages = stages.filter((s) => s.projectId === project.id);
  const template: ProjectTemplate = {
    id: generateId(),
    name: options.name,
    createdAt: new Date().toISOString(),
    projectId: project.id,
    projectName: project.name,
    projectColor: project.color,
    stages: options.includeStages
      ? projectStages.map((s) => ({
          name: s.name,
          color: s.color,
          order: s.order,
          startDate: options.includeStageDates ? s.startDate : undefined,
          endDate: options.includeStageDates ? s.endDate : undefined,
        }))
      : [],
    customFields: options.includeCustomFields
      ? (() => {
          try {
            const saved = localStorage.getItem(
              `orca_project_info_${project.id}`,
            );
            return saved ? JSON.parse(saved).customFields || [] : [];
          } catch {
            return [];
          }
        })()
      : [],
    includeStages: options.includeStages,
    includeStageDates: options.includeStageDates,
    includeTasks: options.includeTasks,
    includeBudget: options.includeBudget,
    includeCustomFields: options.includeCustomFields,
  };

  // Save tasks data alongside template if included
  if (options.includeTasks) {
    const templateTasks = tasks
      .filter((t) => projectStages.some((s) => s.id === t.stageId))
      .map((t) => ({
        title: t.title,
        description: t.description,
        stageIndex: projectStages.findIndex((s) => s.id === t.stageId),
        order: t.order,
        milestone: t.milestone || t.isMilestone || false,
        dueDate: options.includeStageDates ? t.dueDate : undefined,
        checklist: t.checklist,
      }));
    localStorage.setItem(
      `orca_template_tasks_${template.id}`,
      JSON.stringify(templateTasks),
    );
  }

  if (options.includeBudget) {
    try {
      const budgetData = localStorage.getItem(
        `orca_project_info_${project.id}`,
      );
      if (budgetData) {
        localStorage.setItem(`orca_template_budget_${template.id}`, budgetData);
      }
    } catch {}
  }

  const existing = loadTemplates().filter(
    (t) => t.id !== "builtin-asc-stages-01",
  );
  existing.push(template);
  saveUserTemplates(existing);
  return template;
};
