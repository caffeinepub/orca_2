import type { AppRole, Feature, NavPage } from "@/types";

export const FEATURE_LABELS: Record<Feature, string> = {
  view_all_projects: "View All Projects",
  create_project: "Create Project",
  edit_project: "Edit Project",
  delete_project: "Delete/Archive Project",
  create_stage: "Create Stage",
  edit_stage: "Edit Stage",
  create_task: "Create Task",
  edit_any_task: "Edit Any Task",
  view_admin_folders: "Admin Folders",
  delete_any_file: "Delete Any File",
  share_folders: "Share Folders",
  manage_team: "Manage Team",
  change_roles: "Change Roles",
  view_permissions_grid: "Permissions Grid",
  timesheet_summary: "Timesheet Summary",
  hr_folders: "HR Folders",
  resource_planning: "Resource Planning",
  budget_tab: "Budget Tab",
  proposal_tab: "Proposal Tab",
  teamtalk_tab: "Team Talk Tab",
  info_modal: "Project Info Modal",
  admin_file_modal: "Admin Files Modal",
  focus_mode: "Focus Mode (Timeline)",
  gantt_chart_tab: "Gantt Chart Tab",
  team_members_tab: "Team Members Tab",
  rolladex_tab: "Rolladex Tab",
  holiday_tab: "Holidays Tab",
  view_all_holidays: "View All Holiday Requests",
};

export const FEATURE_CATEGORIES: { label: string; features: Feature[] }[] = [
  {
    label: "Projects",
    features: [
      "view_all_projects",
      "create_project",
      "edit_project",
      "delete_project",
    ],
  },
  {
    label: "Stages & Tasks",
    features: ["create_stage", "edit_stage", "create_task", "edit_any_task"],
  },
  {
    label: "Files",
    features: ["view_admin_folders", "delete_any_file", "share_folders"],
  },
  {
    label: "Team",
    features: ["manage_team", "change_roles", "view_permissions_grid"],
  },
  {
    label: "Board Tabs",
    features: ["budget_tab", "proposal_tab", "teamtalk_tab", "focus_mode"],
  },
  {
    label: "Modals",
    features: ["info_modal", "admin_file_modal"],
  },
  {
    label: "Calendar",
    features: ["gantt_chart_tab"],
  },
  {
    label: "Team Tabs",
    features: [
      "team_members_tab",
      "rolladex_tab",
      "holiday_tab",
      "view_all_holidays",
    ],
  },
  {
    label: "Special",
    features: ["timesheet_summary", "hr_folders", "resource_planning"],
  },
];

export const ALL_FEATURES: Feature[] = FEATURE_CATEGORIES.flatMap(
  (c) => c.features,
);

const DEFAULT_CONFIG: Record<AppRole, Feature[]> = {
  "Super Admin": ALL_FEATURES,
  Admin: [
    "view_all_projects",
    "create_project",
    "edit_project",
    "delete_project",
    "create_stage",
    "edit_stage",
    "create_task",
    "edit_any_task",
    "view_admin_folders",
    "delete_any_file",
    "share_folders",
    "manage_team",
    "view_permissions_grid",
    "resource_planning",
    "budget_tab",
    "proposal_tab",
    "teamtalk_tab",
    "info_modal",
    "admin_file_modal",
    "focus_mode",
    "gantt_chart_tab",
    "team_members_tab",
    "rolladex_tab",
    "holiday_tab",
    "view_all_holidays",
  ],
  Standard: [
    "view_all_projects",
    "create_stage",
    "edit_stage",
    "create_task",
    "edit_any_task",
    "resource_planning",
    "budget_tab",
    "teamtalk_tab",
    "info_modal",
    "focus_mode",
    "gantt_chart_tab",
    "holiday_tab",
  ],
  Freelancer: ["create_task", "holiday_tab"],
};

export const ALL_PAGES: NavPage[] = [
  "board",
  "files",
  "calendar",
  "timeline",
  "team",
  "messages",
  "sales",
  "analysis",
  "settings",
];

const ROLE_DEFAULT_PAGES: Record<AppRole, NavPage[]> = {
  "Super Admin": ALL_PAGES,
  Admin: [
    "board",
    "files",
    "calendar",
    "timeline",
    "team",
    "messages",
    "sales",
    "settings",
  ],
  Standard: ["board", "files", "calendar", "timeline", "messages"],
  Freelancer: ["board", "messages"],
};

const STORAGE_KEY = "orca_permissions_config";
export type PermissionsConfig = Record<AppRole, Feature[]>;

export function loadPermissionsConfig(): PermissionsConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, "Super Admin": ALL_FEATURES };
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
}

export function savePermissionsConfig(config: PermissionsConfig) {
  config["Super Admin"] = ALL_FEATURES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function hasPermission(role: AppRole, feature: Feature): boolean {
  if (role === "Super Admin") return true;
  const config = loadPermissionsConfig();
  return config[role]?.includes(feature) ?? false;
}

export function canAccessPage(
  role: AppRole,
  page: NavPage,
  allowedPages?: NavPage[],
): boolean {
  if (role === "Super Admin") return true;
  if (allowedPages && allowedPages.length > 0)
    return allowedPages.includes(page);
  return ROLE_DEFAULT_PAGES[role]?.includes(page) ?? false;
}

export function getPageLabel(p: NavPage): string {
  const m: Record<NavPage, string> = {
    board: "Board",
    files: "Files",
    calendar: "Calendar",
    timeline: "Timeline",
    team: "Team",
    messages: "Messages",
    sales: "Sales",
    analysis: "Analysis",
    settings: "Settings",
  };
  return m[p] || p;
}
