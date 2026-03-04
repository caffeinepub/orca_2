import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#64748b",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: string) => void;
}

export function CreateProjectModal({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim(), color);
    setName("");
    setColor(COLORS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="create_project.dialog">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
            data-ocid="create_project.input"
          />
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform"
                style={{
                  background: c,
                  transform: color === c ? "scale(1.25)" : "scale(1)",
                  outline: color === c ? "2px solid white" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full"
            data-ocid="create_project.submit_button"
          >
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
