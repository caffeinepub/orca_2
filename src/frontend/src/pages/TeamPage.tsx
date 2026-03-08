import HolidaysTab from "@/components/team/HolidaysTab";
import RolladexTab from "@/components/team/RolladexTab";
import TeamMembersTab from "@/components/team/TeamMembersTab";
import TimesheetsTab from "@/components/team/TimesheetsTab";
import type { AppRole, Project, TeamMember } from "@/types";
import { hasPermission } from "@/utils/permissions";
import { BookUser, Clock, Palmtree, Users } from "lucide-react";
import { useMemo, useState } from "react";

interface TeamPageProps {
  projects: Project[];
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  currentUserRole: AppRole;
  currentUserId: string;
}

export default function TeamPage({
  projects,
  onUpdateProject,
  currentUserRole,
  currentUserId,
}: TeamPageProps) {
  const [activeTab, setActiveTab] = useState("members");

  const allMembers = useMemo(() => {
    const map = new Map<string, TeamMember>();
    for (const p of projects) {
      for (const m of p.teamMembers || []) {
        if (!map.has(m.id)) map.set(m.id, m);
      }
    }
    return Array.from(map.values());
  }, [projects]);

  const canManageTeam = hasPermission(currentUserRole, "manage_team");

  const handleUpdateMember = (
    memberId: string,
    updates: Partial<TeamMember>,
  ) => {
    for (const p of projects) {
      const idx = p.teamMembers?.findIndex((m) => m.id === memberId) ?? -1;
      if (idx >= 0 && p.teamMembers) {
        const updated = [...p.teamMembers];
        updated[idx] = { ...updated[idx], ...updates };
        onUpdateProject(p.id, { teamMembers: updated } as any);
      }
    }
  };

  const handleDeleteMember = (memberId: string) => {
    if (!confirm("Remove this team member from all projects?")) return;
    for (const p of projects) {
      if (p.teamMembers?.some((m) => m.id === memberId))
        onUpdateProject(p.id, {
          teamMembers: p.teamMembers.filter((m) => m.id !== memberId),
        } as any);
    }
  };

  const tabs = [
    { id: "members", label: "Team Members", icon: Users },
    { id: "holidays", label: "Holidays", icon: Palmtree },
    { id: "rolladex", label: "Rolodex", icon: BookUser },
    { id: "timesheets", label: "My Timesheets", icon: Clock },
  ];

  const visibleTabs = tabs.filter((tab) => {
    if (currentUserRole === "Super Admin") return true;
    if (tab.id === "members")
      return hasPermission(currentUserRole, "team_members_tab");
    if (tab.id === "holidays")
      return hasPermission(currentUserRole, "holiday_tab");
    if (tab.id === "rolladex")
      return hasPermission(currentUserRole, "rolladex_tab");
    if (tab.id === "timesheets")
      return hasPermission(currentUserRole, "timesheet_summary");
    return true;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-6 py-3 border-b bg-card flex-shrink-0">
        {visibleTabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            data-ocid={`team.${tab.id}.tab`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "members" && (
          <TeamMembersTab
            members={allMembers}
            projects={projects}
            canManage={canManageTeam}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onUpdateProject={onUpdateProject}
            currentUserId={currentUserId}
          />
        )}
        {activeTab === "holidays" && (
          <HolidaysTab
            members={allMembers}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        )}
        {activeTab === "rolladex" && <RolladexTab />}
        {activeTab === "timesheets" && (
          <TimesheetsTab currentUserId={currentUserId} />
        )}
      </div>
    </div>
  );
}
