import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { useProfile } from "./hooks/useProfile";
import { useStableActor } from "./hooks/useStableActor";
import { useStableIdentity } from "./hooks/useStableIdentity";
import { AnalysisPage } from "./pages/AnalysisPage";
import { BoardPage } from "./pages/BoardPage";
import { CalendarPage } from "./pages/CalendarPage";
import { FilesPage } from "./pages/FilesPage";
import { LoginPage } from "./pages/LoginPage";
import { MessagesPage } from "./pages/MessagesPage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { SalesPage } from "./pages/SalesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TeamPage } from "./pages/TeamPage";

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

// Exported cloud save scheduler
export let scheduleCloudSave: (data: string) => void = () => {};

export default function App() {
  const { identity, isInitializing } = useStableIdentity();
  const { actor } = useStableActor();
  const { profile, profileLoading } = useProfile();

  const [activePage, setActivePage] = useState<Page>("board");
  const [activeBoardTab, setActiveBoardTab] = useState<BoardTab>("board");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Cloud save debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set up cloud save scheduler
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

  // Load app state on login
  useEffect(() => {
    if (!actor || !identity) return;
    actor.loadAppState().catch(console.error);
  }, [actor, identity]);

  // Show login if not authenticated
  if (!identity || isInitializing) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  // Show profile setup if authenticated but no profile yet
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center animate-pulse-slow">
            <span className="text-sm font-display font-black text-primary">
              O
            </span>
          </div>
          <p className="text-muted-foreground text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (profile === null) {
    return (
      <>
        <ProfileSetupPage />
        <Toaster />
      </>
    );
  }

  // Main app shell
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

        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col min-h-0">
            {activePage === "board" && <BoardPage activeTab={activeBoardTab} />}
            {activePage === "files" && <FilesPage />}
            {activePage === "calendar" && <CalendarPage />}
            {activePage === "team" && <TeamPage />}
            {activePage === "messages" && <MessagesPage />}
            {activePage === "sales" && <SalesPage />}
            {activePage === "analysis" && <AnalysisPage />}
            {activePage === "settings" && <SettingsPage />}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
}
