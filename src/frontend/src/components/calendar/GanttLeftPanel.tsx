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

    const totalHeight =
      rows.length * ROW_H +
      (resourceMembers.length > 0 ? 32 + resourceMembers.length * ROW_H : 0);

    return (
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="shrink-0 overflow-y-auto overflow-x-hidden border-r"
        style={{ width: 256, scrollbarWidth: "none" }}
      >
        <div style={{ position: "relative", height: totalHeight }}>
          {/* Tree rows — absolute positioned to match right panel exactly */}
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
                className={`absolute w-full flex items-center gap-1 px-2 select-none cursor-pointer hover:bg-gray-50 ${isProject ? "font-semibold text-xs" : "text-xs text-gray-700"}`}
                style={{
                  top: i * ROW_H,
                  height: ROW_H,
                  paddingLeft: 8 + row.indent * 16,
                  borderBottom: "1px solid #e5e7eb",
                  boxSizing: "border-box",
                }}
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

          {/* Resource planning section — also absolute positioned */}
          {resourceMembers.length > 0 && (
            <>
              <div
                className="absolute w-full px-3 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center"
                style={{
                  top: rows.length * ROW_H,
                  height: 32,
                  borderTop: "1px solid #e5e7eb",
                  borderBottom: "1px solid #e5e7eb",
                  boxSizing: "border-box",
                }}
              >
                Resource Planning
              </div>
              {resourceMembers.map((m, mi) => (
                <div
                  key={m.id}
                  className="absolute w-full flex items-center gap-2 px-3"
                  style={{
                    top: rows.length * ROW_H + 32 + mi * ROW_H,
                    height: ROW_H,
                    borderBottom: "1px solid #e5e7eb",
                    boxSizing: "border-box",
                  }}
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
      </div>
    );
  },
);

export default GanttLeftPanel;
