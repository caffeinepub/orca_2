import Board from "@/components/Board";
import type { Project, Stage, Task } from "@/types";

interface BoardPageProps {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
  searchQuery?: string;
  showArchived?: boolean;
  focusedProjectId?: string | null;
  onToggleFocus?: (projectId: string) => void;
  onNavigateToFiles?: (
    projectId: string,
    folderType: "project" | "project_admin",
  ) => void;
  onCreateProject: (name: string, color: string) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onArchiveProject: (id: string, archived: boolean) => void;
  onCreateStage: (projectId: string, name: string) => void;
  onUpdateStage: (id: string, updates: Partial<Stage>) => void;
  onDeleteStage: (id: string) => void;
  onCreateTask: (stageId: string, title: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export default function BoardPage(props: BoardPageProps) {
  return <Board {...props} />;
}
