import { Button } from "@/components/ui/button";
import type { Project, Stage, Task } from "@/types";
import { EyeOff, Plus } from "lucide-react";
import { useState } from "react";
import ProjectCard from "./ProjectCard";
import NewProjectModal from "./modals/NewProjectModal";

interface BoardProps {
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
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onArchiveProject: (projectId: string, archived: boolean) => void;
  onCreateStage: (projectId: string, name: string) => void;
  onUpdateStage: (stageId: string, updates: Partial<Stage>) => void;
  onDeleteStage: (stageId: string) => void;
  onCreateTask: (stageId: string, title: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function Board({
  projects,
  stages,
  tasks,
  searchQuery = "",
  showArchived = false,
  focusedProjectId,
  onToggleFocus,
  onNavigateToFiles,
  onCreateProject,
  onDeleteProject,
  onUpdateProject,
  onArchiveProject,
  onCreateStage,
  onUpdateStage,
  onDeleteStage,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: BoardProps) {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(
    null,
  );

  const filteredProjects = projects
    .filter((p) => {
      if (focusedProjectId && p.id !== focusedProjectId) return false;
      if (!showArchived && p.archived) return false;
      return (
        !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleProjectDragOver = (
    e: React.DragEvent,
    targetProjectId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedProjectId = e.dataTransfer.types.includes("projectid")
      ? e.dataTransfer.getData("projectId")
      : null;
    if (draggedProjectId && draggedProjectId !== targetProjectId) {
      e.dataTransfer.dropEffect = "move";
      setDragOverProjectId(targetProjectId);
    }
  };

  const handleProjectDrop = (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverProjectId(null);
    const draggedProjectId = e.dataTransfer.getData("projectId");
    if (!draggedProjectId || draggedProjectId === targetProjectId) return;

    const sortedProjects = [...projects].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    const draggedIndex = sortedProjects.findIndex(
      (p) => p.id === draggedProjectId,
    );
    const targetIndex = sortedProjects.findIndex(
      (p) => p.id === targetProjectId,
    );
    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...sortedProjects];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);
    reordered.forEach((project, index) => {
      if (project.order !== index)
        onUpdateProject(project.id, { order: index });
    });
  };

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex flex-col gap-4 p-6 min-h-full">
        {focusedProjectId && onToggleFocus && (
          <Button
            variant="outline"
            onClick={() => onToggleFocus(focusedProjectId)}
            className="self-start"
          >
            <EyeOff className="w-4 h-4 mr-2" aria-hidden="true" /> Show All
            Projects
          </Button>
        )}
        <div className="flex gap-4 items-start">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onDragOver={(e) => handleProjectDragOver(e, project.id)}
              onDragLeave={() => setDragOverProjectId(null)}
              onDrop={(e) => handleProjectDrop(e, project.id)}
              className={`transition-all ${dragOverProjectId === project.id ? "ring-2 ring-blue-400 rounded-lg" : ""} ${project.archived ? "opacity-50" : ""}`}
            >
              <ProjectCard
                project={project}
                stages={stages.filter((s) => s.projectId === project.id)}
                tasks={tasks.filter((t) => {
                  const ts = stages.find((s) => s.id === t.stageId);
                  return ts?.projectId === project.id;
                })}
                isFocused={focusedProjectId === project.id}
                onToggleFocus={
                  onToggleFocus ? () => onToggleFocus(project.id) : undefined
                }
                showArchived={showArchived}
                onCreateStage={(name) => onCreateStage(project.id, name)}
                onDeleteProject={() => onDeleteProject(project.id)}
                onUpdateProject={(name, color) =>
                  onUpdateProject(project.id, { name, color })
                }
                onArchiveProject={(archived) =>
                  onArchiveProject(project.id, archived)
                }
                onNavigateToFiles={
                  onNavigateToFiles
                    ? (folderType) => onNavigateToFiles(project.id, folderType)
                    : undefined
                }
                onUpdateStage={onUpdateStage}
                onDeleteStage={onDeleteStage}
                onCreateTask={onCreateTask}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setShowNewProjectModal(true)}
            data-ocid="board.add_project.primary_button"
            className="min-w-[320px] max-w-[400px] h-[200px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-muted-foreground hover:text-foreground transition flex-shrink-0"
          >
            <Plus className="w-8 h-8" aria-hidden="true" />
            <span className="font-medium">New Project</span>
          </button>
        </div>
      </div>
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreateProject={(name, color) => {
          onCreateProject(name, color);
          setShowNewProjectModal(false);
        }}
      />
    </div>
  );
}
