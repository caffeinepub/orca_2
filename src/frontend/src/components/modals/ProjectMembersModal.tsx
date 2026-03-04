import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Project, TeamMember } from "@/types";
import { generateId } from "@/utils/storage";
import { UserPlus, X } from "lucide-react";
import { useState } from "react";

const AVATAR_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
}

type AddMode = null | "system" | "external" | "placeholder";

export default function ProjectMembersModal({
  isOpen,
  onClose,
  project,
  onUpdateProject,
}: ProjectMembersModalProps) {
  const [members, setMembers] = useState<TeamMember[]>(
    project.teamMembers || [],
  );
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [newName, setNewName] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<TeamMember["role"]>("Standard");

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const resetForm = () => {
    setNewName("");
    setNewJobTitle("");
    setNewEmail("");
    setNewRole("Standard");
    setAddMode(null);
  };

  const handleAddMember = (isPlaceholder = false) => {
    if (!isPlaceholder && !newName.trim()) return;
    const newMember: TeamMember = isPlaceholder
      ? {
          id: generateId(),
          name: "TBD",
          initials: "?",
          role: "Standard",
          avatarColor: "#adb5bd",
          isPlaceholder: true,
        }
      : {
          id: generateId(),
          name: newName.trim(),
          initials: getInitials(newName.trim()),
          role: newRole,
          avatarColor: AVATAR_COLORS[members.length % AVATAR_COLORS.length],
          isPlaceholder: false,
          jobTitle: newJobTitle.trim() || undefined,
          email: newEmail.trim() || undefined,
        };
    const updated = [...members, newMember];
    setMembers(updated);
    onUpdateProject({ teamMembers: updated });
    resetForm();
  };

  const handleRemoveMember = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    onUpdateProject({ teamMembers: updated });
  };

  const toggleMode = (mode: AddMode) => {
    setAddMode((prev) => (prev === mode ? null : mode));
    setNewName("");
    setNewJobTitle("");
    setNewEmail("");
    setNewRole("Standard");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      data-ocid="members.modal"
    >
      <DialogContent className="w-[480px] max-w-[90vw] max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle>Team Members — {project.name}</DialogTitle>
        </DialogHeader>

        {/* Three add-mode buttons */}
        <div className="flex gap-2 p-4 border-b flex-shrink-0">
          <button
            type="button"
            onClick={() => toggleMode("system")}
            className={`flex-1 text-xs py-1.5 px-2 rounded border transition-colors ${addMode === "system" ? "bg-blue-50 border-blue-400 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            data-ocid="members.modal.add_system.button"
          >
            + Add from System
          </button>
          <button
            type="button"
            onClick={() => toggleMode("external")}
            className={`flex-1 text-xs py-1.5 px-2 rounded border transition-colors ${addMode === "external" ? "bg-blue-50 border-blue-400 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            data-ocid="members.modal.add_external.button"
          >
            + Invite External
          </button>
          <button
            type="button"
            onClick={() => {
              handleAddMember(true);
            }}
            className="flex-1 text-xs py-1.5 px-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            data-ocid="members.modal.add_placeholder.button"
          >
            + Add Placeholder
          </button>
        </div>

        {/* Inline forms */}
        {(addMode === "system" || addMode === "external") && (
          <div className="p-4 border-b bg-gray-50 flex-shrink-0 space-y-3">
            <div>
              <label
                htmlFor="members-add-name"
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                Name *
              </label>
              <input
                id="members-add-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="members.modal.add.name.input"
              />
            </div>
            {addMode === "external" && (
              <div>
                <label
                  htmlFor="members-add-email"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Email
                </label>
                <input
                  id="members-add-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-ocid="members.modal.add.email.input"
                />
              </div>
            )}
            <div>
              <label
                htmlFor="members-add-job-title"
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                Job Title
              </label>
              <input
                id="members-add-job-title"
                type="text"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="Job title..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="members.modal.add.job_title.input"
              />
            </div>
            <div>
              <label
                htmlFor="members-add-role"
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                Role
              </label>
              <select
                id="members-add-role"
                value={newRole}
                onChange={(e) =>
                  setNewRole(e.target.value as TeamMember["role"])
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-ocid="members.modal.add.role.select"
              >
                <option value="Admin">Admin</option>
                <option value="Standard">Standard</option>
                <option value="Freelancer">Freelancer</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAddMember(false)}
                disabled={!newName.trim()}
                className="flex-1 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                data-ocid="members.modal.add.submit.button"
              >
                Add Member
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                data-ocid="members.modal.add.cancel.button"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Member list */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {members.length === 0 && (
              <div
                className="text-center py-8"
                data-ocid="members.modal.empty_state"
              >
                <p className="text-sm text-gray-400">No members yet</p>
              </div>
            )}
            {members.map((member, idx) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                data-ocid={`members.modal.member.item.${idx + 1}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: member.avatarColor }}
                  aria-hidden="true"
                >
                  {member.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {member.name}
                    {member.isPlaceholder && (
                      <span className="text-gray-400 font-normal">
                        {" "}
                        (Placeholder)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {member.jobTitle || member.role}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${member.role === "Admin" ? "bg-purple-100 text-purple-700" : member.role === "Freelancer" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {member.role}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-gray-300 hover:text-red-400 flex-shrink-0"
                  data-ocid={`members.modal.member.delete_button.${idx + 1}`}
                  aria-label={`Remove ${member.name}`}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
