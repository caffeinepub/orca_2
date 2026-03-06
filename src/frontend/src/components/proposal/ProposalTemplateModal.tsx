import { Save, Trash2, Upload, X } from "lucide-react";
import { useState } from "react";

export interface ProposalTemplate {
  id: string;
  name: string;
  createdAt: string;
  content: string;
  fontFamily: string;
  fontSize: number;
}

interface Props {
  currentContent: string;
  fontFamily: string;
  fontSize: number;
  onLoad: (content: string, fontFamily: string, fontSize: number) => void;
  onClose: () => void;
}

const STORAGE_KEY = "orca_proposal_templates";

export default function ProposalTemplateModal({
  currentContent,
  fontFamily,
  fontSize,
  onLoad,
  onClose,
}: Props) {
  const [templates, setTemplates] = useState<ProposalTemplate[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [templateName, setTemplateName] = useState("");

  const save = (t: ProposalTemplate[]) => {
    setTemplates(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  };

  const handleSave = () => {
    if (!templateName.trim()) return;
    save([
      ...templates,
      {
        id: `pt-${Date.now()}`,
        name: templateName.trim(),
        createdAt: new Date().toISOString(),
        content: currentContent,
        fontFamily,
        fontSize,
      },
    ]);
    setTemplateName("");
  };

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      data-ocid="proposal.template.modal"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleBackdropKeyDown}
    >
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Proposal Templates</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            data-ocid="proposal.template.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Save current */}
          <div>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Save Current as Template
            </span>
            <div className="flex gap-2 mt-1">
              <input
                id="proposal-template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name..."
                className="flex-1 px-3 py-1.5 text-sm border rounded"
                data-ocid="proposal.template.input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={!templateName.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                data-ocid="proposal.template.save_button"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>

          {/* Template list */}
          <div>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Saved Templates
            </span>
            {templates.length === 0 ? (
              <p
                className="text-xs text-gray-400 text-center py-6"
                data-ocid="proposal.template.empty_state"
              >
                No templates saved yet
              </p>
            ) : (
              <div
                className="mt-1 space-y-1 max-h-60 overflow-y-auto"
                data-ocid="proposal.template.list"
              >
                {templates.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50 group"
                    data-ocid={`proposal.template.item.${idx + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {fmtDate(t.createdAt)} · {t.fontFamily} {t.fontSize}px ·{" "}
                        {t.content.length} chars
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onLoad(t.content, t.fontFamily, t.fontSize)
                      }
                      className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-blue-600 rounded hover:bg-blue-50"
                      data-ocid={`proposal.template.button.${idx + 1}`}
                    >
                      <Upload className="w-3 h-3" /> Load
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        save(templates.filter((x) => x.id !== t.id))
                      }
                      className="shrink-0 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                      data-ocid={`proposal.template.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
