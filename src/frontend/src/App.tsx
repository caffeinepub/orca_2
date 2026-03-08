import { Toaster } from "@/components/ui/sonner";
import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import TimelineView from "./components/TimelineView";
import BudgetView from "./components/budget/BudgetView";
import ProposalView from "./components/proposal/ProposalView";
import TeamTalkView from "./components/teamtalk/TeamTalkView";
import { useProfile } from "./hooks/useProfile";
import { useStableActor } from "./hooks/useStableActor";
import { useStableIdentity } from "./hooks/useStableIdentity";
import { AnalysisPage } from "./pages/AnalysisPage";
import BoardPage from "./pages/BoardPage";
import CalendarPage from "./pages/CalendarPage";
import FilesPage from "./pages/FilesPage";
import { LoginPage } from "./pages/LoginPage";
import { MessagesPage } from "./pages/MessagesPage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { SalesPage } from "./pages/SalesPage";
import SettingsPage from "./pages/SettingsPage";
import TeamPage from "./pages/TeamPage";
import type { ChecklistItem, Project, Stage, Task } from "./types";
import { ensureAllFolders } from "./utils/filesStorage";
import {
  generateId,
  loadFromCloud,
  loadProjects,
  loadStages,
  loadTasks,
  saveProjects,
  saveStages,
  saveTasks,
  setCurrentPrincipal,
} from "./utils/storage";
import { loadTemplates } from "./utils/templateStorage";

type Page =
  | "board"
  | "files"
  | "calendar"
  | "team"
  | "messages"
  | "sales"
  | "analysis"
  | "settings";
type BoardTab = "board" | "timeline" | "budget" | "proposal" | "teamtalk";

// Exported cloud save scheduler — consumed by utils/storage.ts
export let scheduleCloudSave: (data: string) => void = () => {};

export default function App() {
  const { identity, isInitializing } = useStableIdentity();
  const { actor } = useStableActor();
  const { profile, profileLoading } = useProfile();

  const currentPrincipal = identity?.getPrincipal()?.toString() || "";

  const profileData = useMemo(() => {
    if (!profile) return null;
    try {
      return JSON.parse(profile);
    } catch {
      return null;
    }
  }, [profile]);

  const [activePage, setActivePage] = useState<Page>("board");
  const [activeBoardTab, setActiveBoardTab] = useState<BoardTab>("board");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("orca_theme");
    return saved === "dark" ? "dark" : "light";
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery] = useState("");
  const [showArchived] = useState(false);
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);
  const [filesTargetFolderId, setFilesTargetFolderId] = useState<string | null>(
    null,
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastSavedRef = useRef<string | null>(null);
  const saveInProgressRef = useRef(false);

  useEffect(() => {
    scheduleCloudSave = (data: string) => {
      // Skip if identical to last successful save
      if (data === lastSavedRef.current) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (actor && !saveInProgressRef.current) {
          saveInProgressRef.current = true;
          actor
            .saveAppState(data)
            .then((result: unknown) => {
              // Check for Candid { err } variant
              const r = result as Record<string, unknown> | null;
              if (r && "err" in r) {
                console.error("saveAppState returned error:", r.err);
              } else {
                lastSavedRef.current = data;
              }
            })
            .catch((e: unknown) => {
              console.error("saveAppState failed:", e);
            })
            .finally(() => {
              saveInProgressRef.current = false;
            });
        }
      }, 1000);
    };

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [actor]);

  useEffect(() => {
    if (!actor || !identity) return;
    const principal = identity.getPrincipal().toString();
    setCurrentPrincipal(principal);

    actor
      .loadAppState()
      .then((result: unknown) => {
        // Handle Candid variant result: { ok: string } | { err: string }
        // Also handle possible wrapped formats: { "0": string } or raw string
        let cloudData: string | null = null;

        if (result && typeof result === "object") {
          const r = result as Record<string, unknown>;
          if ("ok" in r && typeof r.ok === "string") {
            // Standard Candid variant: { ok: "json_string" }
            cloudData = r.ok;
          } else if ("0" in r && typeof r["0"] === "string") {
            // Indexed wrapper format: { "0": "json_string" }
            cloudData = r["0"];
          } else if (
            "0" in r &&
            typeof r["0"] === "object" &&
            r["0"] !== null
          ) {
            // Nested: { "0": { ok: "json_string" } }
            const inner = r["0"] as Record<string, unknown>;
            if ("ok" in inner && typeof inner.ok === "string") {
              cloudData = inner.ok;
            }
          }
        } else if (typeof result === "string") {
          cloudData = result;
        }

        if (cloudData && cloudData.length > 2) {
          loadFromCloud(cloudData);
        }
        setProjects(loadProjects());
        setStages(loadStages());
        setTasks(loadTasks());
      })
      .catch(() => {
        setProjects(loadProjects());
        setStages(loadStages());
        setTasks(loadTasks());
      });
  }, [actor, identity]);

  useEffect(() => {
    const handleStorageChange = () => {
      setProjects(loadProjects());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Auto-add current user to all projects as a team member (Super Admin)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally using projects.length to avoid infinite loop
  useEffect(() => {
    if (!currentPrincipal || !profileData || projects.length === 0) return;

    const userId = currentPrincipal;
    const userName = profileData.fullName || "User";
    const initials = userName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    let changed = false;
    const updatedProjects = projects.map((p) => {
      if (p.archived) return p;
      const members = p.teamMembers || [];
      if (members.some((m) => m.id === userId)) return p;

      changed = true;
      return {
        ...p,
        teamMembers: [
          ...members,
          {
            id: userId,
            name: userName,
            initials,
            role: "Super Admin" as const,
            avatarColor: "#1982c4",
            isPlaceholder: false,
            jobTitle: profileData.jobTitle || "",
            email: "",
          },
        ],
      };
    });

    if (changed) {
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
    }
  }, [currentPrincipal, profileData, projects.length]);

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("orca_theme", theme);
  }, [theme]);

  const handleToggleFocus = (projectId: string) => {
    setFocusedProjectId((prev) => (prev === projectId ? null : projectId));
  };

  const handleNavigateToFiles = (
    projectId: string,
    folderType: "project" | "project_admin",
  ) => {
    const folders = ensureAllFolders(
      projects,
      currentPrincipal,
      profileData?.fullName || "",
      "Super Admin",
    );
    const target = folders.find(
      (f) => f.projectId === projectId && f.type === folderType,
    );
    if (target) {
      setFilesTargetFolderId(target.id);
      setActivePage("files");
    }
  };

  const handleCreateProject = (
    name: string,
    color: string,
    templateId?: string,
  ) => {
    const maxOrder = projects.reduce(
      (max, p) => Math.max(max, p.order ?? -1),
      -1,
    );
    const newProject: Project = {
      id: generateId(),
      name,
      color,
      archived: false,
      teamMembers: [],
      order: maxOrder + 1,
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    saveProjects(updated);

    // Apply template if selected
    if (templateId) {
      const templates = loadTemplates();
      const tmpl = templates.find((t) => t.id === templateId);
      if (tmpl?.stages) {
        const newStages = tmpl.stages.map((ts, i) => ({
          id: generateId(),
          projectId: newProject.id,
          name: ts.name,
          order: i,
          color: ts.color,
          startDate: tmpl.includeStageDates ? ts.startDate : undefined,
          endDate: tmpl.includeStageDates ? ts.endDate : undefined,
        }));
        const updatedStages = [...stages, ...newStages];
        setStages(updatedStages);
        saveStages(updatedStages);

        // Apply tasks if template has them
        try {
          const taskData = localStorage.getItem(
            `orca_template_tasks_${templateId}`,
          );
          if (taskData && tmpl.includeTasks) {
            const templateTasks = JSON.parse(taskData) as {
              title: string;
              description?: string;
              stageIndex: number;
              order: number;
              milestone?: boolean;
              dueDate?: string;
              checklist?: ChecklistItem[];
            }[];
            const newTasks = templateTasks.map((tt) => ({
              id: generateId(),
              stageId: newStages[tt.stageIndex]?.id || newStages[0]?.id,
              title: tt.title,
              description: tt.description,
              order: tt.order,
              status: "todo" as const,
              milestone: tt.milestone,
              dueDate: tt.dueDate,
              checklist: tt.checklist,
            }));
            const updatedTasks = [...tasks, ...newTasks];
            setTasks(updatedTasks);
            saveTasks(updatedTasks);
          }
        } catch {}
      }
    }
  };

  const handleDeleteProject = (id: string) => {
    const up = projects.filter((p) => p.id !== id);
    setProjects(up);
    saveProjects(up);
    const stageIdsToRemove = stages
      .filter((s) => s.projectId === id)
      .map((s) => s.id);
    const us = stages.filter((s) => s.projectId !== id);
    setStages(us);
    saveStages(us);
    const ut = tasks.filter((t) => !stageIdsToRemove.includes(t.stageId));
    setTasks(ut);
    saveTasks(ut);
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    const updated = projects.map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    );
    setProjects(updated);
    saveProjects(updated);
  };

  const handleArchiveProject = (id: string, archived: boolean) => {
    const updated = projects.map((p) => (p.id === id ? { ...p, archived } : p));
    setProjects(updated);
    saveProjects(updated);
  };

  const handleCreateStage = (projectId: string, name: string) => {
    const projectStages = stages.filter((s) => s.projectId === projectId);
    const newStage: Stage = {
      id: generateId(),
      projectId,
      name,
      order: projectStages.length,
    };
    const updated = [...stages, newStage];
    setStages(updated);
    saveStages(updated);
  };

  const handleUpdateStage = (id: string, updates: Partial<Stage>) => {
    const updated = stages.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setStages(updated);
    saveStages(updated);
  };

  const handleDeleteStage = (id: string) => {
    const us = stages.filter((s) => s.id !== id);
    setStages(us);
    saveStages(us);
    const ut = tasks.filter((t) => t.stageId !== id);
    setTasks(ut);
    saveTasks(ut);
  };

  const handleCreateTask = (stageId: string, title: string) => {
    const stageTasks = tasks.filter((t) => t.stageId === stageId);
    const newTask: Task = {
      id: generateId(),
      stageId,
      title,
      status: "todo",
      order: stageTasks.length,
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    saveTasks(updated);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTasks(updated);
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
  };

  if (!identity || isInitializing)
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );

  if (profileLoading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center animate-pulse">
            <span className="text-sm font-bold text-primary">O</span>
          </div>
          <p className="text-muted-foreground text-sm">Loading workspace...</p>
        </div>
      </div>
    );

  if (profile === null)
    return (
      <>
        <ProfileSetupPage />
        <Toaster />
      </>
    );

  const renderPage = () => {
    switch (activePage) {
      case "board":
        if (activeBoardTab === "timeline") {
          return (
            <TimelineView
              projects={projects}
              stages={stages}
              tasks={tasks}
              searchQuery={searchQuery}
              showArchived={showArchived}
              focusedProjectId={focusedProjectId}
              onToggleFocus={handleToggleFocus}
              onNavigateToFiles={handleNavigateToFiles}
              onUpdateStage={handleUpdateStage}
              onCreateStage={handleCreateStage}
              onDeleteProject={handleDeleteProject}
              onUpdateProject={handleUpdateProject}
              onArchiveProject={handleArchiveProject}
              onCreateProject={handleCreateProject}
            />
          );
        }
        if (activeBoardTab === "budget") {
          return (
            <BudgetView projects={projects} stages={stages} tasks={tasks} />
          );
        }
        if (activeBoardTab === "proposal") {
          return (
            <ProposalView projects={projects} stages={stages} tasks={tasks} />
          );
        }
        if (activeBoardTab === "teamtalk") {
          return (
            <TeamTalkView projects={projects} stages={stages} tasks={tasks} />
          );
        }
        return (
          <BoardPage
            projects={projects}
            stages={stages}
            tasks={tasks}
            searchQuery={searchQuery}
            showArchived={showArchived}
            focusedProjectId={focusedProjectId}
            onToggleFocus={handleToggleFocus}
            onNavigateToFiles={handleNavigateToFiles}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
            onArchiveProject={handleArchiveProject}
            onCreateStage={handleCreateStage}
            onUpdateStage={handleUpdateStage}
            onDeleteStage={handleDeleteStage}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        );
      case "files":
        return (
          <FilesPage
            projects={projects}
            currentUserId={currentPrincipal}
            currentUserName={profileData?.fullName || ""}
            currentUserRole="Super Admin"
            targetFolderId={filesTargetFolderId}
          />
        );
      case "calendar":
        return (
          <CalendarPage
            projects={projects}
            stages={stages}
            tasks={tasks}
            onUpdateStage={handleUpdateStage}
            onUpdateTask={handleUpdateTask}
          />
        );
      case "team":
        return (
          <TeamPage
            projects={projects}
            onUpdateProject={handleUpdateProject}
            currentUserRole={"Super Admin"}
            currentUserId={currentPrincipal}
          />
        );
      case "messages":
        return <MessagesPage />;
      case "sales":
        return <SalesPage />;
      case "analysis":
        return <AnalysisPage />;
      case "settings":
        return <SettingsPage currentUserRole={"Super Admin"} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activePage={activePage}
          activeBoardTab={activeBoardTab}
          onBoardTabChange={setActiveBoardTab}
          profile={profile}
          theme={theme}
          onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
        />
        <main className="flex-1 overflow-hidden">{renderPage()}</main>
      </div>
      <Toaster />
    </div>
  );
}
