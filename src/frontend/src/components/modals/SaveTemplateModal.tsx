import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project, Stage, Task } from "@/types";
import { saveProjectAsTemplate } from "@/utils/templateStorage";
import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  stages: Stage[];
  tasks: Task[];
}

export default function SaveTemplateModal({
  isOpen,
  onClose,
  project,
  stages,
  tasks,
}: Props) {
  const [name, setName] = useState(`${project.name} Template`);
  const [includeStages, setIncludeStages] = useState(true);
  const [includeStageDates, setIncludeStageDates] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeMilestones, setIncludeMilestones] = useState(true);
  const [includeBudget, setIncludeBudget] = useState(true);
  const [includeCustomFields, setIncludeCustomFields] = useState(true);

  const projectStages = stages.filter((s) => s.projectId === project.id);
  const projectTasks = tasks.filter((t) =>
    projectStages.some((s) => s.id === t.stageId),
  );

  const handleSave = () => {
    if (!name.trim()) return;
    saveProjectAsTemplate(project, stages, tasks, {
      name: name.trim(),
      includeStages,
      includeStageDates,
      includeTasks,
      includeMilestones,
      includeBudget,
      includeCustomFields,
    });
    onClose();
  };

  const checks = [
    {
      label: "Stages",
      desc: `${projectStages.length} stages`,
      value: includeStages,
      set: setIncludeStages,
    },
    {
      label: "Stage Dates",
      desc: "Start and end dates",
      value: includeStageDates,
      set: setIncludeStageDates,
    },
    {
      label: "Tasks",
      desc: `${projectTasks.length} tasks`,
      value: includeTasks,
      set: setIncludeTasks,
    },
    {
      label: "Milestones",
      desc: `${projectTasks.filter((t) => t.milestone || t.isMilestone).length} milestones`,
      value: includeMilestones,
      set: setIncludeMilestones,
    },
    {
      label: "Working Budget",
      desc: "Line items and rates",
      value: includeBudget,
      set: setIncludeBudget,
    },
    {
      label: "Custom Fields",
      desc: "Project data fields",
      value: includeCustomFields,
      set: setIncludeCustomFields,
    },
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="w-[480px] max-w-[90vw]"
        data-ocid="save_template.modal"
      >
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="save-template-name"
              className="block text-xs font-medium text-gray-500 mb-1"
            >
              Template Name
            </label>
            <input
              id="save-template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              // biome-ignore lint/a11y/noAutofocus: modal input should be focused on open
              autoFocus
              data-ocid="save_template.name.input"
            />
          </div>
          <div>
            <p className="block text-xs font-medium text-gray-500 mb-2">
              Include
            </p>
            <div className="space-y-2">
              {checks.map((c) => (
                <label
                  key={c.label}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={c.value}
                    onChange={(e) => c.set(e.target.checked)}
                    className="rounded"
                    data-ocid={`save_template.${c.label.toLowerCase().replace(/ /g, "_")}.checkbox`}
                  />
                  <div>
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className="text-xs text-gray-400">{c.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {/* Preview */}
          <div className="p-3 bg-gray-50 rounded text-xs text-gray-600">
            <div className="font-medium text-gray-700 mb-1">Preview</div>
            {includeStages && (
              <div>
                {projectStages.length} stages
                {includeStageDates ? " with dates" : ""}
              </div>
            )}
            {includeTasks && <div>{projectTasks.length} tasks</div>}
            {includeBudget && <div>Budget structure</div>}
            {includeCustomFields && <div>Custom fields</div>}
            {!includeStages &&
              !includeTasks &&
              !includeBudget &&
              !includeCustomFields && (
                <div className="text-gray-400">Nothing selected</div>
              )}
          </div>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg"
            data-ocid="save_template.cancel.button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            data-ocid="save_template.submit.button"
          >
            Save Template
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
