import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type Page =
  | "board"
  | "files"
  | "calendar"
  | "team"
  | "messages"
  | "sales"
  | "analysis"
  | "settings";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ocid: string;
}

const navItems: NavItem[] = [
  {
    id: "board",
    label: "Board",
    icon: LayoutDashboard,
    ocid: "sidebar.board_link",
  },
  { id: "files", label: "Files", icon: FolderOpen, ocid: "sidebar.files_link" },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
    ocid: "sidebar.calendar_link",
  },
  { id: "team", label: "Team", icon: Users, ocid: "sidebar.team_link" },
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
    ocid: "sidebar.messages_link",
  },
  { id: "sales", label: "Sales", icon: TrendingUp, ocid: "sidebar.sales_link" },
  {
    id: "analysis",
    label: "Analysis",
    icon: BarChart3,
    ocid: "sidebar.analysis_link",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    ocid: "sidebar.settings_link",
  },
];

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  activePage,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex flex-col h-full bg-sidebar border-r border-sidebar-border relative flex-shrink-0 overflow-hidden"
        style={{ minWidth: collapsed ? 64 : 220 }}
      >
        {/* Logo area */}
        <div className="flex items-center h-14 px-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-display font-black text-primary">
                O
              </span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-base font-display font-black text-foreground tracking-tight overflow-hidden whitespace-nowrap"
                >
                  ORCA
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;

            const btn = (
              <button
                type="button"
                key={item.id}
                data-ocid={item.ocid}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "nav-active text-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return btn;
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-sidebar-border flex-shrink-0">
          <Button
            data-ocid="sidebar.collapse_toggle"
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              "w-full h-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
              collapsed ? "px-0 justify-center" : "px-2 justify-end",
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
