import { CreateProjectModal } from "@/components/CreateProjectModal";
import { TaskEditModal } from "@/components/TaskEditModal";
import type { Project, Stage, Task } from "@/types";
import {
  generateId,
  loadProjects,
  loadStages,
  loadTasks,
  saveProjects,
  saveStages,
  saveTasks,
} from "@/utils/storage";
import {
  Archive,
  ArrowLeft,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function BoardPage({ activeTab = "board" }: { activeTab?: string }) {
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [stages, setStages] = useState<Stage[]>(loadStages);
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const c = () => setMenuOpen(null);
    document.addEventListener("click", c);
    return () => document.removeEventListener("click", c);
  }, [menuOpen]);

  const up = useCallback((fn: (p: Project[]) => Project[]) => {
    setProjects((prev) => {
      const n = fn(prev);
      saveProjects(n);
      return n;
    });
  }, []);
  const us = useCallback((fn: (s: Stage[]) => Stage[]) => {
    setStages((prev) => {
      const n = fn(prev);
      saveStages(n);
      return n;
    });
  }, []);
  const ut = useCallback((fn: (t: Task[]) => Task[]) => {
    setTasks((prev) => {
      const n = fn(prev);
      saveTasks(n);
      return n;
    });
  }, []);

  const createProject = useCallback(
    (name: string, color: string) => {
      up((p) => [
        ...p,
        {
          id: generateId(),
          name,
          color,
          archived: false,
          order: p.length,
          teamMembers: [],
        },
      ]);
      setShowCreate(false);
    },
    [up],
  );
  const archiveProject = useCallback(
    (id: string) => {
      up((p) => p.map((x) => (x.id === id ? { ...x, archived: true } : x)));
      setMenuOpen(null);
    },
    [up],
  );
  const deleteProject = useCallback(
    (id: string) => {
      const sids = new Set(
        stages.filter((s) => s.projectId === id).map((s) => s.id),
      );
      up((p) => p.filter((x) => x.id !== id));
      us((s) => s.filter((x) => x.projectId !== id));
      ut((t) => t.filter((x) => !sids.has(x.stageId)));
      setMenuOpen(null);
      if (focusedId === id) setFocusedId(null);
    },
    [stages, focusedId, up, us, ut],
  );

  const addStage = useCallback(() => {
    if (!focusedId) return;
    us((s) => {
      const c = s.filter((x) => x.projectId === focusedId).length;
      return [
        ...s,
        {
          id: generateId(),
          projectId: focusedId,
          name: `Stage ${c + 1}`,
          color: "#ffffff",
          order: c,
        },
      ];
    });
  }, [focusedId, us]);
  const deleteStage = useCallback(
    (id: string) => {
      us((s) => s.filter((x) => x.id !== id));
      ut((t) => t.filter((x) => x.stageId !== id));
    },
    [us, ut],
  );
  const _renameStage = useCallback(
    (id: string, name: string) => {
      us((s) => s.map((x) => (x.id === id ? { ...x, name } : x)));
    },
    [us],
  );

  const addTask = useCallback(
    (stageId: string) => {
      ut((t) => {
        const c = t.filter((x) => x.stageId === stageId).length;
        return [
          ...t,
          {
            id: generateId(),
            stageId,
            title: "New Task",
            status: "todo" as const,
            order: c,
            archived: false,
            assignees: [],
            checklist: [],
            completed: false,
          },
        ];
      });
    },
    [ut],
  );
  const saveTask = useCallback(
    (task: Task) => {
      ut((t) => t.map((x) => (x.id === task.id ? task : x)));
      setEditingTask(null);
    },
    [ut],
  );
  const archiveTask = useCallback(
    (id: string) => {
      ut((t) => t.map((x) => (x.id === id ? { ...x, archived: true } : x)));
      setEditingTask(null);
    },
    [ut],
  );

  const onDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("taskId", id);
  }, []);
  const onDrop = useCallback(
    (e: React.DragEvent, stageId: string) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("taskId");
      if (id) ut((t) => t.map((x) => (x.id === id ? { ...x, stageId } : x)));
    },
    [ut],
  );

  // Tab placeholders
  if (activeTab !== "board")
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          {activeTab} — Coming Soon
        </p>
      </div>
    );

  // Kanban view for focused project
  const focused = projects.find((p) => p.id === focusedId);
  if (focused) {
    const pStages = stages
      .filter((s) => s.projectId === focused.id)
      .sort((a, b) => a.order - b.order);
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-3 flex items-center gap-3 flex-shrink-0 border-b">
          <button
            type="button"
            onClick={() => setFocusedId(null)}
            className="p-1 rounded hover:bg-accent"
            data-ocid="board.kanban.back_button"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: focused.color }}
          />
          <span className="text-sm font-semibold">{focused.name}</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={addStage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground"
            data-ocid="board.kanban.add_stage_button"
          >
            <Plus className="w-3.5 h-3.5" /> Add Stage
          </button>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div
            className="flex gap-4 p-6 h-full items-start"
            style={{ minWidth: "max-content" }}
          >
            {pStages.map((stage, stageIdx) => {
              const sTasks = tasks
                .filter((t) => t.stageId === stage.id && !t.archived)
                .sort((a, b) => a.order - b.order);
              return (
                <div
                  key={stage.id}
                  className="w-[280px] flex-shrink-0 flex flex-col rounded-xl border bg-card"
                  style={{ height: "calc(100vh - 12rem)" }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, stage.id)}
                  data-ocid={`board.kanban.stage.${stageIdx + 1}`}
                >
                  <div className="p-3 flex items-center gap-2 border-b">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        background:
                          stage.color === "#ffffff"
                            ? "hsl(var(--muted))"
                            : stage.color,
                      }}
                    />
                    <span className="text-sm font-semibold flex-1 truncate">
                      {stage.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {sTasks.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteStage(stage.id)}
                      className="text-muted-foreground hover:text-destructive p-0.5"
                      data-ocid={`board.kanban.stage.delete_button.${stageIdx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {sTasks.map((task, taskIdx) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task.id)}
                        onClick={() => setEditingTask(task)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && setEditingTask(task)
                        }
                        className="p-3 rounded-lg border bg-background cursor-pointer hover:border-primary/40 transition-colors"
                        data-ocid={`board.kanban.task.item.${taskIdx + 1}`}
                      >
                        <p className="text-sm font-medium">{task.title}</p>
                        <div className="flex gap-1.5 mt-1.5">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${task.status === "done" ? "bg-green-500/15 text-green-500" : task.status === "inProgress" ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"}`}
                          >
                            {task.status === "inProgress"
                              ? "In Progress"
                              : task.status === "done"
                                ? "Done"
                                : "Todo"}
                          </span>
                          {task.priority && (
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${task.priority === "high" ? "bg-red-500/15 text-red-500" : task.priority === "medium" ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"}`}
                            >
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t">
                    <button
                      type="button"
                      onClick={() => addTask(stage.id)}
                      className="w-full flex items-center gap-1.5 justify-center text-xs py-2 rounded-lg border border-dashed text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                      data-ocid={`board.kanban.stage.add_task_button.${stageIdx + 1}`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <TaskEditModal
          task={editingTask}
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={saveTask}
          onArchive={archiveTask}
        />
      </div>
    );
  }

  // Project grid
  const scMap = new Map<string, number>();
  for (const s of stages)
    scMap.set(s.projectId, (scMap.get(s.projectId) || 0) + 1);
  const s2p = new Map<string, string>();
  for (const s of stages) s2p.set(s.id, s.projectId);
  const tcMap = new Map<string, number>();
  for (const t of tasks) {
    if (t.archived) continue;
    const p = s2p.get(t.stageId);
    if (p) tcMap.set(p, (tcMap.get(p) || 0) + 1);
  }
  const filtered = projects.filter((p) => {
    if (!showArchived && p.archived) return false;
    if (search) return p.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  return (
    <div className="p-6 space-y-4 overflow-auto flex-1">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border bg-card">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="bg-transparent border-none outline-none text-sm flex-1"
            data-ocid="board.search_input"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowArchived(!showArchived)}
          className={`px-3 py-2 rounded-lg text-xs font-medium border ${showArchived ? "bg-primary/10 text-primary" : "bg-card text-muted-foreground"}`}
          data-ocid="board.archive.toggle"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground"
          data-ocid="board.new_project.primary_button"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        data-ocid="board.projects.list"
      >
        {filtered.map((p, idx) => (
          <div
            key={p.id}
            onClick={() => setFocusedId(p.id)}
            onKeyDown={(e) => e.key === "Enter" && setFocusedId(p.id)}
            className="rounded-xl cursor-pointer border bg-card hover:border-primary/40 transition-all relative group"
            style={{ opacity: p.archived ? 0.5 : 1 }}
            data-ocid={`board.projects.item.${idx + 1}`}
          >
            <div
              className="h-1.5 rounded-t-xl"
              style={{ background: p.color }}
            />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === p.id ? null : p.id);
                  }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                  data-ocid={`board.projects.open_modal_button.${idx + 1}`}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                {menuOpen === p.id && (
                  <div
                    className="absolute right-3 top-12 rounded-lg shadow-xl z-50 py-1 min-w-[120px] border bg-popover"
                    data-ocid={`board.projects.dropdown_menu.${idx + 1}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveProject(p.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent"
                      data-ocid={`board.projects.archive_button.${idx + 1}`}
                    >
                      <Archive className="w-3 h-3" /> Archive
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(p.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-accent"
                      data-ocid={`board.projects.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{scMap.get(p.id) || 0} stages</span>
                <span>·</span>
                <span>{tcMap.get(p.id) || 0} tasks</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div
          className="text-center py-16"
          data-ocid="board.projects.empty_state"
        >
          <p className="text-sm text-muted-foreground mb-3">
            {search ? "No projects match" : "No projects yet"}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="text-sm font-medium text-primary"
              data-ocid="board.projects.empty_state.primary_button"
            >
              Create your first project
            </button>
          )}
        </div>
      )}
      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createProject}
      />
    </div>
  );
}
