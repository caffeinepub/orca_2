import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ChecklistItem, Task } from "@/types";
import { generateId } from "@/utils/storage";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSave: (t: Task) => void;
  onArchive: (id: string) => void;
}

export function TaskEditModal({
  task,
  open,
  onClose,
  onSave,
  onArchive,
}: Props) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] = useState<Task["priority"]>(undefined);
  const [dueDate, setDueDate] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDesc(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate || "");
      setChecklist(task.checklist);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    onSave({
      ...task,
      title,
      description: desc,
      status,
      priority,
      dueDate: dueDate || undefined,
      checklist,
      completed: status === "done",
    });
  };
  const addItem = () => {
    if (!newItem.trim()) return;
    setChecklist([
      ...checklist,
      { id: generateId(), text: newItem.trim(), done: false },
    ]);
    setNewItem("");
  };
  const toggleItem = (id: string) =>
    setChecklist(
      checklist.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    );
  const removeItem = (id: string) =>
    setChecklist(checklist.filter((i) => i.id !== id));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
        data-ocid="task_edit.dialog"
      >
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            data-ocid="task_edit.input"
          />
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description..."
            rows={3}
            data-ocid="task_edit.textarea"
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="task-status"
                className="text-xs text-muted-foreground mb-1 block"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                data-ocid="task_edit.status.select"
              >
                <option value="todo">Todo</option>
                <option value="inProgress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="task-priority"
                className="text-xs text-muted-foreground mb-1 block"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority || ""}
                onChange={(e) =>
                  setPriority((e.target.value || undefined) as Task["priority"])
                }
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                data-ocid="task_edit.priority.select"
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="task-duedate"
                className="text-xs text-muted-foreground mb-1 block"
              >
                Due date
              </label>
              <Input
                id="task-duedate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                data-ocid="task_edit.duedate.input"
              />
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground mb-2 block">
              Checklist ({checklist.filter((i) => i.done).length}/
              {checklist.length})
            </span>
            <div className="space-y-1.5">
              {checklist.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id)}
                    className="rounded"
                    data-ocid={`task_edit.checklist.checkbox.${idx + 1}`}
                  />
                  <span
                    className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                    data-ocid={`task_edit.checklist.delete_button.${idx + 1}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add item..."
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                className="flex-1"
                data-ocid="task_edit.checklist.input"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addItem}
                data-ocid="task_edit.checklist.secondary_button"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              className="flex-1"
              data-ocid="task_edit.save_button"
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => onArchive(task.id)}
              data-ocid="task_edit.delete_button"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
