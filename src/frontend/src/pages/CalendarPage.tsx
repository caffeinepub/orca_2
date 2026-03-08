import CalendarGrid from "@/components/calendar/CalendarGrid";
import CalendarSyncPanel from "@/components/calendar/CalendarSyncPanel";
import GanttChart from "@/components/calendar/GanttChart";
import type { Project, Stage, Task } from "@/types";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

interface CalendarPageProps {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
  onUpdateStage: (id: string, updates: Partial<Stage>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export default function CalendarPage({
  projects,
  stages,
  tasks,
  onUpdateStage,
  onUpdateTask,
}: CalendarPageProps) {
  const [view, setView] = useState<"calendar" | "gantt">("calendar");
  const [syncOpen, setSyncOpen] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* View toggle header */}
      <div className="shrink-0 px-4 py-2 border-b bg-card flex items-center gap-2">
        <div className="flex border rounded overflow-hidden">
          <button
            type="button"
            data-ocid="calendar.view.calendar.tab"
            onClick={() => setView("calendar")}
            className={`px-3 py-1 text-xs font-medium ${view === "calendar" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Calendar
          </button>
          <button
            type="button"
            data-ocid="calendar.view.gantt.tab"
            onClick={() => setView("gantt")}
            className={`px-3 py-1 text-xs font-medium border-l ${view === "gantt" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Gantt Chart
          </button>
        </div>
        <button
          type="button"
          data-ocid="calendar.sync.open_modal_button"
          onClick={() => setSyncOpen(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded border"
        >
          <RefreshCw className="w-3 h-3" /> Sync
        </button>
      </div>

      {/* View content */}
      <div className="flex-1 overflow-hidden">
        {view === "calendar" ? (
          <CalendarGrid
            projects={projects}
            stages={stages}
            tasks={tasks}
            onUpdateStage={onUpdateStage}
          />
        ) : (
          <GanttChart
            projects={projects}
            stages={stages}
            tasks={tasks}
            onUpdateStage={onUpdateStage}
            onUpdateTask={onUpdateTask}
          />
        )}
      </div>

      <CalendarSyncPanel
        isOpen={syncOpen}
        onClose={() => setSyncOpen(false)}
        projects={projects}
        stages={stages}
        tasks={tasks}
      />
    </div>
  );
}
