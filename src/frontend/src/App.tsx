import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import TimelineView from "./components/TimelineView";
import { useProfile } from "./hooks/useProfile";
import { useStableActor } from "./hooks/useStableActor";
import { useStableIdentity } from "./hooks/useStableIdentity";
import { AnalysisPage } from "./pages/AnalysisPage";
import BoardPage from "./pages/BoardPage";
import { CalendarPage } from "./pages/CalendarPage";
import { FilesPage } from "./pages/FilesPage";
import { LoginPage } from "./pages/LoginPage";
import { MessagesPage } from "./pages/MessagesPage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { SalesPage } from "./pages/SalesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TeamPage } from "./pages/TeamPage";
import type { Project, Stage, Task } from "./types";
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

  const [activePage, setActivePage] = useState<Page>("board");
  const [activeBoardTab, setActiveBoardTab] = useState<BoardTab>("board");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery] = useState("");
  const [showArchived] = useState(false);
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scheduleCloudSave = (data: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (actor) actor.saveAppState(data).catch(console.error);
      }, 3000);
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
        const r = result as { "0"?: string } | string | null | undefined;
        const cloudData =
          typeof r === "object" && r !== null && "0" in r ? r["0"] : r;
        if (
          cloudData &&
          typeof cloudData === "string" &&
          cloudData.length > 2
        ) {
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

  const handleToggleFocus = (projectId: string) => {
    setFocusedProjectId((prev) => (prev === projectId ? null : projectId));
  };

  const handleCreateProject = (name: string, color: string) => {
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
              onUpdateStage={handleUpdateStage}
              onCreateStage={handleCreateStage}
              onDeleteProject={handleDeleteProject}
              onUpdateProject={handleUpdateProject}
              onArchiveProject={handleArchiveProject}
              onCreateProject={handleCreateProject}
            />
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
        return <FilesPage />;
      case "calendar":
        return <CalendarPage />;
      case "team":
        return <TeamPage />;
      case "messages":
        return <MessagesPage />;
      case "sales":
        return <SalesPage />;
      case "analysis":
        return <AnalysisPage />;
      case "settings":
        return <SettingsPage />;
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
        />
        <main className="flex-1 overflow-hidden">{renderPage()}</main>
      </div>
      <Toaster />
    </div>
  );
}
