import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PROJECT_COLORS, type Stage } from "@/types";
import { useEffect, useState } from "react";

interface StageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Stage>) => void;
  onDelete: () => void;
  stage: Stage | null;
}

export default function StageModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  stage,
}: StageModalProps) {
  const [name, setName] = useState(stage?.name ?? "");
  const [startDate, setStartDate] = useState(stage?.startDate ?? "");
  const [endDate, setEndDate] = useState(stage?.endDate ?? "");
  const [selectedColor, setSelectedColor] = useState(stage?.color ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (stage) {
      setName(stage.name);
      setStartDate(stage.startDate || "");
      setEndDate(stage.endDate || "");
      setSelectedColor(stage.color || "");
      setConfirmDelete(false);
    }
  }, [stage]);

  const handleSave = () => {
    onSave({
      name: name.trim() || (stage?.name ?? ""),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      color: selectedColor,
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      data-ocid="stage.modal"
    >
      <DialogContent className="w-[420px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Edit Stage</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="stage-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Stage Name
            </label>
            <input
              id="stage-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") onClose();
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              // biome-ignore lint/a11y/noAutofocus: modal input should be focused on open
              autoFocus
              data-ocid="stage.modal.name.input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="stage-start-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Start Date
              </label>
              <input
                id="stage-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="stage.modal.start_date.input"
              />
            </div>
            <div>
              <label
                htmlFor="stage-end-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                End Date
              </label>
              <input
                id="stage-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="stage.modal.end_date.input"
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Stage Colour
            </p>
            <div className="grid grid-cols-10 gap-0">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{
                    backgroundColor: c,
                    width: "100%",
                    aspectRatio: "1",
                    border:
                      selectedColor === c
                        ? "2px solid #3b82f6"
                        : "1px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    padding: 0,
                    margin: 0,
                  }}
                  title={c}
                  data-ocid="stage.modal.color.toggle"
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="mr-auto">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded-lg"
                data-ocid="stage.modal.delete.button"
              >
                Delete
              </button>
            ) : (
              <button
                type="button"
                onClick={onDelete}
                className="px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg"
                data-ocid="stage.modal.confirm_delete.button"
              >
                Confirm
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg"
              data-ocid="stage.modal.cancel.button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-ocid="stage.modal.save.button"
            >
              Save
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
