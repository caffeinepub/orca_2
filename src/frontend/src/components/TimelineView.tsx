import type { Project, Stage, Task } from "@/types";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import ResourcePlanningGrid from "./ResourcePlanningGrid";
import TimelineBody from "./TimelineBody";
import TimelineHeader from "./TimelineHeader";
import StageModal from "./modals/StageModal";

interface TimelineViewProps {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
  searchQuery?: string;
  showArchived?: boolean;
  focusedProjectId?: string | null;
  onToggleFocus?: (projectId: string) => void;
  onNavigateToFiles?: (
    projectId: string,
    folderType: "project" | "project_admin",
  ) => void;
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
  onNavigateToFiles,
  onUpdateStage,
  onCreateStage,
  onDeleteProject: _onDeleteProject,
  onUpdateProject: _onUpdateProject,
  onArchiveProject: _onArchiveProject,
  onCreateProject: _onCreateProject,
}: TimelineViewProps) {
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const resourceRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const filteredProjects = projects.filter((p) => {
    if (!showArchived && p.archived) return false;
    if (focusedProjectId && p.id !== focusedProjectId) return false;
    if (searchQuery)
      return p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const gridStart = new Date(today);
  gridStart.setMonth(gridStart.getMonth() - 6);
  const gridEnd = new Date(today);
  gridEnd.setMonth(gridEnd.getMonth() + 6);

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

  // Resource column width: 60px per team member, 0 if no focus
  const resourceColumnWidth =
    focusedProjectId && focusedProject?.teamMembers?.length
      ? focusedProject.teamMembers.length * 60
      : 0;

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
        const sv = todayIndex * DAY_HEIGHT - 200;
        const val = Math.max(0, sv);
        scrollContainerRef.current.scrollTop = val;
        setScrollTop(val);
        if (calendarRef.current) calendarRef.current.scrollTop = val;
        if (resourceRef.current) resourceRef.current.scrollTop = val;
      }
    }
  }, []);

  // Sync: gantt scroll → calendar + resource + header
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    if (calendarRef.current) calendarRef.current.scrollTop = target.scrollTop;
    if (resourceRef.current) resourceRef.current.scrollTop = target.scrollTop;
    if (headerScrollRef.current)
      headerScrollRef.current.scrollLeft = target.scrollLeft;
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  // Sync: header horizontal scroll → gantt
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

  // Sync: calendar vertical scroll → gantt + resource
  const handleCalendarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const top = (e.target as HTMLDivElement).scrollTop;
    setScrollTop(top);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = top;
    if (resourceRef.current) resourceRef.current.scrollTop = top;
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  // Sync: resource vertical scroll → gantt + calendar
  const handleResourceScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const top = (e.target as HTMLDivElement).scrollTop;
    setScrollTop(top);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = top;
    if (calendarRef.current) calendarRef.current.scrollTop = top;
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const handleStageClick = (stage: Stage) => {
    setEditingStage(stage);
    setShowStageModal(true);
  };

  const handleSaveStage = (updates: Partial<Stage>) => {
    if (editingStage) onUpdateStage(editingStage.id, updates);
    setShowStageModal(false);
    setEditingStage(null);
  };

  const handleDeleteStage = () => {
    if (editingStage) onUpdateStage(editingStage.id, { archived: true });
    setShowStageModal(false);
    setEditingStage(null);
  };

  const totalHeight = allDates.length * DAY_HEIGHT;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <TimelineHeader
        filteredProjects={filteredProjects}
        focusedProjectId={focusedProjectId}
        focusedProject={focusedProject}
        headerScrollRef={headerScrollRef}
        onHeaderScroll={handleHeaderScroll}
        onToggleFocus={onToggleFocus}
        onNavigateToFiles={onNavigateToFiles}
        onCreateStage={onCreateStage}
        resourceColumnWidth={resourceColumnWidth}
      />

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Today line */}
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

        {/* === GANTT SCROLL AREA === */}
        {/* Takes up all space EXCEPT calendar (150px) and resource grid */}
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-auto"
          style={{
            right: `${150 + resourceColumnWidth}px`,
            scrollbarWidth: "none",
          }}
          onScroll={handleScroll}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              minHeight: totalHeight,
            }}
          >
            <TimelineBody
              filteredProjects={filteredProjects}
              stages={stages}
              tasks={tasks}
              allDates={allDates}
              DAY_HEIGHT={DAY_HEIGHT}
              focusedProjectId={focusedProjectId}
              onStageClick={handleStageClick}
            />
          </div>
        </div>

        {/* === RESOURCE GRID PANEL === */}
        {/* Fixed panel between gantt and calendar — its own vertical scroll */}
        {resourceColumnWidth > 0 && focusedProject && (
          <div
            ref={resourceRef}
            className="absolute top-0 bottom-0 overflow-y-auto border-l bg-white"
            style={{
              right: "150px",
              width: `${resourceColumnWidth}px`,
              scrollbarWidth: "none",
              borderColor: "#e5e7eb",
            }}
            onScroll={handleResourceScroll}
          >
            <div style={{ minHeight: totalHeight }}>
              <ResourcePlanningGrid
                key={`${focusedProjectId}-${focusedProjectStages.map((s) => s.id).join("-")}`}
                project={focusedProject}
                stages={focusedProjectStages}
                allDates={allDates}
                DAY_HEIGHT={DAY_HEIGHT}
              />
            </div>
          </div>
        )}

        {/* === CALENDAR COLUMN === */}
        {/* Fixed to right edge — its own vertical scroll */}
        <div
          ref={calendarRef}
          className="absolute top-0 bottom-0 right-0 overflow-y-auto border-l bg-gray-50"
          style={{ width: "150px", scrollbarWidth: "none" }}
          onScroll={handleCalendarScroll}
        >
          <div style={{ minHeight: totalHeight }}>
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
    </div>
  );
}
