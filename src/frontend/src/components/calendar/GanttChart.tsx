import type { Project, Stage, Task } from "@/types";
import {
  getGanttDateRange,
  getMonthMarkers,
  toDateKey,
} from "@/utils/calendarUtils";
import { getApprovedHolidays, isOnHoliday } from "@/utils/holidays";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import GanttLeftPanel from "./GanttLeftPanel";

interface Props {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
  onUpdateStage: (id: string, updates: Partial<Stage>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

const ROW_H = 36;

function getWorkloadColor(days: number): string {
  if (days === 0) return "#ffffff";
  if (days <= 1) return "#d1fae5"; // green-100
  if (days <= 1.5) return "#fed7aa"; // orange-200
  return "#fecaca"; // red-200
}

export default function GanttChart({
  projects,
  stages,
  tasks,
  onUpdateStage,
  onUpdateTask,
}: Props) {
  const today = new Date();
  const [dayWidth, setDayWidth] = useState(30);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.map((p) => p.id)),
  );
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set(stages.map((s) => s.id)),
  );
  const [resourceDays, setResourceDays] = useState<
    Record<string, Record<string, number>>
  >({});

  const dates = getGanttDateRange(today);
  const dateIndex = (d: Date) =>
    dates.findIndex((x) => toDateKey(x) === toDateKey(d));
  const todayIdx = dateIndex(today);
  const monthMarkers = getMonthMarkers(dates, dayWidth);

  const rightRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  // Load resource data
  useEffect(() => {
    try {
      const raw = localStorage.getItem("orca_resource_days");
      if (raw) setResourceDays(JSON.parse(raw));
    } catch {}
  }, []);

  // Auto-scroll to today
  useEffect(() => {
    if (rightRef.current && todayIdx >= 0) {
      const scrollTarget =
        todayIdx * dayWidth - rightRef.current.clientWidth / 2;
      rightRef.current.scrollLeft = Math.max(0, scrollTarget);
    }
  }, [todayIdx, dayWidth]);

  // Build rows
  const rows: Array<{
    type: string;
    id: string;
    label: string;
    color?: string;
    indent: number;
    projectId?: string;
    stageId?: string;
    startDate?: string;
    endDate?: string;
  }> = [];
  for (const proj of projects.filter((p) => !p.archived)) {
    rows.push({
      type: "project",
      id: proj.id,
      label: proj.name,
      color: proj.color,
      indent: 0,
    });
    if (!expandedProjects.has(proj.id)) continue;
    for (const stage of stages.filter((s) => s.projectId === proj.id)) {
      rows.push({
        type: "stage",
        id: stage.id,
        label: stage.name,
        color: stage.color,
        indent: 1,
        projectId: proj.id,
      });
      if (!expandedStages.has(stage.id)) continue;
      for (const task of tasks.filter((t) => t.stageId === stage.id)) {
        rows.push({
          type: "task",
          id: task.id,
          label: task.title,
          indent: 2,
          stageId: stage.id,
        });
      }
    }
  }

  // Add holiday rows
  const approvedHolidays = getApprovedHolidays();
  if (approvedHolidays.length > 0) {
    rows.push({
      type: "header",
      id: "holidays-header",
      label: "🌴 Holidays",
      indent: 0,
    });
    for (const h of approvedHolidays) {
      rows.push({
        type: "holiday",
        id: h.id,
        label: h.memberName,
        startDate: h.startDate,
        endDate: h.endDate,
        indent: 1,
        color: "#fef3c7",
      });
    }
  }

  // Resource members aggregated
  const allMembers: {
    id: string;
    name: string;
    initials: string;
    avatarColor?: string;
    total: number;
  }[] = [];
  const seen = new Set<string>();
  for (const proj of projects.filter((p) => !p.archived)) {
    for (const m of proj.teamMembers || []) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        const projDays = resourceDays[proj.id] || {};
        const total = projDays[m.id] || 0;
        allMembers.push({
          id: m.id,
          name: m.name,
          initials: m.initials,
          avatarColor: m.avatarColor,
          total,
        });
      }
    }
  }

  const handleLeftScroll = useCallback((scrollTop: number) => {
    if (rightRef.current && !isSyncingRef.current) {
      isSyncingRef.current = true;
      rightRef.current.scrollTop = scrollTop;
      isSyncingRef.current = false;
    }
  }, []);

  const handleRightScroll = () => {
    if (rightRef.current && headerRef.current && !isSyncingRef.current) {
      isSyncingRef.current = true;
      headerRef.current.scrollLeft = rightRef.current.scrollLeft;
      isSyncingRef.current = false;
    }
  };

  // Drag state
  const dragRef = useRef<{
    rowIdx: number;
    type: string;
    startX: number;
    origStart?: string;
    origEnd?: string;
    origDue?: string;
    mode: "move" | "resizeL" | "resizeR";
  } | null>(null);

  const handleBarMouseDown = (
    e: React.MouseEvent,
    rowIdx: number,
    stage: Stage,
    mode: "move" | "resizeL" | "resizeR",
  ) => {
    e.preventDefault();
    dragRef.current = {
      rowIdx,
      type: "stage",
      startX: e.clientX,
      origStart: stage.startDate,
      origEnd: stage.endDate,
      mode,
    };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const deltaDays = Math.round(dx / dayWidth);
      if (!dragRef.current.origStart || !dragRef.current.origEnd) return;
      const s = new Date(dragRef.current.origStart);
      const en = new Date(dragRef.current.origEnd);
      if (dragRef.current.mode === "move") {
        s.setDate(s.getDate() + deltaDays);
        en.setDate(en.getDate() + deltaDays);
        onUpdateStage(stage.id, {
          startDate: toDateKey(s),
          endDate: toDateKey(en),
        });
      } else if (dragRef.current.mode === "resizeL") {
        s.setDate(s.getDate() + deltaDays);
        onUpdateStage(stage.id, { startDate: toDateKey(s) });
      } else {
        en.setDate(en.getDate() + deltaDays);
        onUpdateStage(stage.id, { endDate: toDateKey(en) });
      }
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleTaskMouseDown = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    const origDue = task.dueDate;
    const startX = e.clientX;
    const onMove = (ev: MouseEvent) => {
      if (!origDue) return;
      const dx = ev.clientX - startX;
      const deltaDays = Math.round(dx / dayWidth);
      const d = new Date(origDue);
      d.setDate(d.getDate() + deltaDays);
      onUpdateTask(task.id, { dueDate: toDateKey(d) });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const totalWidth = dates.length * dayWidth;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Zoom controls */}
      <div className="shrink-0 px-4 py-1.5 border-b bg-white flex items-center gap-2">
        <span className="text-xs text-gray-500">Zoom:</span>
        <button
          type="button"
          data-ocid="gantt.zoom_out.button"
          onClick={() => setDayWidth((w) => Math.max(10, w - 5))}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-gray-400 w-8 text-center">
          {dayWidth}px
        </span>
        <button
          type="button"
          data-ocid="gantt.zoom_in.button"
          onClick={() => setDayWidth((w) => Math.min(60, w + 5))}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <GanttLeftPanel
          rows={rows}
          expandedProjects={expandedProjects}
          expandedStages={expandedStages}
          onToggleProject={(id) =>
            setExpandedProjects((prev) => {
              const n = new Set(prev);
              n.has(id) ? n.delete(id) : n.add(id);
              return n;
            })
          }
          onToggleStage={(id) =>
            setExpandedStages((prev) => {
              const n = new Set(prev);
              n.has(id) ? n.delete(id) : n.add(id);
              return n;
            })
          }
          resourceMembers={allMembers}
          ROW_H={ROW_H}
          onScroll={handleLeftScroll}
        />

        {/* Right panel (scrollable) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sticky header */}
          <div
            ref={headerRef}
            className="shrink-0 overflow-x-hidden border-b"
            style={{ scrollbarWidth: "none" }}
          >
            <div
              style={{ width: totalWidth, position: "relative", height: 48 }}
            >
              {/* Month labels */}
              {monthMarkers.map((m) => (
                <div
                  key={m.label}
                  className="absolute top-0 text-[10px] font-semibold text-gray-600 border-r bg-gray-50 flex items-center px-2 overflow-hidden"
                  style={{
                    left: m.left,
                    width: m.width,
                    height: 24,
                    borderColor: "#e5e7eb",
                  }}
                >
                  {m.label}
                </div>
              ))}
              {/* Day numbers */}
              {dates.map((d, i) => (
                <div
                  key={toDateKey(d)}
                  className="absolute bottom-0 flex items-center justify-center border-r border-b text-[9px] text-gray-400"
                  style={{
                    left: i * dayWidth,
                    width: dayWidth,
                    height: 24,
                    borderColor: "#e5e7eb",
                    backgroundColor:
                      toDateKey(d) === toDateKey(today)
                        ? "#dbeafe"
                        : "transparent",
                    color:
                      toDateKey(d) === toDateKey(today) ? "#2563eb" : undefined,
                  }}
                >
                  {d.getDate()}
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable grid */}
          <div
            ref={rightRef}
            className="flex-1 overflow-auto"
            onScroll={handleRightScroll}
          >
            <div
              style={{
                width: totalWidth,
                position: "relative",
                minHeight: rows.length * ROW_H,
              }}
            >
              {/* Today line */}
              {todayIdx >= 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10 pointer-events-none"
                  style={{ left: todayIdx * dayWidth + dayWidth / 2 }}
                />
              )}

              {/* Row stripes + bars/dots */}
              {rows.map((row, rowIdx) => {
                const top = rowIdx * ROW_H;
                if (row.type === "stage") {
                  const stage = stages.find((s) => s.id === row.id);
                  if (!stage || !stage.startDate || !stage.endDate) {
                    return (
                      <div
                        key={row.id}
                        className="absolute border-b"
                        style={{
                          top,
                          left: 0,
                          width: totalWidth,
                          height: ROW_H,
                          borderColor: "#e5e7eb",
                        }}
                      />
                    );
                  }
                  const sIdx = dateIndex(new Date(stage.startDate));
                  const eIdx = dateIndex(new Date(stage.endDate));
                  if (sIdx < 0 || eIdx < 0)
                    return (
                      <div
                        key={row.id}
                        className="absolute border-b"
                        style={{
                          top,
                          left: 0,
                          width: totalWidth,
                          height: ROW_H,
                          borderColor: "#e5e7eb",
                        }}
                      />
                    );
                  const barLeft = sIdx * dayWidth;
                  const barWidth = (eIdx - sIdx + 1) * dayWidth;
                  return (
                    <div
                      key={row.id}
                      className="absolute border-b"
                      style={{
                        top,
                        left: 0,
                        width: totalWidth,
                        height: ROW_H,
                        borderColor: "#e5e7eb",
                      }}
                    >
                      <div
                        data-ocid="gantt.stage.drag_handle"
                        className="absolute rounded flex items-center select-none cursor-grab active:cursor-grabbing"
                        style={{
                          left: barLeft + 2,
                          width: Math.max(barWidth - 4, 4),
                          top: 6,
                          height: ROW_H - 12,
                          backgroundColor: stage.color || "#93c5fd",
                          opacity: 0.85,
                        }}
                        onMouseDown={(e) => {
                          const rect = (
                            e.currentTarget as HTMLElement
                          ).getBoundingClientRect();
                          const relX = e.clientX - rect.left;
                          const mode =
                            relX < 6
                              ? "resizeL"
                              : relX > rect.width - 6
                                ? "resizeR"
                                : "move";
                          handleBarMouseDown(e, rowIdx, stage, mode);
                        }}
                      >
                        <span className="px-1 text-[9px] font-medium text-gray-700 truncate pointer-events-none">
                          {stage.name}
                        </span>
                      </div>
                    </div>
                  );
                }
                if (row.type === "task") {
                  const task = tasks.find((t) => t.id === row.id);
                  if (!task || !task.dueDate)
                    return (
                      <div
                        key={row.id}
                        className="absolute border-b"
                        style={{
                          top,
                          left: 0,
                          width: totalWidth,
                          height: ROW_H,
                          borderColor: "#e5e7eb",
                        }}
                      />
                    );
                  const tIdx = dateIndex(new Date(task.dueDate));
                  if (tIdx < 0)
                    return (
                      <div
                        key={row.id}
                        className="absolute border-b"
                        style={{
                          top,
                          left: 0,
                          width: totalWidth,
                          height: ROW_H,
                          borderColor: "#e5e7eb",
                        }}
                      />
                    );
                  return (
                    <div
                      key={row.id}
                      className="absolute border-b"
                      style={{
                        top,
                        left: 0,
                        width: totalWidth,
                        height: ROW_H,
                        borderColor: "#e5e7eb",
                      }}
                    >
                      <div
                        data-ocid="gantt.task.drag_handle"
                        className={`absolute cursor-grab ${task.isMilestone || task.milestone ? "rotate-45 w-3 h-3 rounded-sm" : "w-3 h-3 rounded-full"} bg-gray-500 hover:bg-gray-700`}
                        style={{
                          left: tIdx * dayWidth + dayWidth / 2 - 6,
                          top: ROW_H / 2 - 6,
                        }}
                        onMouseDown={(e) => handleTaskMouseDown(e, task)}
                        title={task.title}
                      />
                    </div>
                  );
                }
                // holiday row
                if (row.type === "holiday" && row.startDate && row.endDate) {
                  const sIdx = dateIndex(new Date(row.startDate));
                  const eIdx = dateIndex(new Date(row.endDate));
                  if (sIdx >= 0 && eIdx >= 0) {
                    const barLeft = sIdx * dayWidth;
                    const barWidth = (eIdx - sIdx + 1) * dayWidth;
                    return (
                      <div
                        key={row.id}
                        className="absolute border-b"
                        style={{
                          top,
                          left: 0,
                          width: totalWidth,
                          height: ROW_H,
                          borderColor: "#e5e7eb",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "4px",
                            left: `${barLeft}px`,
                            width: `${barWidth}px`,
                            height: `${ROW_H - 8}px`,
                            backgroundColor: "#fef3c7",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            paddingLeft: "8px",
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "#92400e",
                            border: "1px solid #fde68a",
                            zIndex: 2,
                          }}
                        >
                          🌴 {row.label}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={row.id}
                      className="absolute border-b"
                      style={{
                        top,
                        left: 0,
                        width: totalWidth,
                        height: ROW_H,
                        borderColor: "#e5e7eb",
                      }}
                    />
                  );
                }
                // project/header row
                return (
                  <div
                    key={row.id}
                    className="absolute border-b bg-gray-50"
                    style={{
                      top,
                      left: 0,
                      width: totalWidth,
                      height: ROW_H,
                      borderColor: "#e5e7eb",
                    }}
                  />
                );
              })}

              {/* Resource planning rows */}
              {allMembers.map((m, mi) => {
                return (
                  <div
                    key={m.id}
                    className="absolute border-b flex"
                    style={{
                      top: rows.length * ROW_H + 32 + mi * ROW_H,
                      left: 0,
                      width: totalWidth,
                      height: ROW_H,
                      borderColor: "#e5e7eb",
                    }}
                  >
                    {dates.map((d) => {
                      const key = toDateKey(d);
                      const val = resourceDays[m.id]?.[key] || 0;
                      const onHol = isOnHoliday(m.id, key);
                      if (onHol) {
                        return (
                          <div
                            key={key}
                            style={{
                              width: `${dayWidth}px`,
                              height: "100%",
                              borderRight: "1px solid #e5e7eb",
                              backgroundColor: "#fef3c7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "9px",
                              color: "#92400e",
                              flexShrink: 0,
                            }}
                            title={`${m.name} on holiday`}
                          >
                            🌴
                          </div>
                        );
                      }
                      return (
                        <div
                          key={key}
                          className="border-r flex items-center justify-center"
                          style={{
                            width: dayWidth,
                            height: ROW_H,
                            borderColor: "#e5e7eb",
                            backgroundColor: getWorkloadColor(val),
                            flexShrink: 0,
                          }}
                        >
                          {val > 0 && dayWidth >= 20 && (
                            <input
                              data-ocid="gantt.resource.input"
                              type="number"
                              min={0}
                              max={2}
                              step={0.5}
                              value={val}
                              onChange={(e) => {
                                const newVal =
                                  Number.parseFloat(e.target.value) || 0;
                                const updated = {
                                  ...resourceDays,
                                  [m.id]: {
                                    ...(resourceDays[m.id] || {}),
                                    [key]: newVal,
                                  },
                                };
                                setResourceDays(updated);
                                localStorage.setItem(
                                  "orca_resource_days",
                                  JSON.stringify(updated),
                                );
                              }}
                              className="w-full text-center text-[9px] bg-transparent border-0 focus:outline-none p-0"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
