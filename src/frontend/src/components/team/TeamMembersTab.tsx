import type { AppRole, Project, TeamMember } from "@/types";
import { Edit2, Search, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  members: TeamMember[];
  projects: Project[];
  canManage: boolean;
  onUpdateMember: (id: string, updates: Partial<TeamMember>) => void;
  onDeleteMember: (id: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  currentUserId: string;
}

const COLORS = [
  "#ff006e",
  "#fb5607",
  "#ffbe0b",
  "#8ac926",
  "#1982c4",
  "#6a4c93",
  "#ff0054",
  "#06ffa5",
];
const genColor = (n: string) =>
  COLORS[
    Math.abs([...n].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0)) %
      COLORS.length
  ];
const genInitials = (n: string) => {
  const p = n.trim().split(" ");
  return p.length === 1
    ? p[0].substring(0, 2).toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

export default function TeamMembersTab({
  members,
  projects,
  canManage,
  onUpdateMember,
  onDeleteMember,
  onUpdateProject,
}: Props) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    jobTitle: "",
    role: "Standard" as AppRole,
  });

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(search.toLowerCase()),
  );
  const getProjects = (mid: string) =>
    projects
      .filter((p) => p.teamMembers?.some((m) => m.id === mid))
      .map((p) => p.name);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const nm: TeamMember = {
      id: `tm-${Date.now()}`,
      name: form.name,
      email: form.email,
      jobTitle: form.jobTitle,
      role: form.role,
      initials: genInitials(form.name),
      avatarColor: genColor(form.name),
      isPlaceholder: false,
    };
    for (const p of projects) {
      if (!p.archived)
        onUpdateProject(p.id, {
          teamMembers: [...(p.teamMembers || []), nm],
        } as any);
    }
    setForm({ name: "", email: "", jobTitle: "", role: "Standard" });
    setShowAdd(false);
  };

  const handleEdit = (m: TeamMember) => {
    setEditId(m.id);
    setForm({
      name: m.name,
      email: m.email || "",
      jobTitle: m.jobTitle || "",
      role: m.role,
    });
  };

  const handleSaveEdit = () => {
    if (!editId || !form.name.trim()) return;
    onUpdateMember(editId, {
      name: form.name,
      email: form.email,
      jobTitle: form.jobTitle,
      role: form.role,
      initials: genInitials(form.name),
      avatarColor: genColor(form.name),
    });
    setEditId(null);
    setForm({ name: "", email: "", jobTitle: "", role: "Standard" });
  };

  const roleBadge = (role: AppRole) => {
    const c =
      role === "Super Admin"
        ? "bg-purple-100 text-purple-700"
        : role === "Admin"
          ? "bg-blue-100 text-blue-700"
          : role === "Standard"
            ? "bg-gray-100 text-gray-700"
            : "bg-orange-100 text-orange-700";
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${c}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              data-ocid="team.members.search_input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered.length} members
          </span>
        </div>
        {canManage && (
          <button
            type="button"
            data-ocid="team.members.add_button"
            onClick={() => {
              setShowAdd(true);
              setEditId(null);
              setForm({ name: "", email: "", jobTitle: "", role: "Standard" });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>
      {(showAdd || editId) && (
        <div className="px-6 py-3 bg-primary/5 border-b flex items-center gap-3 flex-shrink-0">
          <input
            data-ocid="team.members.name.input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="px-3 py-1.5 text-sm border rounded w-40"
          />
          <input
            data-ocid="team.members.email.input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="px-3 py-1.5 text-sm border rounded w-48"
          />
          <input
            data-ocid="team.members.jobtitle.input"
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            placeholder="Job Title"
            className="px-3 py-1.5 text-sm border rounded w-36"
          />
          <select
            data-ocid="team.members.role.select"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as AppRole })
            }
            className="px-3 py-1.5 text-sm border rounded"
          >
            <option value="Admin">Admin</option>
            <option value="Standard">Standard</option>
            <option value="Freelancer">Freelancer</option>
          </select>
          <button
            type="button"
            data-ocid="team.members.save_button"
            onClick={editId ? handleSaveEdit : handleAdd}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90"
          >
            {editId ? "Save" : "Add"}
          </button>
          <button
            type="button"
            data-ocid="team.members.cancel_button"
            onClick={() => {
              setShowAdd(false);
              setEditId(null);
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm" data-ocid="team.members.table">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left px-6 py-2.5 font-semibold text-foreground">
                Member
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Email
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Job Title
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Role
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Projects
              </th>
              {canManage && (
                <th className="text-right px-4 py-2.5 font-semibold text-foreground w-20">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, idx) => (
              <tr
                key={m.id}
                className="border-b hover:bg-muted/30"
                data-ocid={`team.members.row.${idx + 1}`}
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      {m.initials}
                    </div>
                    <span className="font-medium text-foreground">
                      {m.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {m.email || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {m.jobTitle || "—"}
                </td>
                <td className="px-4 py-3">{roleBadge(m.role)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {getProjects(m.id)
                      .slice(0, 3)
                      .map((n) => (
                        <span
                          key={n}
                          className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground"
                        >
                          {n}
                        </span>
                      ))}
                    {getProjects(m.id).length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{getProjects(m.id).length - 3}
                      </span>
                    )}
                  </div>
                </td>
                {canManage && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        data-ocid={`team.members.edit_button.${idx + 1}`}
                        onClick={() => handleEdit(m)}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        data-ocid={`team.members.delete_button.${idx + 1}`}
                        onClick={() => onDeleteMember(m.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div
            data-ocid="team.members.empty_state"
            className="text-center py-12 text-muted-foreground"
          >
            No team members found
          </div>
        )}
      </div>
    </div>
  );
}
