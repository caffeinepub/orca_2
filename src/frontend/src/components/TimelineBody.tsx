import type { Project, Stage, Task } from "@/types";
import { formatDate } from "@/utils/dateFormat";

interface TimelineBodyProps {
  filteredProjects: Project[];
  stages: Stage[];
  tasks: Task[];
  allDates: Date[];
  DAY_HEIGHT: number;
  focusedProjectId: string | null | undefined;
  onStageClick: (stage: Stage) => void;
}

export default function TimelineBody({
  filteredProjects,
  stages,
  tasks,
  allDates,
  DAY_HEIGHT,
  focusedProjectId,
  onStageClick,
}: TimelineBodyProps) {
  return (
    <>
      {filteredProjects.map((project, projectIdx) => {
        const projectStages = stages.filter((s) => s.projectId === project.id);
        const projectTasks = tasks.filter((t) =>
          projectStages.some((s) => s.id === t.stageId),
        );

        return (
          <div
            key={project.id}
            style={{
              width: "384px",
              flexShrink: 0,
              marginLeft: projectIdx === 0 ? "16px" : "0",
              marginRight: focusedProjectId ? "0px" : "16px",
              position: "relative",
            }}
          >
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
                  onClick={() => onStageClick(stage)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onStageClick(stage);
                  }}
                >
                  <div className="font-semibold text-sm text-gray-800 mb-1">
                    {stage.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatDate(stage.startDate)} - {formatDate(stage.endDate)}
                  </div>

                  {/* Dated tasks positioned at their date row */}
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
                          acc.push({ dateKey: task.dueDate, tasks: [task] });
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
    </>
  );
}
