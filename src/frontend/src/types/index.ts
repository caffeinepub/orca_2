export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: "Admin" | "Standard" | "Freelancer";
  avatarColor: string;
  isPlaceholder: boolean;
  jobTitle?: string;
  email?: string;
  permission?: "View Only" | "Can Edit" | "Full Access";
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdBy?: string;
  archived?: boolean;
  teamMembers?: TeamMember[];
  order?: number;
}

export interface Stage {
  id: string;
  projectId: string;
  name: string;
  order: number;
  startDate?: string;
  endDate?: string;
  color?: string;
  collapsed?: boolean;
  archived?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  completed?: boolean;
}

export interface Task {
  id: string;
  stageId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignees?: string[];
  dueDate?: string;
  status: "todo" | "in-progress" | "done";
  order: number;
  archived?: boolean;
  checklist?: ChecklistItem[];
  color?: string;
  isMilestone?: boolean;
  milestone?: boolean;
  completed?: boolean;
  cardColor?: string | null;
}

export const PROJECT_COLORS = [
  "#f8f9fa",
  "#e9ecef",
  "#dee2e6",
  "#ced4da",
  "#adb5bd",
  "#6c757d",
  "#495057",
  "#343a40",
  "#212529",
  "#000000",
  "#ff006e",
  "#fb5607",
  "#ffbe0b",
  "#8ac926",
  "#1982c4",
  "#6a4c93",
  "#ff0054",
  "#06ffa5",
  "#fffb00",
  "#ff3864",
  "#ffc8dd",
  "#ffafcc",
  "#bde0fe",
  "#a2d2ff",
  "#cdb4db",
  "#ffc6ff",
  "#caffbf",
  "#fdffb6",
  "#ffd6a5",
  "#ffadad",
  "#e0aaff",
  "#c77dff",
  "#9d4edd",
  "#d8e2dc",
  "#ffe5d9",
  "#ffd7ba",
  "#fec89a",
  "#f9dcc4",
  "#f8edeb",
  "#fae1dd",
  "#e8f4f8",
  "#fef3e2",
  "#f0e6ef",
  "#e6f3e6",
  "#fff5e6",
  "#e8e8f5",
  "#ffeef0",
  "#f5f0e8",
  "#e6f7f7",
  "#f8e8f0",
];
