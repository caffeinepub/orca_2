import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project, Stage, Task } from "@/types";
import type { CustomField, ProjectBudget } from "@/types/project";
import { generateId } from "@/utils/storage";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  stages: Stage[];
  tasks: Task[];
}

export default function ProjectInfoModal({
  isOpen,
  onClose,
  project,
  stages,
  tasks,
}: Props) {
  const [tab, setTab] = useState<"data" | "notes">("data");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState<ProjectBudget>({ stages: [] });
  const [copied, setCopied] = useState<string | null>(null);

  const storageKey = `orca_project_info_${project.id}`;

  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        setCustomFields(data.customFields || []);
        setNotes(data.notes || "");
        setBudget(data.budget || { stages: [] });
      } else {
        setCustomFields([]);
        setNotes("");
        setBudget({ stages: [] });
      }
    } catch {
      setCustomFields([]);
      setNotes("");
      setBudget({ stages: [] });
    }
    setTab("data");
  }, [isOpen, storageKey]);

  const save = (cf: CustomField[], n: string) => {
    const existing = JSON.parse(localStorage.getItem(storageKey) || "{}");
    localStorage.setItem(
      storageKey,
      JSON.stringify({ ...existing, customFields: cf, notes: n }),
    );
  };

  const addField = () => {
    const updated = [
      ...customFields,
      { id: generateId(), name: "", value: "" },
    ];
    setCustomFields(updated);
    save(updated, notes);
  };
  const updateField = (id: string, key: "name" | "value", val: string) => {
    const updated = customFields.map((f) =>
      f.id === id ? { ...f, [key]: val } : f,
    );
    setCustomFields(updated);
    save(updated, notes);
  };
  const removeField = (id: string) => {
    const updated = customFields.filter((f) => f.id !== id);
    setCustomFields(updated);
    save(updated, notes);
  };

  const copyVar = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  // Computed project data
  const projectStages = stages.filter((s) => s.projectId === project.id);
  const projectTasks = tasks.filter((t) =>
    projectStages.some((s) => s.id === t.stageId),
  );
  const allDates = projectStages.flatMap(
    (s) => [s.startDate, s.endDate].filter(Boolean) as string[],
  );
  const firstDate = allDates.length
    ? allDates.reduce((a, b) => (a < b ? a : b))
    : "";
  const lastDate = allDates.length
    ? allDates.reduce((a, b) => (a > b ? a : b))
    : "";
  const teamNames = (project.teamMembers || []).map((m) => m.name).join(", ");

  // Budget totals (read-only from budget data)
  const calcTotal = () => {
    let total = 0;
    let labour = 0;
    let materials = 0;
    for (const bs of budget.stages || []) {
      for (const l of bs.lines || []) {
        const isLab = l.type === "labour" || l.type === "labor";
        const unit = isLab
          ? (l.days || 0) * (l.rate || 0)
          : (l.howMany || 0) * (l.rate || 0);
        const markup = unit * ((l.markup || 0) / 100);
        const cont = (unit + markup) * ((l.contingency || 0) / 100);
        if (isLab) labour += unit;
        else materials += unit;
        total += unit + markup + cont;
      }
    }
    return { total, labour, materials };
  };
  const bv = calcTotal();
  const fmt = (v: number) =>
    `£${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Variable reference rows — grouped by category
  const varGroups = [
    {
      label: "Project",
      vars: [
        { key: "{{projectName}}", value: project.name },
        {
          key: "{{projectStart}}",
          value: firstDate
            ? new Date(firstDate).toLocaleDateString("en-GB")
            : "—",
        },
        {
          key: "{{projectEnd}}",
          value: lastDate
            ? new Date(lastDate).toLocaleDateString("en-GB")
            : "—",
        },
        { key: "{{totalStages}}", value: String(projectStages.length) },
        { key: "{{totalTasks}}", value: String(projectTasks.length) },
        {
          key: "{{completedTasks}}",
          value: String(projectTasks.filter((t) => t.status === "done").length),
        },
        { key: "{{teamMembers}}", value: teamNames || "—" },
      ],
    },
    {
      label: "Budget (read-only)",
      vars: [
        { key: "{{totalBudget}}", value: fmt(bv.total) },
        { key: "{{totalLabour}}", value: fmt(bv.labour) },
        { key: "{{totalMaterials}}", value: fmt(bv.materials) },
      ],
    },
    {
      label: "Custom Fields (editable — used in Proposals & TeamTalk)",
      vars: customFields.map((f) => ({
        key: `{{cf_${f.name.replace(/\s+/g, "_")}}}`,
        value: f.value || "—",
      })),
    },
  ];

  const tabDefs = [
    { id: "data" as const, label: "Project Data" },
    { id: "notes" as const, label: "Notes" },
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-3xl max-h-[80vh] flex flex-col"
        data-ocid="project.info.modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: project.color }}
            />
            {project.name} — Project Info
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b">
          {tabDefs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              data-ocid={`project.info.${t.id}.tab`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-1">
          {tab === "data" && (
            <div className="space-y-6">
              {/* Hint */}
              <p className="text-[10px] text-gray-400 bg-gray-50 rounded p-2">
                These fields are used as insert variables in Proposals and
                TeamTalk messages. Click the variable key to copy it to your
                clipboard.
              </p>

              {/* Variable groups */}
              {varGroups.map((group) => (
                <div key={group.label}>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                    {group.label}
                  </h4>
                  <div className="border rounded divide-y">
                    {group.vars.length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        No fields yet
                      </div>
                    )}
                    {group.vars.map((v) => (
                      <div
                        key={v.key}
                        className="flex items-center px-3 py-1.5 text-xs gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => copyVar(v.key)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-mono shrink-0"
                          title="Click to copy"
                          data-ocid="project.info.var.button"
                        >
                          <Copy className="w-3 h-3" />
                          {copied === v.key ? "Copied!" : v.key}
                        </button>
                        <span className="text-gray-600 truncate">
                          {v.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Editable custom fields */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-500 uppercase">
                    Edit Custom Fields
                  </h4>
                  <button
                    type="button"
                    onClick={addField}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    data-ocid="project.info.add_field.button"
                  >
                    <Plus className="w-3 h-3" /> Add Field
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mb-2">
                  Common fields: Client, Location, Call Time, Wrap Time,
                  Parking, Catering, Contact, Notes. These are referenced in
                  TeamTalk as {"{{client}}"}, {"{{location}}"}, etc.
                </p>
                {customFields.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 mb-1.5">
                    <input
                      type="text"
                      value={f.name}
                      onChange={(e) =>
                        updateField(f.id, "name", e.target.value)
                      }
                      placeholder="Field name"
                      className="border rounded px-2 py-1 text-xs flex-1"
                      data-ocid="project.info.custom_field.name.input"
                    />
                    <input
                      type="text"
                      value={f.value}
                      onChange={(e) =>
                        updateField(f.id, "value", e.target.value)
                      }
                      placeholder="Value"
                      className="border rounded px-2 py-1 text-xs flex-1"
                      data-ocid="project.info.custom_field.value.input"
                    />
                    <button
                      type="button"
                      onClick={() => removeField(f.id)}
                      className="text-red-400 hover:text-red-600"
                      data-ocid="project.info.custom_field.delete_button"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Stages summary */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Stages
                </h4>
                {projectStages.length === 0 && (
                  <p className="text-xs text-gray-400">No stages</p>
                )}
                <div className="border rounded divide-y">
                  {projectStages
                    .sort((a, b) => a.order - b.order)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs"
                      >
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{ backgroundColor: s.color || "#e5e7eb" }}
                        />
                        <span className="font-medium">{s.name}</span>
                        {s.startDate && s.endDate && (
                          <span className="text-gray-400 ml-auto">
                            {new Date(s.startDate).toLocaleDateString("en-GB")}{" "}
                            — {new Date(s.endDate).toLocaleDateString("en-GB")}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {tab === "notes" && (
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                save(customFields, e.target.value);
              }}
              placeholder="Project notes..."
              rows={16}
              className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-ocid="project.info.notes.textarea"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
