import type { Project, Stage, Task } from "@/types";
import {
  Eye,
  EyeOff,
  FolderOpen,
  Info,
  MoreVertical,
  Plus,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import StageSection from "./StageSection";
import EditProjectModal from "./modals/EditProjectModal";
import ProjectMembersModal from "./modals/ProjectMembersModal";

interface ProjectCardProps {
  project: Project;
  stages: Stage[];
  tasks: Task[];
  isFocused?: boolean;
  showArchived?: boolean;
  onToggleFocus?: () => void;
  onNavigateToFiles?: (folderType: "project" | "project_admin") => void;
  onCreateStage: (name: string) => void;
  onDeleteProject: () => void;
  onUpdateProject: (name: string, color: string) => void;
  onArchiveProject: (archived: boolean) => void;
  onUpdateStage: (stageId: string, updates: Partial<Stage>) => void;
  onDeleteStage: (stageId: string) => void;
  onCreateTask: (stageId: string, title: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function ProjectCard({
  project,
  stages,
  tasks,
  isFocused,
  showArchived,
  onToggleFocus,
  onNavigateToFiles,
  onCreateStage,
  onDeleteProject,
  onUpdateProject,
  onArchiveProject,
  onUpdateStage,
  onDeleteStage,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: ProjectCardProps) {
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [isDragOverProject, setIsDragOverProject] = useState(false);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const stageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);
  useEffect(() => {
    if (isAddingStage && stageInputRef.current) {
      stageInputRef.current.focus();
    }
  }, [isAddingStage]);

  const handleAddStage = () => {
    setIsAddingStage(true);
    setNewStageName("");
  };
  const handleStageSubmit = () => {
    if (newStageName.trim()) onCreateStage(newStageName.trim());
    setIsAddingStage(false);
    setNewStageName("");
  };
  const handleStageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleStageSubmit();
    if (e.key === "Escape") {
      setIsAddingStage(false);
      setNewStageName("");
    }
  };
  const handleNameActivate = () => {
    setIsEditingName(true);
    setEditedName(project.name);
  };
  const handleNameSave = () => {
    const t = editedName.trim();
    if (t && t !== project.name) onUpdateProject(t, project.color);
    setIsEditingName(false);
  };
  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNameSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditedName(project.name);
      setIsEditingName(false);
    }
  };

  const handleUpdateProjectTeamMembers = (updates: Partial<Project>) => {
    const storageKey = Object.keys(localStorage).find((k) =>
      k.includes("_projects"),
    );
    if (storageKey) {
      const allProjects = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const idx = allProjects.findIndex((p: Project) => p.id === project.id);
      if (idx >= 0) {
        allProjects[idx] = { ...allProjects[idx], ...updates };
        localStorage.setItem(storageKey, JSON.stringify(allProjects));
        window.dispatchEvent(new Event("storage"));
      }
    }
    if (updates.name !== undefined || updates.color !== undefined)
      onUpdateProject(
        updates.name || project.name,
        updates.color || project.color,
      );
  };

  const handleProjectDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("projectId", project.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleProjectDragEnd = () => {
    setIsDragging(false);
  };

  const handleStageDragOver = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedStageId = e.dataTransfer.getData("stageId");
    if (draggedStageId) {
      const ds = stages.find((s) => s.id === draggedStageId);
      if (ds && ds.projectId === project.id) {
        e.dataTransfer.dropEffect = "move";
        setDragOverStageId(targetStageId);
      }
    }
  };
  const handleStageDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStageId(null);
    const draggedStageId = e.dataTransfer.getData("stageId");
    if (!draggedStageId || draggedStageId === targetStageId) return;
    const ds = stages.find((s) => s.id === draggedStageId);
    if (!ds || ds.projectId !== project.id) return;
    const sorted = [...stages].sort((a, b) => a.order - b.order);
    const di = sorted.findIndex((s) => s.id === draggedStageId);
    const ti = sorted.findIndex((s) => s.id === targetStageId);
    if (di === -1 || ti === -1) return;
    const reordered = [...sorted];
    const [removed] = reordered.splice(di, 1);
    reordered.splice(ti, 0, removed);
    reordered.forEach((stage, index) => {
      if (stage.order !== index) onUpdateStage(stage.id, { order: index });
    });
  };

  const handleStagesContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const stageId = e.dataTransfer.getData("stageId");
    const sourceProjectId = e.dataTransfer.getData("sourceProjectId");
    if (stageId && sourceProjectId && sourceProjectId !== project.id) {
      e.dataTransfer.dropEffect = "move";
      setIsDragOverProject(true);
    }
  };
  const handleStagesContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverProject(false);
    const stageId = e.dataTransfer.getData("stageId");
    const sourceProjectId = e.dataTransfer.getData("sourceProjectId");
    if (!stageId || !sourceProjectId || sourceProjectId === project.id) return;
    const maxOrder =
      stages.length > 0 ? Math.max(...stages.map((s) => s.order)) : -1;
    onUpdateStage(stageId, { projectId: project.id, order: maxOrder + 1 });
  };

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <>
      <div
        draggable={true}
        onDragStart={handleProjectDragStart}
        onDragEnd={handleProjectDragEnd}
        className={`w-96 rounded-lg shadow-lg overflow-hidden transition-all flex-shrink-0 ${isDragging ? "opacity-50 scale-95" : ""} ${isFocused ? "ring-2 ring-blue-500" : ""} ${project.archived ? "opacity-50" : ""}`}
        style={{ backgroundColor: project.color }}
      >
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            {isEditingName ? (
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={handleNameSave}
                className="text-xl font-bold text-gray-800 bg-white/50 border border-gray-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                data-ocid="project.name.input"
              />
            ) : (
              <div className="flex items-center flex-1">
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: inline name editing on card header */}
                <h2
                  className="text-xl font-bold text-gray-800 cursor-pointer hover:bg-white/20 rounded px-2 py-1 -mx-2"
                  onClick={handleNameActivate}
                  data-ocid="project.name.heading"
                >
                  {project.name}
                </h2>
                {project.archived && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full ml-2">
                    Archived
                  </span>
                )}
              </div>
            )}
          </div>

          {/* === ICON BAR — exact ORCA Clean order === */}
          <div className="flex items-center justify-end gap-[15px]">
            {/* 1. Files (grey) */}
            <button
              type="button"
              onClick={() => onNavigateToFiles?.("project")}
              style={{ width: "14px", height: "14px" }}
              title="Files"
              data-ocid="project.files.button"
            >
              <FolderOpen
                className="w-full h-full text-gray-500"
                aria-hidden="true"
              />
            </button>
            {/* 2. Admin Files (yellow) */}
            <button
              type="button"
              onClick={() => onNavigateToFiles?.("project_admin")}
              style={{ width: "14px", height: "14px" }}
              title="Admin Files"
              data-ocid="project.admin_files.button"
            >
              <FolderOpen
                className="w-full h-full text-yellow-500"
                aria-hidden="true"
              />
            </button>
            {/* 3. Team */}
            <button
              type="button"
              onClick={() => setShowMembersModal(true)}
              style={{ width: "14px", height: "14px" }}
              title="Team"
              data-ocid="project.members.open_modal_button"
            >
              <Users
                className="w-full h-full text-gray-500"
                aria-hidden="true"
              />
            </button>
            {/* 4. Info */}
            <button
              type="button"
              onClick={() => alert("Project Info — coming soon")}
              style={{ width: "14px", height: "14px" }}
              title="Info"
              data-ocid="project.info.button"
            >
              <Info
                className="w-full h-full text-gray-500"
                aria-hidden="true"
              />
            </button>
            {/* 5. Focus */}
            {onToggleFocus && (
              <button
                type="button"
                onClick={onToggleFocus}
                style={{ width: "14px", height: "14px" }}
                title={
                  isFocused ? "Show all projects" : "Focus on this project"
                }
                data-ocid="project.focus.toggle"
              >
                {isFocused ? (
                  <EyeOff
                    className="w-full h-full text-blue-600"
                    aria-hidden="true"
                  />
                ) : (
                  <Eye
                    className="w-full h-full text-gray-500"
                    aria-hidden="true"
                  />
                )}
              </button>
            )}
            {/* 6. Add Stage */}
            <button
              type="button"
              onClick={handleAddStage}
              style={{ width: "14px", height: "14px" }}
              title="Add Stage"
              data-ocid="project.add_stage.button"
            >
              <Plus
                className="w-full h-full text-gray-500"
                aria-hidden="true"
              />
            </button>
            {/* 7. Menu / Edit */}
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              style={{ width: "14px", height: "14px" }}
              title="Menu"
              data-ocid="project.edit.open_modal_button"
            >
              <MoreVertical
                className="w-full h-full text-gray-500"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Stages */}
        <div
          className={`p-4 pt-0 space-y-3 transition-all ${isDragOverProject ? "ring-2 ring-blue-500 ring-inset" : ""}`}
          onDragOver={handleStagesContainerDragOver}
          onDragLeave={() => setIsDragOverProject(false)}
          onDrop={handleStagesContainerDrop}
        >
          {isAddingStage && (
            <div className="p-3 border-2 border-blue-400 rounded-lg bg-white/90">
              <input
                ref={stageInputRef}
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={handleStageKeyDown}
                onBlur={handleStageSubmit}
                placeholder="Stage name..."
                className="w-full text-sm font-medium border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="project.new_stage.input"
              />
            </div>
          )}
          {sortedStages.map((stage) => (
            <div
              key={stage.id}
              onDragOver={(e) => handleStageDragOver(e, stage.id)}
              onDragLeave={() => setDragOverStageId(null)}
              onDrop={(e) => handleStageDrop(e, stage.id)}
              className={
                dragOverStageId === stage.id
                  ? "ring-2 ring-blue-400 rounded-lg"
                  : ""
              }
            >
              <StageSection
                stage={stage}
                tasks={tasks.filter((t) => t.stageId === stage.id)}
                showArchived={showArchived}
                onUpdate={(updates) => onUpdateStage(stage.id, updates)}
                onDelete={() => onDeleteStage(stage.id)}
                onCreateTask={(title) => onCreateTask(stage.id, title)}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                allStages={stages}
                teamMembers={project.teamMembers}
              />
            </div>
          ))}
          {sortedStages.length === 0 && !isAddingStage && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400 mb-2">No stages yet</p>
              <button
                type="button"
                onClick={handleAddStage}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
                data-ocid="project.stages.empty_state.primary_button"
              >
                Add a stage
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProjectMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        project={project}
        onUpdateProject={handleUpdateProjectTeamMembers}
      />
      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        project={project}
        onSave={(updates) => {
          if (updates.name !== undefined || updates.color !== undefined)
            onUpdateProject(
              updates.name || project.name,
              updates.color || project.color,
            );
          setShowEditModal(false);
        }}
        onArchive={() => {
          onArchiveProject(!project.archived);
          setShowEditModal(false);
        }}
        onDelete={() => {
          onDeleteProject();
          setShowEditModal(false);
        }}
      />
    </>
  );
}
