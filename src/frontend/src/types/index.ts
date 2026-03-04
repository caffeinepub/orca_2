export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  order: number;
  teamMembers: TeamMember[];
}

export interface TeamMember {
  id: string;
  name: string;
  jobTitle: string;
  role: string;
  email?: string;
}

export interface Stage {
  id: string;
  projectId: string;
  name: string;
  color: string;
  order: number;
  startDate?: string;
  endDate?: string;
}

export interface Task {
  id: string;
  stageId: string;
  title: string;
  description?: string;
  status: "todo" | "inProgress" | "done";
  order: number;
  archived: boolean;
  assignees: string[];
  checklist: ChecklistItem[];
  completed: boolean;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}
