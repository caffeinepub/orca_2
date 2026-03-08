import StageModal from "@/components/modals/StageModal";
import type { Project, Stage, Task } from "@/types";
import {
  MONTHS,
  WEEKDAYS,
  getMonthDays,
  getWeekDays,
  toDateKey,
} from "@/utils/calendarUtils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import CalendarDayCell, { getEventsForDay } from "./CalendarDayCell";

interface Props {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
  onUpdateStage: (id: string, updates: Partial<Stage>) => void;
}

export default function CalendarGrid({
  projects,
  stages,
  tasks,
  onUpdateStage,
}: Props) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [viewType, setViewType] = useState<"month" | "week">("month");
  const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(new Set());
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

  const toggleType = (t: string) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleProject = (id: string) => {
    setHiddenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleStages = stages.filter((s) => !hiddenProjects.has(s.projectId));
  const visibleTasks = tasks.filter((t) => {
    const stage = stages.find((s) => s.id === t.stageId);
    return stage && !hiddenProjects.has(stage.projectId);
  });

  const goBack = () => {
    if (viewType === "month") {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else {
      setCurrentDate((d) => {
        const n = new Date(d);
        n.setDate(n.getDate() - 7);
        return n;
      });
    }
  };
  const goForward = () => {
    if (viewType === "month") {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else {
      setCurrentDate((d) => {
        const n = new Date(d);
        n.setDate(n.getDate() + 7);
        return n;
      });
    }
  };

  const headerLabel =
    viewType === "month"
      ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : (() => {
          const days = getWeekDays(currentDate);
          return `${days[0].getDate()} – ${days[6].getDate()} ${MONTHS[days[6].getMonth()]} ${days[6].getFullYear()}`;
        })();

  const cells =
    viewType === "month"
      ? getMonthDays(currentDate.getFullYear(), currentDate.getMonth())
      : getWeekDays(currentDate).map((d) => ({ date: d, inMonth: true }));

  const handleStageClick = (stage: Stage) => {
    setSelectedStage(stage);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header row */}
      <div className="shrink-0 px-4 py-2 border-b flex items-center gap-3 flex-wrap">
        {/* Month/week toggle */}
        <div className="flex border rounded overflow-hidden text-xs">
          <button
            type="button"
            data-ocid="calendar.month.tab"
            onClick={() => setViewType("month")}
            className={`px-3 py-1 font-medium ${viewType === "month" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Month
          </button>
          <button
            type="button"
            data-ocid="calendar.week.tab"
            onClick={() => setViewType("week")}
            className={`px-3 py-1 font-medium border-l ${viewType === "week" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Week
          </button>
        </div>
        {/* Navigation */}
        <button
          type="button"
          data-ocid="calendar.prev.button"
          onClick={goBack}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium min-w-[180px]">{headerLabel}</span>
        <button
          type="button"
          data-ocid="calendar.next.button"
          onClick={goForward}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Project filter row */}
      <div className="shrink-0 px-4 py-1.5 border-b flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
          Projects:
        </span>
        {projects
          .filter((p) => !p.archived)
          .map((p) => (
            <button
              type="button"
              key={p.id}
              data-ocid="calendar.project.toggle"
              onClick={() => toggleProject(p.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition-opacity ${hiddenProjects.has(p.id) ? "opacity-40" : "opacity-100"}`}
              style={{
                borderColor: p.color,
                backgroundColor: hiddenProjects.has(p.id)
                  ? "transparent"
                  : `${p.color}30`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </button>
          ))}
      </div>

      {/* Type toggles */}
      <div className="shrink-0 px-4 py-1.5 border-b flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
          Show:
        </span>
        {(["stages", "tasks", "milestones", "holidays"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggleType(t)}
            className={`px-2 py-0.5 rounded-full text-[10px] border transition-opacity ${hiddenTypes.has(t) ? "opacity-40 bg-transparent" : "opacity-100"}`}
            style={{
              borderColor:
                t === "stages"
                  ? "#93c5fd"
                  : t === "tasks"
                    ? "#d1d5db"
                    : t === "milestones"
                      ? "#fde68a"
                      : "#fbbf24",
              backgroundColor: hiddenTypes.has(t)
                ? "transparent"
                : t === "stages"
                  ? "#dbeafe"
                  : t === "tasks"
                    ? "#f3f4f6"
                    : t === "milestones"
                      ? "#fef3c7"
                      : "#fef3c7",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Weekday headers */}
      <div className="shrink-0 grid grid-cols-7 border-b">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-[10px] font-medium text-gray-500 text-center py-1 border-r last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-7 border-l">
        {cells.map(({ date, inMonth }) => {
          const { stageEvents, taskEvents } = getEventsForDay(
            date,
            visibleStages,
            visibleTasks,
            projects,
          );
          const filteredStages = hiddenTypes.has("stages") ? [] : stageEvents;
          const filteredTasks = taskEvents.filter((t) => {
            if (t.isMilestone && hiddenTypes.has("milestones")) return false;
            if (!t.isMilestone && hiddenTypes.has("tasks")) return false;
            return true;
          });
          return (
            <CalendarDayCell
              key={toDateKey(date)}
              date={date}
              inMonth={inMonth}
              tall={viewType === "week"}
              today={today}
              stageEvents={filteredStages}
              taskEvents={filteredTasks}
              onStageClick={handleStageClick}
              showHolidays={!hiddenTypes.has("holidays")}
            />
          );
        })}
      </div>

      {/* Stage modal */}
      <StageModal
        isOpen={isModalOpen}
        stage={selectedStage}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStage(null);
        }}
        onSave={(updates) => {
          if (selectedStage) onUpdateStage(selectedStage.id, updates);
          setIsModalOpen(false);
          setSelectedStage(null);
        }}
        onDelete={() => {
          setIsModalOpen(false);
          setSelectedStage(null);
        }}
      />
    </div>
  );
}
