import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PROJECT_COLORS } from "@/types";
import { useState } from "react";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, color: string) => void;
}

export default function NewProjectModal({
  isOpen,
  onClose,
  onCreateProject,
}: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[14]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreateProject(name.trim(), selectedColor);
    setName("");
    setSelectedColor(PROJECT_COLORS[14]);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      data-ocid="new_project.modal"
    >
      <DialogContent className="w-[480px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="new-project-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Project Name
            </label>
            <input
              id="new-project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter project name..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              // biome-ignore lint/a11y/noAutofocus: modal input should be focused on open
              autoFocus
              data-ocid="new_project.name.input"
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
                  data-ocid="new_project.color.toggle"
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
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
            data-ocid="new_project.cancel.button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            data-ocid="new_project.submit.button"
          >
            Create Project
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
