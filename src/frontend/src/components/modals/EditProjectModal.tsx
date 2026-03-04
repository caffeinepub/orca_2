import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PROJECT_COLORS, type Project } from "@/types";
import { useEffect, useState } from "react";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSave: (updates: Partial<Project>) => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function EditProjectModal({
  isOpen,
  onClose,
  project,
  onSave,
  onArchive,
  onDelete,
}: EditProjectModalProps) {
  const [name, setName] = useState(project.name);
  const [selectedColor, setSelectedColor] = useState(project.color);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset all fields when project identity changes
  useEffect(() => {
    setName(project.name);
    setSelectedColor(project.color);
    setConfirmDelete(false);
  }, [project.id, project.name, project.color]);

  const handleSave = () => {
    onSave({ name: name.trim() || project.name, color: selectedColor });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      data-ocid="edit_project.modal"
    >
      <DialogContent className="w-[480px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="edit-project-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Project Name
            </label>
            <input
              id="edit-project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              // biome-ignore lint/a11y/noAutofocus: modal input should be focused on open
              autoFocus
              data-ocid="edit_project.name.input"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Color</p>
            <div className="grid grid-cols-10 gap-0">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{
                    backgroundColor: color,
                    width: "100%",
                    aspectRatio: "1",
                    border:
                      selectedColor === color
                        ? "2px solid #3b82f6"
                        : "1px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    padding: 0,
                    margin: 0,
                  }}
                  title={color}
                  data-ocid="edit_project.color.toggle"
                />
              ))}
            </div>
          </div>
          <div
            className="p-3 rounded-lg border"
            style={{ backgroundColor: selectedColor }}
          >
            <p className="text-sm font-semibold text-gray-800">
              {name || "Project Preview"}
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 mr-auto">
            <button
              type="button"
              onClick={onArchive}
              className="px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 border border-amber-300 rounded-lg"
              data-ocid="edit_project.archive.button"
            >
              {project.archived ? "Unarchive" : "Archive"}
            </button>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded-lg"
                data-ocid="edit_project.delete.button"
              >
                Delete
              </button>
            ) : (
              <button
                type="button"
                onClick={onDelete}
                className="px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg"
                data-ocid="edit_project.confirm_delete.button"
              >
                Confirm Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
              data-ocid="edit_project.cancel.button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-ocid="edit_project.save.button"
            >
              Save
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
