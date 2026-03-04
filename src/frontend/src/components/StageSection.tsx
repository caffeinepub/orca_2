import type { Stage, Task, TeamMember } from "@/types";
import { ChevronDown, ChevronRight, MoreVertical, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TaskCard from "./TaskCard";
import StageModal from "./modals/StageModal";

interface StageSectionProps {
  stage: Stage;
  tasks: Task[];
  showArchived?: boolean;
  onUpdate: (updates: Partial<Stage>) => void;
  onDelete: () => void;
  onCreateTask: (title: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  allStages?: Stage[];
  teamMembers?: TeamMember[];
}

export default function StageSection({
  stage,
  tasks,
  showArchived,
  onUpdate,
  onDelete,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  allStages,
  teamMembers,
}: StageSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const taskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingTask && taskInputRef.current) taskInputRef.current.focus();
  }, [isAddingTask]);

  const fmtDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getFullYear()).slice(-2)}`;
  };

  const handleTaskDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };
  const handleTaskDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleTaskDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    const sourceStageId = e.dataTransfer.getData("stageId");
    if (!taskId || sourceStageId === stage.id) return;
    onUpdateTask(taskId, { stageId: stage.id, dueDate: undefined });
  };
  const handleTaskSubmit = () => {
    if (newTaskTitle.trim()) onCreateTask(newTaskTitle.trim());
    setIsAddingTask(false);
    setNewTaskTitle("");
  };
  const handleTaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTaskSubmit();
    if (e.key === "Escape") {
      setIsAddingTask(false);
      setNewTaskTitle("");
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
  const visibleTasks = sortedTasks.filter((t) => showArchived || !t.archived);

  return (
    <>
      <div
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData("stageId", stage.id);
          e.dataTransfer.setData("sourceProjectId", stage.projectId);
        }}
        className="rounded-lg p-3 border border-gray-200 shadow-sm transition-all backdrop-blur-sm"
        style={{ backgroundColor: stage.color || "rgba(255,255,255,0.9)" }}
      >
        <div className="flex justify-between items-center mb-2">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1"
            data-ocid="stage.collapse.toggle"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="font-medium text-sm">{stage.name}</span>
            <span className="text-xs text-gray-500 ml-2">
              ({visibleTasks.length})
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingTask(true);
                setNewTaskTitle("");
              }}
              className="text-gray-500 hover:text-gray-700"
              style={{ width: "14px", height: "14px" }}
              title="Add Task"
              data-ocid="stage.add_task.button"
            >
              <Plus className="w-full h-full" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="text-gray-500 hover:text-gray-700"
              style={{ width: "14px", height: "14px" }}
              title="Edit Stage"
              data-ocid="stage.edit.open_modal_button"
            >
              <MoreVertical className="w-full h-full" aria-hidden="true" />
            </button>
          </div>
        </div>
        {(stage.startDate || stage.endDate) && (
          <div className="text-xs text-gray-400 ml-6 -mt-1 mb-1">
            {fmtDate(stage.startDate) || "--/--/--"} -{" "}
            {fmtDate(stage.endDate) || "--/--/--"}
          </div>
        )}
        {!collapsed && (
          <div
            className={`space-y-2 min-h-[60px] rounded p-2 -m-2 transition-all ${isDragOver ? "ring-2 ring-blue-400 bg-blue-50/50" : ""}`}
            onDragOver={handleTaskDragOver}
            onDragLeave={handleTaskDragLeave}
            onDrop={handleTaskDrop}
          >
            {visibleTasks.map((task) => (
              <div key={task.id} className={task.archived ? "opacity-50" : ""}>
                <TaskCard
                  task={task}
                  onUpdate={(updates) => onUpdateTask(task.id, updates)}
                  onDelete={() => onDeleteTask(task.id)}
                  stages={allStages}
                  teamMembers={teamMembers}
                  stage={stage}
                />
              </div>
            ))}
            {isAddingTask && (
              <div className="p-2 border border-blue-400 rounded bg-white">
                <input
                  ref={taskInputRef}
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={handleTaskKeyDown}
                  onBlur={handleTaskSubmit}
                  placeholder="Task title..."
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="stage.new_task.input"
                />
              </div>
            )}
          </div>
        )}
      </div>
      <StageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(updates) => {
          onUpdate(updates);
          setIsModalOpen(false);
        }}
        onDelete={() => {
          onDelete();
          setIsModalOpen(false);
        }}
        stage={stage}
      />
    </>
  );
}
