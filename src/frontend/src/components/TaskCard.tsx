import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Stage, Task, TeamMember } from "@/types";
import { Calendar, CheckSquare, Flag, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TaskModal from "./modals/TaskModal";

interface TaskCardProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  stages?: Stage[];
  teamMembers?: TeamMember[];
  stage?: Stage;
}

export default function TaskCard({
  task,
  onUpdate,
  onDelete,
  stages,
  teamMembers,
  stage,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [showModal, setShowModal] = useState(false);
  const [showAssigneePopover, setShowAssigneePopover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTitleClick = () => {
    setIsEditing(true);
    setEditedTitle(task.title);
  };
  const handleTitleBlur = () => {
    if (editedTitle.trim() && editedTitle !== task.title)
      onUpdate({ title: editedTitle.trim() });
    else setEditedTitle(task.title);
    setIsEditing(false);
  };
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTitleBlur();
    else if (e.key === "Escape") {
      setEditedTitle(task.title);
      setIsEditing(false);
    }
  };
  const handleCheckboxChange = (checked: boolean) => {
    onUpdate({ status: checked ? "done" : "todo" });
  };
  const handleAssigneeToggle = (memberId: string) => {
    const current = task.assignees || [];
    const updated = current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId];
    onUpdate({ assignees: updated });
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";
  const checkedCount =
    task.checklist?.filter((item) => item.checked || item.completed).length ||
    0;
  const totalCount = task.checklist?.length || 0;
  const assignedMembers = (teamMembers || []).filter((m) =>
    (task.assignees || []).includes(m.id),
  );
  const visibleAssignees = assignedMembers.slice(0, 3);
  const remainingCount = assignedMembers.length - 3;

  return (
    <>
      <div
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData("taskId", task.id);
          e.dataTransfer.setData("stageId", task.stageId);
        }}
        className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        style={
          task.cardColor ? { borderLeft: `4px solid ${task.cardColor}` } : {}
        }
        data-ocid="task.card"
      >
        <div className="flex items-start gap-2">
          <Checkbox
            checked={task.status === "done"}
            onCheckedChange={handleCheckboxChange}
            className="mt-0.5"
            data-ocid="task.complete.checkbox"
          />
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="w-full text-sm font-medium border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="task.title.input"
              />
            ) : (
              // biome-ignore lint/a11y/useKeyWithClickEvents: inline title editing is a supplementary pointer shortcut; modal provides full keyboard access
              <div
                onClick={handleTitleClick}
                className={`text-sm font-medium ${task.status === "done" ? "line-through text-gray-500" : "text-gray-900"}`}
                data-ocid="task.title.text"
              >
                {task.title}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {(task.isMilestone || task.milestone) && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Flag className="w-3 h-3" aria-hidden="true" />
                </div>
              )}
              {task.dueDate && (
                <div
                  className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-600 font-medium" : "text-gray-500"}`}
                >
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  <span>
                    {new Date(task.dueDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
              )}
              {totalCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CheckSquare className="w-3 h-3" aria-hidden="true" />
                  <span>
                    {checkedCount}/{totalCount}
                  </span>
                </div>
              )}
              {assignedMembers.length > 0 && (
                <Popover
                  open={showAssigneePopover}
                  onOpenChange={setShowAssigneePopover}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center -space-x-1 hover:opacity-80"
                      data-ocid="task.assignee.toggle"
                    >
                      {visibleAssignees.map((member) => (
                        <div
                          key={member.id}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-white"
                          style={{ backgroundColor: member.avatarColor }}
                          title={member.name}
                        >
                          {member.initials}
                        </div>
                      ))}
                      {remainingCount > 0 && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-300 text-gray-700 text-[8px] font-bold border border-white">
                          +{remainingCount}
                        </div>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 p-2"
                    align="start"
                    data-ocid="task.assignee.popover"
                  >
                    <div className="text-xs font-semibold mb-2">Assign to:</div>
                    <div className="space-y-1">
                      {(teamMembers || []).map((member) => {
                        const isAssigned = (task.assignees || []).includes(
                          member.id,
                        );
                        return (
                          <label
                            key={member.id}
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => handleAssigneeToggle(member.id)}
                              className="rounded"
                              data-ocid="task.assignee.checkbox"
                            />
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                              style={{ backgroundColor: member.avatarColor }}
                            >
                              {member.initials}
                            </div>
                            <span className="text-xs">{member.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            data-ocid="task.edit.open_modal_button"
          >
            <MoreVertical className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <TaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        task={task}
        stages={stages || []}
        stage={stage}
        teamMembers={teamMembers}
        onSave={(updates) => {
          onUpdate(updates);
          setShowModal(false);
        }}
        onDelete={() => {
          onDelete();
          setShowModal(false);
        }}
      />
    </>
  );
}
