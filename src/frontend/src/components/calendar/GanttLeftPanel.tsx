import { ChevronDown, ChevronRight } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef } from "react";

interface Row {
  type: string;
  id: string;
  label: string;
  color?: string;
  indent: number;
}

interface ResourceMember {
  id: string;
  name: string;
  initials: string;
  avatarColor?: string;
  total: number;
}

interface Props {
  rows: Row[];
  expandedProjects: Set<string>;
  expandedStages: Set<string>;
  onToggleProject: (id: string) => void;
  onToggleStage: (id: string) => void;
  resourceMembers?: ResourceMember[];
  ROW_H: number;
  onScroll: (scrollTop: number) => void;
}

const GanttLeftPanel = forwardRef<HTMLDivElement, Props>(
  function GanttLeftPanel(
    {
      rows,
      expandedProjects,
      expandedStages,
      onToggleProject,
      onToggleStage,
      resourceMembers = [],
      ROW_H,
      onScroll,
    },
    ref,
  ) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => scrollRef.current as HTMLDivElement);

    const handleScroll = () => {
      if (scrollRef.current) onScroll(scrollRef.current.scrollTop);
    };

    return (
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="shrink-0 overflow-y-auto overflow-x-hidden border-r"
        style={{ width: 256, scrollbarWidth: "none" }}
      >
        {/* Tree rows */}
        {rows.map((row, i) => {
          const isProject = row.type === "project";
          const isStage = row.type === "stage";
          const isExpProject = expandedProjects.has(row.id);
          const isExpStage = expandedStages.has(row.id);
          return (
            <button
              type="button"
              key={`${row.id}-${i}`}
              data-ocid={
                isProject
                  ? "gantt.project.row"
                  : isStage
                    ? "gantt.stage.row"
                    : "gantt.task.row"
              }
              className={`w-full flex items-center gap-1 px-2 border-b select-none cursor-pointer hover:bg-gray-50 ${isProject ? "font-semibold text-xs" : "text-xs text-gray-700"}`}
              style={{ height: ROW_H, paddingLeft: 8 + row.indent * 16 }}
              onClick={() => {
                if (isProject) onToggleProject(row.id);
                else if (isStage) onToggleStage(row.id);
              }}
            >
              {isProject &&
                (isExpProject ? (
                  <ChevronDown className="w-3 h-3 shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 shrink-0" />
                ))}
              {isStage &&
                (isExpStage ? (
                  <ChevronDown className="w-3 h-3 shrink-0 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 shrink-0 text-gray-400" />
                ))}
              {row.color && (
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: row.color }}
                />
              )}
              <span className="truncate">{row.label}</span>
            </button>
          );
        })}

        {/* Resource planning section */}
        {resourceMembers.length > 0 && (
          <>
            <div
              className="px-3 bg-gray-50 border-b border-t text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center"
              style={{ height: "32px" }}
            >
              Resource Planning
            </div>
            {resourceMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 px-3 border-b"
                style={{ height: ROW_H }}
              >
                <div
                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: m.avatarColor || "#6b7280" }}
                >
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{m.name}</div>
                  <div className="text-[10px] text-gray-400">
                    {m.total.toFixed(1)} days
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    );
  },
);

export default GanttLeftPanel;
