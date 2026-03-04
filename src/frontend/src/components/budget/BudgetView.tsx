import type { Project, Stage, Task } from "@/types";
import type { ClientBudgetSettings, ProjectBudget } from "@/types/project";
import { useEffect, useState } from "react";
import ClientBudgetTab from "./ClientBudgetTab";
import WorkingBudgetTab from "./WorkingBudgetTab";

interface BudgetViewProps {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
}

export default function BudgetView({
  projects,
  stages,
  tasks: _tasks,
}: BudgetViewProps) {
  const activeProjects = projects.filter((p) => !p.archived);
  const [selectedProjectId, setSelectedProjectId] = useState(
    activeProjects[0]?.id || "",
  );
  const [activeTab, setActiveTab] = useState<"working" | "client">("working");

  const [budget, setBudget] = useState<ProjectBudget>({ stages: [] });
  const [clientSettings, setClientSettings] = useState<ClientBudgetSettings>(
    {},
  );

  const project = projects.find((p) => p.id === selectedProjectId);
  const projectStages = stages.filter((s) => s.projectId === selectedProjectId);

  const storageKey = `orca_project_info_${selectedProjectId}`;

  // Load budget data when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        setBudget(data.budget || { stages: [] });
        setClientSettings(data.clientSettings || {});
      } else {
        setBudget({ stages: [] });
        setClientSettings({});
      }
    } catch {
      setBudget({ stages: [] });
      setClientSettings({});
    }
  }, [selectedProjectId, storageKey]);

  const handleUpdateBudget = (updates: Partial<ProjectBudget>) => {
    const newBudget = { ...budget, ...updates };
    setBudget(newBudget);
    try {
      const existing = JSON.parse(localStorage.getItem(storageKey) || "{}");
      localStorage.setItem(
        storageKey,
        JSON.stringify({ ...existing, budget: newBudget }),
      );
    } catch {}
  };

  const handleUpdateClientSettings = (settings: ClientBudgetSettings) => {
    setClientSettings(settings);
    try {
      const existing = JSON.parse(localStorage.getItem(storageKey) || "{}");
      localStorage.setItem(
        storageKey,
        JSON.stringify({ ...existing, clientSettings: settings }),
      );
    } catch {}
  };

  if (!project) {
    return (
      <div
        className="h-full flex items-center justify-center text-muted-foreground"
        data-ocid="budget.empty_state"
      >
        No projects yet. Create a project on the Board tab first.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top toolbar */}
      <div className="shrink-0 px-4 py-2 bg-white border-b flex items-center gap-3">
        {/* Project selector */}
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-2 py-1 text-sm border rounded font-medium max-w-[200px]"
          data-ocid="budget.project.select"
        >
          {activeProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="w-px h-6 bg-gray-200" />

        {/* Working / Client toggle */}
        <div className="flex border rounded overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab("working")}
            className={`px-3 py-1 text-xs font-medium ${
              activeTab === "working"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            data-ocid="budget.working_tab.toggle"
          >
            Working Budget
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("client")}
            className={`px-3 py-1 text-xs font-medium border-l ${
              activeTab === "client"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            data-ocid="budget.client_tab.toggle"
          >
            Client Budget
          </button>
        </div>
      </div>

      {/* Main content — scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "working" ? (
          <WorkingBudgetTab
            project={project}
            stages={projectStages}
            budget={budget}
            onUpdateBudget={handleUpdateBudget}
          />
        ) : (
          <ClientBudgetTab
            project={project}
            budget={budget}
            clientBudgetSettings={clientSettings}
            onUpdateSettings={handleUpdateClientSettings}
          />
        )}
      </div>
    </div>
  );
}
