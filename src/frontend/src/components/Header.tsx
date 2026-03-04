import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { useStableIdentity } from "../hooks/useStableIdentity";

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

interface BoardTabDef {
  id: BoardTab;
  label: string;
  ocid: string;
}

const boardTabs: BoardTabDef[] = [
  { id: "board", label: "Board", ocid: "header.board_tab" },
  { id: "timeline", label: "Timeline", ocid: "header.timeline_tab" },
  { id: "budget", label: "Budget", ocid: "header.budget_tab" },
  { id: "proposal", label: "Proposal", ocid: "header.proposal_tab" },
  { id: "teamtalk", label: "Team Talk", ocid: "header.teamtalk_tab" },
];

const pageLabels: Record<Page, string> = {
  board: "Board",
  files: "Files",
  calendar: "Calendar",
  team: "Team",
  messages: "Messages",
  sales: "Sales",
  analysis: "Analysis",
  settings: "Settings",
};

interface HeaderProps {
  activePage: Page;
  activeBoardTab: BoardTab;
  onBoardTabChange: (tab: BoardTab) => void;
  profile: string | null;
}

export function Header({
  activePage,
  activeBoardTab,
  onBoardTabChange,
  profile,
}: HeaderProps) {
  const { clear, identity } = useStableIdentity();

  // Parse profile for display name
  let displayName = "";
  let initials = "?";
  if (profile) {
    try {
      const parsed = JSON.parse(profile);
      displayName = parsed.fullName ?? "";
      initials = displayName
        .split(" ")
        .slice(0, 2)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();
    } catch {
      // ignore
    }
  }
  if (!initials || initials === "?") {
    const principal = identity?.getPrincipal().toString();
    initials = principal ? principal.slice(0, 2).toUpperCase() : "?";
  }

  return (
    <TooltipProvider delayDuration={200}>
      <header className="h-14 flex items-center border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0 px-4 gap-4">
        {/* Page name / Board tabs */}
        <div className="flex-1 flex items-center min-w-0">
          {activePage === "board" ? (
            <nav className="flex items-center gap-1">
              {boardTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  data-ocid={tab.ocid}
                  onClick={() => onBoardTabChange(tab.id)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150",
                    activeBoardTab === tab.id
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          ) : (
            <h1 className="text-sm font-semibold text-foreground">
              {pageLabels[activePage]}
            </h1>
          )}
        </div>

        {/* User area */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {displayName && (
            <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[140px]">
              {displayName}
            </span>
          )}

          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-ocid="header.logout_button"
                variant="ghost"
                size="icon"
                onClick={clear}
                className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <LogOut className="w-4 h-4" />
                <span className="sr-only">Sign out</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Sign out
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
