import type { Project, Stage } from "@/types";
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

interface TimelineHeaderProps {
  filteredProjects: Project[];
  focusedProjectId: string | null | undefined;
  focusedProject: Project | null | undefined;
  headerScrollRef: React.RefObject<HTMLDivElement | null>;
  onHeaderScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onToggleFocus?: (projectId: string) => void;
  onCreateStage: (projectId: string, name: string) => void;
  resourceColumnWidth: number;
}

export default function TimelineHeader({
  filteredProjects,
  focusedProjectId,
  focusedProject,
  headerScrollRef,
  onHeaderScroll,
  onToggleFocus,
  onCreateStage,
  resourceColumnWidth,
}: TimelineHeaderProps) {
  return (
    <div style={{ position: "relative" }}>
      <div
        className="flex sticky top-0 z-30 bg-background border-b"
        style={{ minHeight: "95px" }}
      >
        {/* Scrollable project headers */}
        <div
          ref={headerScrollRef}
          className="overflow-x-auto overflow-y-hidden p-4"
          style={{
            marginRight: `${150 + resourceColumnWidth}px`,
            scrollbarWidth: "none",
          }}
          onScroll={onHeaderScroll}
        >
          <div className="flex gap-4">
            {filteredProjects.map((project) => (
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
                  <div className="flex items-center justify-end gap-[15px]">
                    <button
                      type="button"
                      style={{ width: "14px", height: "14px" }}
                      title="Files"
                    >
                      <FolderOpen className="w-full h-full text-gray-500" />
                    </button>
                    <button
                      type="button"
                      style={{ width: "14px", height: "14px" }}
                      title="Admin Files"
                    >
                      <FolderOpen className="w-full h-full text-yellow-500" />
                    </button>
                    <button
                      type="button"
                      style={{ width: "14px", height: "14px" }}
                      title="Team"
                    >
                      <Users className="w-full h-full text-gray-500" />
                    </button>
                    <button
                      type="button"
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
                      style={{ width: "14px", height: "14px" }}
                      title="Menu"
                    >
                      <MoreVertical className="w-full h-full text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

        {/* Resource grid header - initials row */}
        {focusedProjectId &&
          focusedProject?.teamMembers &&
          focusedProject.teamMembers.length > 0 && (
            <div
              className="absolute top-0 bottom-0 flex items-end pb-2 gap-0 border-l bg-background"
              style={{
                right: "150px",
                width: `${resourceColumnWidth}px`,
                borderColor: "#e5e7eb",
                zIndex: 5,
              }}
            >
              {focusedProject.teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center justify-center"
                  style={{ width: "60px" }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.initials}
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Calendar header */}
        <div
          className="absolute top-0 bottom-0 right-0 border-l bg-gray-100 flex items-center justify-center font-semibold text-sm"
          style={{ width: "150px" }}
        >
          Calendar
        </div>
      </div>
    </div>
  );
}
