import type { Project, Stage, Task } from "@/types";
import { formatDate } from "@/utils/dateFormat";
import {
  Eye,
  EyeOff,
  FolderOpen,
  Info,
  MoreVertical,
  Plus,
  Users,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import ResourcePlanningGrid from "./ResourcePlanningGrid";
import EditProjectModal from "./modals/EditProjectModal";
import ProjectMembersModal from "./modals/ProjectMembersModal";
import StageModal from "./modals/StageModal";

interface TimelineViewProps {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
  searchQuery?: string;
  showArchived?: boolean;
  focusedProjectId?: string | null;
  onToggleFocus?: (projectId: string) => void;
  onUpdateStage: (stageId: string, updates: Partial<Stage>) => void;
  onCreateStage: (projectId: string, name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onArchiveProject: (projectId: string, archived: boolean) => void;
  onCreateProject: (name: string, color: string) => void;
}

export default function TimelineView({
  projects,
  stages,
  tasks,
  searchQuery = "",
  showArchived = false,
  focusedProjectId,
  onToggleFocus,
  onUpdateStage,
  onCreateStage,
  onDeleteProject,
  onUpdateProject,
  onArchiveProject,
  onCreateProject: _onCreateProject,
}: TimelineViewProps) {
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [membersProjectId, setMembersProjectId] = useState<string | null>(null);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    if (!showArchived && p.archived) return false;
    if (focusedProjectId && p.id !== focusedProjectId) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(query);
    }
    return true;
  });

  // Date range: 6 months before to 6 months after today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const gridStart = new Date(today);
  gridStart.setMonth(gridStart.getMonth() - 6);

  const gridEnd = new Date(today);
  gridEnd.setMonth(gridEnd.getMonth() + 6);

  // Generate all dates in range
  const allDates: Date[] = [];
  const currentDate = new Date(gridStart);
  while (currentDate <= gridEnd) {
    allDates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const DAY_HEIGHT = 30;

  const focusedProject = focusedProjectId
    ? projects.find((p) => p.id === focusedProjectId)
    : null;
  const focusedProjectStages = focusedProjectId
    ? stages.filter((s) => s.projectId === focusedProjectId)
    : [];

  // Auto-scroll to today on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only scroll
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayIndex = allDates.findIndex(
        (d) =>
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate(),
      );
      if (todayIndex >= 0) {
        const scrollTopValue = todayIndex * DAY_HEIGHT - 200;
        scrollContainerRef.current.scrollTop = Math.max(0, scrollTopValue);
        setScrollTop(Math.max(0, scrollTopValue));
        if (calendarRef.current)
          calendarRef.current.scrollTop = Math.max(0, scrollTopValue);
      }
    }
  }, []);

  // Vertical scroll sync to calendar + horizontal sync to header
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const target = e.target as HTMLDivElement;

    setScrollTop(target.scrollTop);

    // Sync vertical scroll to calendar
    if (calendarRef.current) calendarRef.current.scrollTop = target.scrollTop;

    // Sync horizontal scroll to header
    if (headerScrollRef.current)
      headerScrollRef.current.scrollLeft = target.scrollLeft;

    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  // Header horizontal scroll sync back to body
  const handleHeaderScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const target = e.target as HTMLDivElement;

    if (scrollContainerRef.current)
      scrollContainerRef.current.scrollLeft = target.scrollLeft;

    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const handleCalendarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const top = (e.target as HTMLDivElement).scrollTop;
    setScrollTop(top);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = top;
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const handleStageClick = (stage: Stage) => {
    setEditingStage(stage);
    setShowStageModal(true);
  };

  const handleSaveStage = (updates: Partial<Stage>) => {
    if (editingStage) {
      onUpdateStage(editingStage.id, updates);
    }
    setShowStageModal(false);
    setEditingStage(null);
  };

  const handleDeleteStage = () => {
    if (editingStage) {
      onUpdateStage(editingStage.id, { archived: true });
    }
    setShowStageModal(false);
    setEditingStage(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sticky Header - wrapper with position relative for absolute children */}
      <div style={{ position: "relative" }}>
        <div
          className="flex sticky top-0 z-30 bg-background border-b"
          style={{ minHeight: "95px" }}
        >
          {/* Scrollable project headers */}
          <div
            ref={headerScrollRef}
            className="overflow-x-auto overflow-y-hidden p-4"
            style={{ marginRight: "150px", scrollbarWidth: "none" }}
            onScroll={handleHeaderScroll}
          >
            <div className="flex gap-4">
              {filteredProjects.map((project) => {
                return (
                  <div
                    key={project.id}
                    className="shrink-0 rounded-lg shadow-md overflow-hidden"
                    style={{
                      width: focusedProjectId ? "600px" : "384px",
                      backgroundColor: project.color,
                    }}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {project.name}
                        </h3>
                        {project.archived && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            Archived
                          </span>
                        )}
                      </div>
                      {/* Icon bar — matching Board ProjectCard functionality */}
                      <div className="flex items-center justify-end gap-[15px]">
                        <button
                          type="button"
                          onClick={() =>
                            alert("Files feature — coming in Phase 2")
                          }
                          style={{ width: "14px", height: "14px" }}
                          title="Files"
                        >
                          <FolderOpen className="w-full h-full text-gray-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            alert("Admin Files feature — coming in Phase 2")
                          }
                          style={{ width: "14px", height: "14px" }}
                          title="Admin Files"
                        >
                          <FolderOpen className="w-full h-full text-yellow-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMembersProjectId(project.id)}
                          style={{ width: "14px", height: "14px" }}
                          title="Team"
                        >
                          <Users className="w-full h-full text-gray-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => alert("Project Info — coming soon")}
                          style={{ width: "14px", height: "14px" }}
                          title="Info"
                        >
                          <Info className="w-full h-full text-gray-500" />
                        </button>
                        {onToggleFocus && (
                          <button
                            type="button"
                            onClick={() => onToggleFocus(project.id)}
                            style={{ width: "14px", height: "14px" }}
                            title={
                              focusedProjectId === project.id
                                ? "Show all projects"
                                : "Focus on this project"
                            }
                          >
                            {focusedProjectId === project.id ? (
                              <EyeOff className="w-full h-full text-blue-600" />
                            ) : (
                              <Eye className="w-full h-full text-gray-500" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onCreateStage(project.id, "New Stage")}
                          style={{ width: "14px", height: "14px" }}
                          title="Add Stage"
                        >
                          <Plus className="w-full h-full text-gray-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditProjectId(project.id)}
                          style={{ width: "14px", height: "14px" }}
                          title="Menu"
                        >
                          <MoreVertical className="w-full h-full text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* New Project placeholder - hidden in focus mode */}
              {!focusedProjectId && (
                <div
                  className="shrink-0 bg-gray-50 rounded-lg flex items-center justify-center"
                  style={{ width: "200px", height: "100%" }}
                >
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Project
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Calendar header - pinned to right edge */}
          <div
            className="absolute top-0 bottom-0 right-0 border-l bg-gray-100 flex items-center justify-center font-semibold text-sm"
            style={{ width: "150px" }}
          >
            Calendar
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Today line — fixed horizontally, moves vertically */}
        {(() => {
          const todayIdx = allDates.findIndex(
            (d) =>
              d.getFullYear() === today.getFullYear() &&
              d.getMonth() === today.getMonth() &&
              d.getDate() === today.getDate(),
          );
          if (todayIdx < 0) return null;
          const lineTop = todayIdx * DAY_HEIGHT - scrollTop;
          if (lineTop < -2 || lineTop > window.innerHeight) return null;
          return (
            <div
              style={{
                position: "absolute",
                top: lineTop,
                left: 0,
                right: 0,
                height: 0,
                borderTop: "2px dashed #3b82f6",
                zIndex: 25,
                pointerEvents: "none",
              }}
            />
          );
        })()}

        {/* Scrollable project area */}
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-auto"
          style={{ right: "150px" }}
          onScroll={handleScroll}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              minHeight: allDates.length * DAY_HEIGHT,
              scrollbarWidth: "none",
            }}
          >
            {/* Project columns */}
            {filteredProjects.map((project, projectIdx) => {
              const projectStages = stages.filter(
                (s) => s.projectId === project.id,
              );
              const projectTasks = tasks.filter((t) =>
                projectStages.some((s) => s.id === t.stageId),
              );

              return (
                <div
                  key={project.id}
                  style={{
                    width: focusedProjectId ? "600px" : "384px",
                    flexShrink: 0,
                    marginLeft: projectIdx === 0 ? "16px" : "0",
                    marginRight: focusedProjectId ? "0px" : "16px",
                    position: "relative",
                  }}
                >
                  {/* Stage bars */}
                  {projectStages.map((stage) => {
                    if (!stage.startDate || !stage.endDate) return null;

                    const start = new Date(stage.startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(stage.endDate);
                    end.setHours(0, 0, 0, 0);

                    const startIdx = allDates.findIndex(
                      (d) => d.getTime() === start.getTime(),
                    );
                    const endIdx = allDates.findIndex(
                      (d) => d.getTime() === end.getTime(),
                    );

                    if (startIdx === -1 || endIdx === -1) return null;

                    const top = startIdx * DAY_HEIGHT;
                    const height = (endIdx - startIdx + 1) * DAY_HEIGHT;

                    const stageTasks = projectTasks.filter(
                      (t) => t.stageId === stage.id,
                    );

                    return (
                      <div
                        key={stage.id}
                        style={{
                          position: "absolute",
                          top: `${top}px`,
                          left: 0,
                          right: 0,
                          height: `${height}px`,
                          backgroundColor: stage.color || "#e5e7eb",
                          borderRadius: "6px",
                          padding: "8px",
                          cursor: "pointer",
                          border: "1px solid rgba(0,0,0,0.1)",
                        }}
                        onClick={() => handleStageClick(stage)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            handleStageClick(stage);
                        }}
                      >
                        {/* Top drag handle — resize startDate */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "6px",
                            cursor: "ns-resize",
                            borderRadius: "6px 6px 0 0",
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const startY = e.clientY;
                            const origDate = stage.startDate!;
                            const onMove = (ev: MouseEvent) => {
                              const dy = ev.clientY - startY;
                              const deltaDays = Math.round(dy / DAY_HEIGHT);
                              const d = new Date(origDate);
                              d.setDate(d.getDate() + deltaDays);
                              const newKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                              onUpdateStage(stage.id, { startDate: newKey });
                            };
                            const onUp = () => {
                              window.removeEventListener("mousemove", onMove);
                              window.removeEventListener("mouseup", onUp);
                            };
                            window.addEventListener("mousemove", onMove);
                            window.addEventListener("mouseup", onUp);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                        {/* Bottom drag handle — resize endDate */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "6px",
                            cursor: "ns-resize",
                            borderRadius: "0 0 6px 6px",
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const startY = e.clientY;
                            const origDate = stage.endDate!;
                            const onMove = (ev: MouseEvent) => {
                              const dy = ev.clientY - startY;
                              const deltaDays = Math.round(dy / DAY_HEIGHT);
                              const d = new Date(origDate);
                              d.setDate(d.getDate() + deltaDays);
                              const newKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                              onUpdateStage(stage.id, { endDate: newKey });
                            };
                            const onUp = () => {
                              window.removeEventListener("mousemove", onMove);
                              window.removeEventListener("mouseup", onUp);
                            };
                            window.addEventListener("mousemove", onMove);
                            window.addEventListener("mouseup", onUp);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                        <div className="font-semibold text-sm text-gray-800 mb-1">
                          {stage.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatDate(stage.startDate)} -{" "}
                          {formatDate(stage.endDate)}
                        </div>

                        {/* Dated tasks - positioned at their date row */}
                        {stageTasks
                          .filter((t) => t.dueDate)
                          .reduce(
                            (acc, task) => {
                              if (!task.dueDate) return acc;
                              const existing = acc.find(
                                (a) => a.dateKey === task.dueDate,
                              );
                              if (existing) {
                                existing.tasks.push(task);
                              } else {
                                acc.push({
                                  dateKey: task.dueDate,
                                  tasks: [task],
                                });
                              }
                              return acc;
                            },
                            [] as { dateKey: string; tasks: Task[] }[],
                          )
                          .map(({ dateKey, tasks: dateTasks }) => {
                            const taskDate = new Date(dateKey);
                            taskDate.setHours(0, 0, 0, 0);
                            const stageStart = new Date(stage.startDate!);
                            stageStart.setHours(0, 0, 0, 0);
                            const dayOffset = Math.floor(
                              (taskDate.getTime() - stageStart.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );
                            const taskTop = dayOffset * DAY_HEIGHT;

                            if (taskTop < 0 || taskTop >= height) return null;

                            const firstTask = dateTasks[0];
                            const hasMore = dateTasks.length > 1;

                            return (
                              <div
                                key={dateKey}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                style={{
                                  position: "absolute",
                                  top: `${taskTop + 1}px`,
                                  left: "55%",
                                  right: "5%",
                                  height: `${DAY_HEIGHT - 2}px`,
                                  backgroundColor: "white",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "4px",
                                  padding: "2px 8px",
                                  fontSize: "11px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  zIndex: 6,
                                  overflow: "hidden",
                                }}
                              >
                                <span className="truncate" style={{ flex: 1 }}>
                                  {firstTask.title}
                                </span>
                                {hasMore && (
                                  <span className="ml-1 text-gray-500 font-semibold">
                                    +{dateTasks.length - 1}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Resource grid - inside scroll, order:99 to stay right */}
            {focusedProjectId &&
              focusedProject?.teamMembers &&
              focusedProject.teamMembers.length > 0 && (
                <div
                  style={{
                    flexShrink: 0,
                    borderLeft: "1px solid #e5e7eb",
                    backgroundColor: "white",
                    order: 99,
                    marginLeft: "auto",
                  }}
                >
                  <ResourcePlanningGrid
                    key={`${focusedProjectId}-${focusedProjectStages.map((s) => s.id).join("-")}`}
                    project={focusedProject}
                    stages={focusedProjectStages}
                    allDates={allDates}
                    DAY_HEIGHT={DAY_HEIGHT}
                  />
                </div>
              )}
          </div>
        </div>

        {/* Calendar column - fixed to right edge */}
        <div
          ref={calendarRef}
          className="absolute top-0 bottom-0 right-0 overflow-y-auto border-l bg-gray-50"
          style={{ width: "150px", scrollbarWidth: "none" }}
          onScroll={handleCalendarScroll}
        >
          <div style={{ minHeight: allDates.length * DAY_HEIGHT }}>
            {allDates.map((date) => {
              const isToday =
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate();
              const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

              return (
                <div
                  key={dateKey}
                  style={{
                    height: `${DAY_HEIGHT}px`,
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: isToday ? "bold" : "normal",
                    color: isToday ? "#3b82f6" : "#6b7280",
                    backgroundColor: isToday ? "#eff6ff" : "transparent",
                  }}
                >
                  {date.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage Modal */}
      <StageModal
        isOpen={showStageModal}
        stage={editingStage}
        onSave={handleSaveStage}
        onClose={() => {
          setShowStageModal(false);
          setEditingStage(null);
        }}
        onDelete={handleDeleteStage}
      />

      {/* Project Members Modal */}
      {membersProjectId &&
        (() => {
          const proj = projects.find((p) => p.id === membersProjectId);
          if (!proj) return null;
          return (
            <ProjectMembersModal
              isOpen={true}
              project={proj}
              onClose={() => setMembersProjectId(null)}
              onUpdateProject={(updates: Partial<Project>) => {
                onUpdateProject(proj.id, updates);
              }}
            />
          );
        })()}

      {/* Edit Project Modal */}
      {editProjectId &&
        (() => {
          const proj = projects.find((p) => p.id === editProjectId);
          if (!proj) return null;
          return (
            <EditProjectModal
              isOpen={true}
              project={proj}
              onClose={() => setEditProjectId(null)}
              onSave={(updates: Partial<Project>) => {
                onUpdateProject(proj.id, updates);
                setEditProjectId(null);
              }}
              onDelete={() => {
                onDeleteProject(proj.id);
                setEditProjectId(null);
              }}
              onArchive={() => {
                onArchiveProject(proj.id, !proj.archived);
                setEditProjectId(null);
              }}
            />
          );
        })()}
    </div>
  );
}
