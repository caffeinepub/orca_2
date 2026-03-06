import type { Project, Stage, Task } from "@/types";
import { X } from "lucide-react";
import { useState } from "react";
import MessageTimeline from "./MessageTimeline";
import PortalCard from "./PortalCard";
import {
  ComposeModal,
  InvitePickerModal,
  PortalPreviewModal,
  VarPickerModal,
} from "./TeamTalkModals";
import TeamTalkSidebar from "./TeamTalkSidebar";
import type { BookingPerson, MessageType, SendChannel } from "./types";
import { useTeamTalk } from "./useTeamTalk";
import { useVariableResolver } from "./useVariableResolver";

interface Props {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
}

type ModalState =
  | "none"
  | "compose"
  | "varpicker"
  | "invite"
  | "portal"
  | "edit";

export default function TeamTalkView({
  projects,
  stages: _stages,
  tasks: _tasks,
}: Props) {
  const {
    bookings,
    templates,
    selectedPersonId,
    selectedPerson,
    setSelectedPersonId,
    updateBooking,
    addBooking,
    sendMessage,
    confirmBooking,
    messagesForPerson,
  } = useTeamTalk(projects);

  const [modal, setModal] = useState<ModalState>("none");
  const [varPickerInsertFn, setVarPickerInsertFn] = useState<
    ((key: string) => void) | null
  >(null);

  const selectedProject = projects.find(
    (p) => p.id === selectedPerson?.projectId,
  );
  const resolve = useVariableResolver(selectedPerson, selectedProject || null);

  const personMessages = selectedPersonId
    ? messagesForPerson(selectedPersonId)
    : [];

  const handleSend = (msg: {
    personId: string;
    type: MessageType;
    from: string;
    channel?: SendChannel;
    subject?: string;
    body: string;
  }) => {
    sendMessage({
      ...msg,
      body: resolve(msg.body),
      subject: msg.subject ? resolve(msg.subject) : undefined,
    });
  };

  const handleOpenVarPicker = (onInsert: (key: string) => void) => {
    setVarPickerInsertFn(() => onInsert);
    setModal("varpicker");
  };

  const handleInvite = (email: string, name: string) => {
    if (!selectedPerson) return;
    sendMessage({
      personId: selectedPerson.id,
      type: "invite",
      from: "me",
      channel: "email",
      subject: resolve("{{role}} — {{projectName}}"),
      body: `Invite sent to ${name} (${email})`,
    });
  };

  const handleAddPerson = () => {
    const projectId = projects.filter((p) => !p.archived)[0]?.id || "";
    if (!projectId) return;
    const newId = addBooking({
      name: "New Person",
      role: "Freelancer",
      projectId,
      source: "temp",
      avatar: "NP",
      status: "available",
      email: "",
      rate: 0,
      dates: [],
      jobDesc: "",
      links: [],
      unread: 0,
    });
    setSelectedPersonId(newId);
  };

  const handleEditSave = (updates: Partial<BookingPerson>) => {
    if (selectedPerson) updateBooking(selectedPerson.id, updates);
    setModal("none");
  };

  return (
    <div
      className="h-full flex overflow-hidden bg-white"
      data-ocid="teamtalk.view.page"
    >
      {/* Left sidebar */}
      <TeamTalkSidebar
        projects={projects}
        bookings={bookings}
        selectedPersonId={selectedPersonId}
        onSelectPerson={setSelectedPersonId}
        onAddPerson={handleAddPerson}
      />

      {/* Right panel */}
      {selectedPerson ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <PortalCard
            person={selectedPerson}
            project={selectedProject}
            onConfirm={() => confirmBooking(selectedPerson.id)}
            onInvite={() => setModal("invite")}
            onPortalPreview={() => setModal("portal")}
            onEdit={() => setModal("edit")}
          />
          <MessageTimeline
            messages={personMessages}
            personId={selectedPerson.id}
            onSend={handleSend}
            onOpenCompose={() => setModal("compose")}
            onOpenTemplates={() => setModal("compose")}
            onOpenVarPicker={handleOpenVarPicker}
          />
        </div>
      ) : (
        <div
          className="flex-1 flex items-center justify-center text-sm text-gray-400"
          data-ocid="teamtalk.right_panel.empty_state"
        >
          Select a person to view their portal and messages
        </div>
      )}

      {/* Modals */}
      {modal === "compose" && selectedPerson && (
        <ComposeModal
          person={selectedPerson}
          project={selectedProject}
          templates={templates}
          onSend={(msg) => {
            handleSend(msg);
            setModal("none");
          }}
          onClose={() => setModal("none")}
        />
      )}
      {modal === "varpicker" && selectedPerson && varPickerInsertFn && (
        <VarPickerModal
          person={selectedPerson}
          project={selectedProject}
          onInsert={varPickerInsertFn}
          onClose={() => setModal("none")}
        />
      )}
      {modal === "invite" && (
        <InvitePickerModal
          onInvite={handleInvite}
          onClose={() => setModal("none")}
        />
      )}
      {modal === "portal" && selectedPerson && (
        <PortalPreviewModal
          person={selectedPerson}
          project={selectedProject}
          onClose={() => setModal("none")}
        />
      )}
      {modal === "edit" && selectedPerson && (
        <EditPersonModal
          person={selectedPerson}
          onSave={handleEditSave}
          onClose={() => setModal("none")}
        />
      )}
    </div>
  );
}

// ── Inline EditPersonModal ────────────────────────────────────────────────────

function EditPersonModal({
  person,
  onSave,
  onClose,
}: {
  person: BookingPerson;
  onSave: (u: Partial<BookingPerson>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(person.name);
  const [role, setRole] = useState(person.role);
  const [email, setEmail] = useState(person.email);
  const [rate, setRate] = useState(String(person.rate));
  const [jobDesc, setJobDesc] = useState(person.jobDesc);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      data-ocid="teamtalk.edit.modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Edit Person</h3>
          <button
            type="button"
            data-ocid="teamtalk.edit.close.button"
            onClick={onClose}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label
              htmlFor="edit-name"
              className="text-xs font-medium text-gray-600"
            >
              Name
            </label>
            <input
              id="edit-name"
              data-ocid="teamtalk.edit.name.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border rounded"
            />
          </div>
          <div>
            <label
              htmlFor="edit-role"
              className="text-xs font-medium text-gray-600"
            >
              Role
            </label>
            <input
              id="edit-role"
              data-ocid="teamtalk.edit.role.input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border rounded"
            />
          </div>
          <div>
            <label
              htmlFor="edit-email"
              className="text-xs font-medium text-gray-600"
            >
              Email
            </label>
            <input
              id="edit-email"
              data-ocid="teamtalk.edit.email.input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full mt-1 px-3 py-2 text-sm border rounded"
            />
          </div>
          <div>
            <label
              htmlFor="edit-rate"
              className="text-xs font-medium text-gray-600"
            >
              Day Rate (£)
            </label>
            <input
              id="edit-rate"
              data-ocid="teamtalk.edit.rate.input"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              type="number"
              min="0"
              className="w-full mt-1 px-3 py-2 text-sm border rounded"
            />
          </div>
          <div>
            <label
              htmlFor="edit-jobdesc"
              className="text-xs font-medium text-gray-600"
            >
              Job Description
            </label>
            <textarea
              id="edit-jobdesc"
              data-ocid="teamtalk.edit.jobdesc.textarea"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 text-sm border rounded resize-none"
            />
          </div>
        </div>
        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <button
            type="button"
            data-ocid="teamtalk.edit.cancel.button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="teamtalk.edit.save.button"
            onClick={() =>
              onSave({ name, role, email, rate: Number(rate), jobDesc })
            }
            className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
