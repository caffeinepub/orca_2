import type { Project } from "@/types";
import { ChevronDown, Plus, Search } from "lucide-react";
import { useState } from "react";
import { type BookingPerson, type BookingStatus, STATUS_CONFIG } from "./types";

interface Props {
  projects: Project[];
  bookings: BookingPerson[];
  selectedPersonId: string | null;
  onSelectPerson: (id: string) => void;
  onAddPerson: () => void;
}

type StatusFilter = "all" | BookingStatus | "unassigned";

export default function TeamTalkSidebar({
  projects,
  bookings,
  selectedPersonId,
  onSelectPerson,
  onAddPerson,
}: Props) {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = bookings.filter((b) => {
    if (projectFilter !== "all" && b.projectId !== projectFilter) return false;
    if (
      search &&
      !b.name.toLowerCase().includes(search.toLowerCase()) &&
      !b.role.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (statusFilter === "unassigned") return b.source === "unassigned";
    if (statusFilter !== "all") return b.status === statusFilter;
    return true;
  });

  const statusPills: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "confirmed", label: "✓ Confirmed" },
    { key: "pending", label: "◷ Pending" },
    { key: "available", label: "○ Available" },
    { key: "unassigned", label: "? Open Roles" },
  ];

  return (
    <div
      className="w-[280px] flex-shrink-0 border-r bg-gray-50 flex flex-col h-full"
      data-ocid="teamtalk.sidebar.panel"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
        <span className="font-semibold text-sm text-gray-900">Team Talk</span>
        <button
          type="button"
          onClick={onAddPerson}
          data-ocid="teamtalk.sidebar.add_person.button"
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-700"
        >
          <Plus className="w-3 h-3" /> Add person
        </button>
      </div>

      {/* Project filter */}
      <div className="px-3 py-2 border-b bg-white">
        <div className="relative">
          <select
            data-ocid="teamtalk.sidebar.project_filter.select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full pl-3 pr-7 py-1.5 text-xs border rounded appearance-none bg-white text-gray-700 cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projects
              .filter((p) => !p.archived)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            data-ocid="teamtalk.sidebar.search.input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or role..."
            className="w-full pl-7 pr-3 py-1.5 text-xs border rounded bg-white"
          />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="px-3 py-2 border-b bg-white flex flex-wrap gap-1">
        {statusPills.map((pill) => (
          <button
            type="button"
            key={pill.key}
            data-ocid={`teamtalk.sidebar.status_${pill.key}.tab`}
            onClick={() => setStatusFilter(pill.key)}
            className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
              statusFilter === pill.key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* People list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div
            className="text-center py-10 text-xs text-gray-400"
            data-ocid="teamtalk.sidebar.people.empty_state"
          >
            No people match your filters
          </div>
        ) : (
          <div data-ocid="teamtalk.sidebar.people.list">
            {filtered.map((person, idx) => {
              const cfg =
                STATUS_CONFIG[
                  person.source === "unassigned" ? "unassigned" : person.status
                ];
              const proj = projects.find((p) => p.id === person.projectId);
              const isSelected = person.id === selectedPersonId;
              return (
                <button
                  type="button"
                  key={person.id}
                  data-ocid={`teamtalk.sidebar.person.item.${idx + 1}`}
                  onClick={() => onSelectPerson(person.id)}
                  className={`w-full text-left px-4 py-3 border-b flex items-center gap-3 transition-colors ${
                    isSelected
                      ? "bg-blue-50 border-l-2 border-l-blue-500"
                      : "hover:bg-white"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                      {person.avatar || person.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${cfg.dot}`}
                    />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {person.name}
                      </span>
                      {person.unread > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full">
                          {person.unread}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {person.role}
                    </div>
                    {proj && (
                      <div className="text-[10px] text-gray-400 truncate">
                        {proj.name}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
