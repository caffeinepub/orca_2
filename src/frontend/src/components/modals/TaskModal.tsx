import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type ChecklistItem,
  PROJECT_COLORS,
  type Stage,
  type Task,
  type TeamMember,
} from "@/types";
import { generateId } from "@/utils/storage";
import { Flag, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onSave: (updates: Partial<Task>) => void;
  onDelete: () => void;
  stages?: Stage[];
  stage?: Stage;
  teamMembers?: TeamMember[];
  allTasks?: Task[];
}

export default function TaskModal({
  isOpen,
  onClose,
  task,
  onSave,
  onDelete,
  stages,
  stage: _stage,
  teamMembers,
  allTasks = [],
}: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [stageId, setStageId] = useState(task.stageId);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    task.checklist || [],
  );
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [milestone, setMilestone] = useState(task.milestone || false);
  const [cardColor, setCardColor] = useState<string | null>(
    task.cardColor || null,
  );
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    task.assignees || [],
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dependencies, setDependencies] = useState<string[]>(
    task.dependencies || [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset all fields only when task.id changes (opening a different task)
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setDueDate(task.dueDate || "");
    setStageId(task.stageId);
    setChecklist(task.checklist || []);
    setMilestone(task.milestone || false);
    setCardColor(task.cardColor || null);
    setSelectedAssignees(task.assignees || []);
    setConfirmDelete(false);
    setDependencies(task.dependencies || []);
  }, [task.id]);

  const selectedStage = stages?.find((s) => s.id === stageId);

  const handleSave = () => {
    onSave({
      title: title.trim() || task.title,
      description: description || undefined,
      status,
      dueDate: dueDate || undefined,
      stageId,
      checklist,
      milestone,
      cardColor,
      assignees: selectedAssignees,
      completed: status === "done",
      dependencies,
    });
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist([
      ...checklist,
      { id: generateId(), text: newChecklistItem.trim(), checked: false },
    ]);
    setNewChecklistItem("");
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const toggleAssignee = (memberId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const checklistDone = checklist.filter((c) => c.checked).length;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      data-ocid="task.modal"
    >
      <DialogContent className="w-[560px] max-w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle>Task</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide"
            >
              Title
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-ocid="task.modal.title.input"
            />
          </div>
          <div>
            <label
              htmlFor="task-description"
              className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide"
            >
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add a description..."
              data-ocid="task.modal.description.textarea"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="task-status"
                className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="task.modal.status.select"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="task-due-date"
                className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide"
              >
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={selectedStage?.startDate || undefined}
                max={selectedStage?.endDate || undefined}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="task.modal.due_date.input"
              />
            </div>
          </div>
          {stages && stages.length > 0 && (
            <div>
              <label
                htmlFor="task-stage"
                className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide"
              >
                Stage
              </label>
              <select
                id="task-stage"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="task.modal.stage.select"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {teamMembers && teamMembers.length > 0 && (
            <div>
              <p className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Assignees
              </p>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleAssignee(member.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-all ${selectedAssignees.includes(member.id) ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"}`}
                    data-ocid="task.modal.assignee.toggle"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        backgroundColor: member.avatarColor || "#6366f1",
                      }}
                      aria-hidden="true"
                    >
                      {member.initials?.charAt(0) ||
                        member.name?.charAt(0) ||
                        "?"}
                    </div>
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Checklist{" "}
              {checklist.length > 0 && `(${checklistDone}/${checklist.length})`}
            </p>
            {checklist.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="rounded"
                      aria-label={item.text}
                      data-ocid="task.modal.checklist.checkbox"
                    />
                    <span
                      className={`text-sm flex-1 ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}
                    >
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="text-gray-300 hover:text-red-400"
                      data-ocid="task.modal.checklist.delete.button"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addChecklistItem();
                }}
                placeholder="Add checklist item..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="task.modal.checklist.input"
                aria-label="New checklist item"
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg"
                data-ocid="task.modal.checklist.add.button"
              >
                <Plus className="w-4 h-4 text-gray-600" aria-hidden="true" />
                <span className="sr-only">Add item</span>
              </button>
            </div>
          </div>
          <div>
            <p className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Dependencies
            </p>
            <div className="flex flex-wrap gap-1 mb-2">
              {dependencies.map((depId) => {
                const depTask = allTasks.find((t) => t.id === depId);
                return (
                  <span
                    key={depId}
                    className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs"
                  >
                    {depTask?.title || depId}
                    <button
                      type="button"
                      onClick={() =>
                        setDependencies((d) => d.filter((x) => x !== depId))
                      }
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value)
                  setDependencies((d) => [...d, e.target.value]);
              }}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Add dependency...</option>
              {allTasks
                .filter((t) => t.id !== task.id && !dependencies.includes(t.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label
              className="flex items-center gap-2 cursor-pointer"
              data-ocid="task.modal.milestone.checkbox"
            >
              <input
                type="checkbox"
                checked={milestone}
                onChange={(e) => setMilestone(e.target.checked)}
                className="rounded"
                aria-label="Milestone"
              />
              <Flag className="w-4 h-4 text-purple-500" aria-hidden="true" />
              <span className="text-sm text-gray-700">Milestone</span>
            </label>
          </div>
          <div>
            <p className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Card Color
            </p>
            <div className="grid grid-cols-10 gap-0">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCardColor(color)}
                  style={{
                    backgroundColor: color,
                    width: "100%",
                    aspectRatio: "1",
                    border:
                      cardColor === color
                        ? "2px solid #3b82f6"
                        : "1px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    padding: 0,
                    margin: 0,
                  }}
                  data-ocid="task.modal.card_color.toggle"
                />
              ))}
            </div>
            {cardColor && (
              <button
                type="button"
                onClick={() => setCardColor(null)}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                data-ocid="task.modal.card_color.clear.button"
              >
                Clear Color
              </button>
            )}
          </div>
        </div>
        <DialogFooter className="p-4 border-t flex-shrink-0">
          <div className="flex gap-2 justify-between w-full">
            <div>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded-lg"
                  data-ocid="task.modal.delete.button"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" /> Delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg"
                  data-ocid="task.modal.confirm_delete.button"
                >
                  Confirm Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg"
                data-ocid="task.modal.cancel.button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-ocid="task.modal.save.button"
              >
                Save
              </button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
