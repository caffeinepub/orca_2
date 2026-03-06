import type { Project, Stage, Task } from "@/types";
import type { CustomField, ProjectBudget } from "@/types/project";
import { triggerCloudSync } from "@/utils/storage";
import { ChevronDown, Download, Edit3, Eye, FileText } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ProposalTemplateModal from "./ProposalTemplateModal";
import { buildVariableCategories, resolveVariables } from "./proposalVariables";

interface Props {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
}

const FONTS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Helvetica",
  "Palatino",
];
const SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24];

export default function ProposalView({ projects, stages, tasks }: Props) {
  const activeProjects = projects.filter((p) => !p.archived);
  const [selectedProjectId, setSelectedProjectId] = useState(
    activeProjects[0]?.id || "",
  );
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(14);
  const [showVarPicker, setShowVarPicker] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const project = projects.find((p) => p.id === selectedProjectId);
  const projectStages = stages.filter((s) => s.projectId === selectedProjectId);
  const projectTasks = tasks.filter((t) =>
    projectStages.some((s) => s.id === t.stageId),
  );

  // Load/save from shared localStorage key
  const storageKey = `orca_project_info_${selectedProjectId}`;
  const [proposalNotes, setProposalNotes] = useState("");

  useEffect(() => {
    if (!selectedProjectId) return;
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || "{}");
      setProposalNotes(data.proposalNotes || "");
    } catch {
      setProposalNotes("");
    }
  }, [selectedProjectId, storageKey]);

  const saveNotes = (text: string) => {
    setProposalNotes(text);
    try {
      const existing = JSON.parse(localStorage.getItem(storageKey) || "{}");
      localStorage.setItem(
        storageKey,
        JSON.stringify({ ...existing, proposalNotes: text }),
      );
      triggerCloudSync();
    } catch {}
  };

  // Load budget + custom fields from same key
  const { budget, customFields } = useMemo(() => {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return {
        budget: (data.budget || { stages: [] }) as ProjectBudget,
        customFields: (data.customFields || []) as CustomField[],
      };
    } catch {
      return {
        budget: { stages: [] } as ProjectBudget,
        customFields: [] as CustomField[],
      };
    }
  }, [storageKey]);

  const variableCategories = useMemo(
    () =>
      buildVariableCategories(
        project,
        projectStages,
        projectTasks,
        budget,
        customFields,
      ),
    [project, projectStages, projectTasks, budget, customFields],
  );
  const resolvedText = useMemo(
    () => resolveVariables(proposalNotes, variableCategories),
    [proposalNotes, variableCategories],
  );

  const insertVariable = (varKey: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      saveNotes(proposalNotes + varKey);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    saveNotes(
      proposalNotes.slice(0, start) + varKey + proposalNotes.slice(end),
    );
    setShowVarPicker(false);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + varKey.length;
      ta.selectionEnd = start + varKey.length;
    }, 50);
  };

  const exportToPDF = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${project?.name || "Proposal"}</title>
      <style>body{font-family:${fontFamily},sans-serif;font-size:${fontSize}px;padding:40px 60px;line-height:1.7;max-width:800px;margin:0 auto;color:#1a1a1a}
      @media print{body{padding:20px 40px}}</style></head>
      <body>${resolvedText
        .split("\n")
        .map((line) =>
          line.trim() ? `<p style="margin:6px 0">${line}</p>` : "<br/>",
        )
        .join("")}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  if (!project) {
    return (
      <div
        className="h-full flex items-center justify-center text-muted-foreground"
        data-ocid="proposal.empty_state"
      >
        No projects yet. Create a project on the Board tab first.
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden bg-gray-50"
      data-ocid="proposal.section"
    >
      {/* Toolbar */}
      <div className="shrink-0 px-4 py-2 bg-white border-b flex items-center gap-2 flex-wrap">
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-2 py-1 text-sm border rounded font-medium max-w-[200px]"
          data-ocid="proposal.project.select"
        >
          {activeProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="w-px h-6 bg-gray-200" />

        <div className="flex border rounded overflow-hidden">
          <button
            type="button"
            onClick={() => setTab("editor")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium ${tab === "editor" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            data-ocid="proposal.editor.tab"
          >
            <Edit3 className="w-3 h-3" /> Editor
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium border-l ${tab === "preview" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            data-ocid="proposal.preview.tab"
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="px-2 py-1 text-xs border rounded"
          data-ocid="proposal.font.select"
        >
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(+e.target.value)}
          className="px-2 py-1 text-xs border rounded w-16"
          data-ocid="proposal.size.select"
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}px
            </option>
          ))}
        </select>

        {tab === "editor" && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVarPicker(!showVarPicker)}
              className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
              data-ocid="proposal.insert.button"
            >
              <ChevronDown className="w-3 h-3" /> Insert Data
            </button>
            {showVarPicker && (
              <div
                className="absolute left-0 top-full mt-1 w-80 bg-white border rounded-lg shadow-lg z-50 p-2 max-h-72 overflow-y-auto"
                data-ocid="proposal.insert.popover"
              >
                {variableCategories.map((cat) => (
                  <div key={cat.label} className="mb-2">
                    <div className="text-[10px] font-bold text-gray-500 uppercase px-1 mb-0.5">
                      {cat.label}
                    </div>
                    {cat.vars.map((v) => (
                      <button
                        type="button"
                        key={v.key}
                        onClick={() => insertVariable(v.key)}
                        className="w-full text-left px-2 py-1 text-xs rounded hover:bg-blue-50 flex justify-between"
                      >
                        <span className="font-mono text-blue-600">
                          {v.key.replace(/\{\{|\}\}/g, "")}
                        </span>
                        <span className="text-gray-400 text-[10px] truncate ml-2 max-w-[140px]">
                          {v.preview}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
          data-ocid="proposal.templates.open_modal_button"
        >
          <FileText className="w-3 h-3" /> Templates
        </button>

        <button
          type="button"
          onClick={exportToPDF}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          data-ocid="proposal.export.button"
        >
          <Download className="w-3 h-3" /> Export PDF
        </button>
      </div>

      {/* Main content — centered document style */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[800px] mx-auto my-6">
          {tab === "editor" ? (
            <div className="bg-white rounded-lg shadow-sm border min-h-[calc(100vh-200px)]">
              <textarea
                ref={textareaRef}
                value={proposalNotes}
                onChange={(e) => saveNotes(e.target.value)}
                placeholder={
                  "Start typing your proposal here...\n\nUse 'Insert Data' above to add dynamic fields like {{projectName}}, {{totalBudget}}, etc.\n\nThe proposal will grow as you type — scroll down for multi-page documents."
                }
                className="w-full h-full min-h-[calc(100vh-200px)] p-8 border-0 rounded-lg focus:outline-none resize-none"
                style={{
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  lineHeight: "1.7",
                }}
                data-ocid="proposal.editor"
              />
            </div>
          ) : (
            <div
              className="bg-white rounded-lg shadow-sm border min-h-[calc(100vh-200px)] p-8 whitespace-pre-wrap"
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                lineHeight: "1.7",
              }}
              data-ocid="proposal.preview.panel"
            >
              {resolvedText || (
                <span className="text-gray-300 italic">
                  Your proposal preview will appear here...
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {showTemplateModal && (
        <ProposalTemplateModal
          currentContent={proposalNotes}
          fontFamily={fontFamily}
          fontSize={fontSize}
          onLoad={(content, ff, fs) => {
            saveNotes(content);
            setFontFamily(ff);
            setFontSize(fs);
            setShowTemplateModal(false);
          }}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  );
}
