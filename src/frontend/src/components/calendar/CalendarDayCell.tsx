import type { Stage } from "@/types";
import {
  isDateInRange,
  isEndDate,
  isSameDay,
  isStartDate,
} from "@/utils/calendarUtils";
import { getHolidaysOnDate } from "@/utils/holidays";

interface StageEvent {
  id: string;
  label: string;
  color: string;
  projectName: string;
  isStart: boolean;
  isEnd: boolean;
  stage: Stage;
}

interface TaskEvent {
  id: string;
  label: string;
  color: string;
  isMilestone: boolean;
}

interface Props {
  date: Date;
  inMonth: boolean;
  tall: boolean;
  today: Date;
  stageEvents: StageEvent[];
  taskEvents: TaskEvent[];
  onStageClick: (stage: Stage) => void;
}

export default function CalendarDayCell({
  date,
  inMonth,
  tall,
  today,
  stageEvents,
  taskEvents,
  onStageClick,
}: Props) {
  const isT = isSameDay(date, today);
  const isWE = date.getDay() === 0 || date.getDay() === 6;
  const maxShow = tall ? 6 : 3;
  const allEvents = [...stageEvents, ...taskEvents];
  const overflow = allEvents.length > maxShow ? allEvents.length - maxShow : 0;

  return (
    <div
      className={`border-b border-r p-1 overflow-hidden ${!inMonth ? "opacity-40" : ""}`}
      style={{
        minHeight: tall ? "140px" : "90px",
        backgroundColor: isT ? "#eff6ff" : isWE ? "#f9fafb" : "#ffffff",
        borderColor: "#e5e7eb",
      }}
    >
      <div
        className={`text-xs font-medium mb-0.5 ${isT ? "text-blue-600 font-bold" : "text-gray-500"}`}
      >
        {date.getDate()}
      </div>
      <div className="space-y-0.5">
        {stageEvents.slice(0, maxShow).map((ev) => (
          <button
            key={ev.id}
            type="button"
            onClick={() => onStageClick(ev.stage)}
            className="w-full text-left text-[10px] py-0.5 cursor-pointer truncate hover:opacity-80"
            style={{
              backgroundColor: ev.color,
              color: "#374151",
              borderRadius:
                ev.isStart && ev.isEnd
                  ? "4px"
                  : ev.isStart
                    ? "4px 0 0 4px"
                    : ev.isEnd
                      ? "0 4px 4px 0"
                      : "0",
              marginLeft: ev.isStart ? "0" : "-4px",
              marginRight: ev.isEnd ? "0" : "-4px",
              paddingLeft: ev.isStart ? "4px" : "2px",
              paddingRight: ev.isEnd ? "4px" : "2px",
              display: "block",
            }}
            title={`${ev.projectName} — ${ev.label}`}
          >
            {ev.isStart ? ev.label : "\u00A0"}
          </button>
        ))}
        {taskEvents
          .slice(0, Math.max(0, maxShow - stageEvents.length))
          .map((ev) => (
            <div
              key={ev.id}
              className="text-[10px] px-1 py-0.5 rounded truncate"
              style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
            >
              {ev.isMilestone ? "⭐ " : "• "}
              {ev.label}
            </div>
          ))}
        {getHolidaysOnDate(date).map((h) => (
          <div
            key={h.id}
            className="text-[10px] px-1 py-0.5 rounded truncate bg-amber-100 text-amber-800"
            title={`${h.memberName} on holiday`}
          >
            🌴 {h.memberName}
          </div>
        ))}
        {overflow > 0 && (
          <div className="text-[9px] text-gray-400 px-1">+{overflow} more</div>
        )}
      </div>
    </div>
  );
}

// Helper: build events for a given day
export function getEventsForDay(
  date: Date,
  stages: Stage[],
  tasks: {
    id: string;
    title: string;
    dueDate?: string;
    cardColor?: string | null;
    isMilestone?: boolean;
    milestone?: boolean;
  }[],
  projects: { id: string; name: string }[],
) {
  const stageEvents: {
    id: string;
    label: string;
    color: string;
    projectName: string;
    isStart: boolean;
    isEnd: boolean;
    stage: Stage;
  }[] = stages
    .filter((s) => isDateInRange(date, s.startDate, s.endDate))
    .map((s) => ({
      id: s.id,
      label: s.name,
      color: s.color || "#e5e7eb",
      projectName: projects.find((p) => p.id === s.projectId)?.name || "",
      isStart: isStartDate(date, s.startDate),
      isEnd: isEndDate(date, s.endDate),
      stage: s,
    }));

  const taskEvents: {
    id: string;
    label: string;
    color: string;
    isMilestone: boolean;
  }[] = tasks
    .filter((t) => t.dueDate && isSameDay(date, new Date(t.dueDate)))
    .map((t) => ({
      id: t.id,
      label: t.title,
      color: t.cardColor || "#6b7280",
      isMilestone: t.isMilestone || t.milestone || false,
    }));

  return { stageEvents, taskEvents };
}
