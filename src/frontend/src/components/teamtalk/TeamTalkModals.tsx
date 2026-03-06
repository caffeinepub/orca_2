import type { Project } from "@/types";
import { ChevronDown, FileText, Globe, Search, Send, X } from "lucide-react";
import { useState } from "react";
import type {
  BookingPerson,
  BookingTemplate,
  MessageType,
  SendChannel,
} from "./types";
import { buildVarPreviewGroups } from "./useVariableResolver";

// ── ComposeModal ─────────────────────────────────────────────────────────────
interface ComposeProps {
  person: BookingPerson;
  project: Project | undefined;
  templates: BookingTemplate[];
  onSend: (msg: {
    personId: string;
    type: MessageType;
    from: string;
    channel?: SendChannel;
    subject?: string;
    body: string;
  }) => void;
  onClose: () => void;
}

export function ComposeModal({
  person,
  project,
  templates,
  onSend,
  onClose,
}: ComposeProps) {
  const [channel, setChannel] = useState<SendChannel>("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showTpl, setShowTpl] = useState(false);
  const [showVars, setShowVars] = useState(false);

  const varGroups = buildVarPreviewGroups(person, project || null);

  const insertVar = (key: string) => {
    setBody((prev) => prev + key);
    setShowVars(false);
  };
  const loadTemplate = (tpl: BookingTemplate) => {
    setSubject(tpl.subject);
    setBody(tpl.body);
    setShowTpl(false);
  };

  const handleSend = () => {
    if (!body.trim()) return;
    onSend({
      personId: person.id,
      type: "general",
      from: "me",
      channel,
      subject,
      body,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      data-ocid="teamtalk.compose.modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Compose Message</h3>
          <button
            type="button"
            data-ocid="teamtalk.compose.close.button"
            onClick={onClose}
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {/* Channel toggle */}
          <div className="flex border rounded overflow-hidden text-xs w-fit">
            <button
              type="button"
              data-ocid="teamtalk.compose.email.toggle"
              onClick={() => setChannel("email")}
              className={`px-3 py-1.5 ${channel === "email" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Email
            </button>
            <button
              type="button"
              data-ocid="teamtalk.compose.message.toggle"
              onClick={() => setChannel("message")}
              className={`px-3 py-1.5 border-l ${channel === "message" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Message
            </button>
          </div>
          {/* Subject */}
          {channel === "email" && (
            <input
              data-ocid="teamtalk.compose.subject.input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject..."
              className="w-full px-3 py-2 text-sm border rounded"
            />
          )}
          {/* Body toolbar */}
          <div className="flex gap-2 items-center">
            <div className="relative">
              <button
                type="button"
                data-ocid="teamtalk.compose.templates.button"
                onClick={() => {
                  setShowTpl(!showTpl);
                  setShowVars(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
              >
                <FileText className="w-3 h-3" /> Templates
              </button>
              {showTpl && (
                <div
                  className="absolute left-0 top-full mt-1 w-72 bg-white border rounded-lg shadow-lg z-10 p-2 max-h-56 overflow-y-auto"
                  data-ocid="teamtalk.compose.templates.dropdown"
                >
                  {templates.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => loadTemplate(t)}
                      className="w-full text-left px-3 py-2 text-xs rounded hover:bg-gray-50 flex justify-between items-center"
                    >
                      <span className="font-medium">{t.name}</span>
                      <span className="text-gray-400 text-[10px]">
                        {t.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                data-ocid="teamtalk.compose.vars.button"
                onClick={() => {
                  setShowVars(!showVars);
                  setShowTpl(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
              >
                <ChevronDown className="w-3 h-3" /> Variables
              </button>
              {showVars && (
                <div
                  className="absolute left-0 top-full mt-1 w-80 bg-white border rounded-lg shadow-lg z-10 p-2 max-h-64 overflow-y-auto"
                  data-ocid="teamtalk.compose.vars.dropdown"
                >
                  {varGroups.map((g) => (
                    <div key={g.group} className="mb-2">
                      <div className="text-[10px] font-bold text-gray-500 uppercase px-1 mb-0.5">
                        {g.group}
                      </div>
                      {g.vars.map((v) => (
                        <button
                          type="button"
                          key={v.key}
                          onClick={() => insertVar(v.key)}
                          className="w-full text-left px-2 py-1 text-xs rounded hover:bg-blue-50 flex justify-between"
                        >
                          <span className="font-mono text-blue-600">
                            {v.key.replace(/\{\{|\}\}/g, "")}
                          </span>
                          <span className="text-gray-400 text-[10px] truncate ml-2 max-w-[130px]">
                            {v.preview}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Body */}
          <textarea
            data-ocid="teamtalk.compose.body.textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message body..."
            rows={8}
            className="w-full px-3 py-2 text-sm border rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <button
            type="button"
            data-ocid="teamtalk.compose.cancel.button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="teamtalk.compose.send.button"
            onClick={handleSend}
            disabled={!body.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VarPickerModal ────────────────────────────────────────────────────────────
interface VarPickerProps {
  person: BookingPerson;
  project: Project | undefined;
  onInsert: (key: string) => void;
  onClose: () => void;
}

export function VarPickerModal({
  person,
  project,
  onInsert,
  onClose,
}: VarPickerProps) {
  const varGroups = buildVarPreviewGroups(person, project || null);
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      data-ocid="teamtalk.varpicker.modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Insert Variable</h3>
          <button
            type="button"
            data-ocid="teamtalk.varpicker.close.button"
            onClick={onClose}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {varGroups.map((g) => (
            <div key={g.group} className="mb-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1 mb-1">
                {g.group}
              </div>
              {g.vars.map((v) => (
                <button
                  type="button"
                  key={v.key}
                  data-ocid={`teamtalk.varpicker.${v.key.replace(/\{\{|\}\}/g, "")}.button`}
                  onClick={() => {
                    onInsert(v.key);
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-blue-50 flex justify-between items-center"
                >
                  <span className="font-mono text-blue-600 font-medium">
                    {v.key.replace(/\{\{|\}\}/g, "")}
                  </span>
                  <span className="text-gray-400 text-[10px] truncate ml-2 max-w-[150px]">
                    {v.preview}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── InvitePickerModal ─────────────────────────────────────────────────────────
interface InvitePickerProps {
  onInvite: (email: string, name: string) => void;
  onClose: () => void;
}

interface RolodexContact {
  id: string;
  name: string;
  email: string;
  role?: string;
}

function loadRolodex(): RolodexContact[] {
  try {
    return JSON.parse(localStorage.getItem("orca_rolladex") || "[]");
  } catch {
    return [];
  }
}

export function InvitePickerModal({ onInvite, onClose }: InvitePickerProps) {
  const [search, setSearch] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalName, setExternalName] = useState("");
  const contacts = loadRolodex();

  const filtered = contacts.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      data-ocid="teamtalk.invitepicker.modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Invite Person</h3>
          <button
            type="button"
            data-ocid="teamtalk.invitepicker.close.button"
            onClick={onClose}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Search rolodex */}
          <div>
            <label
              htmlFor="invite-search"
              className="text-[10px] font-medium text-gray-500 uppercase tracking-wider"
            >
              Search Contacts
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                id="invite-search"
                data-ocid="teamtalk.invitepicker.search.input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-7 pr-3 py-2 text-sm border rounded"
              />
            </div>
            <div className="mt-1 max-h-40 overflow-y-auto space-y-1">
              {filtered.length === 0 && search && (
                <p className="text-xs text-gray-400 py-2 text-center">
                  No contacts found
                </p>
              )}
              {filtered.map((c, idx) => (
                <button
                  type="button"
                  key={c.id}
                  data-ocid={`teamtalk.invitepicker.contact.item.${idx + 1}`}
                  onClick={() => {
                    onInvite(c.email, c.name);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded hover:bg-gray-50 flex justify-between items-center border"
                >
                  <div>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    {c.role && <div className="text-gray-400">{c.role}</div>}
                  </div>
                  <span className="text-gray-500 text-[10px]">{c.email}</span>
                </button>
              ))}
            </div>
          </div>
          {/* External email */}
          <div>
            <label
              htmlFor="invite-ext-name"
              className="text-[10px] font-medium text-gray-500 uppercase tracking-wider"
            >
              Or Enter External Email
            </label>
            <div className="mt-1 space-y-2">
              <input
                id="invite-ext-name"
                data-ocid="teamtalk.invitepicker.external_name.input"
                value={externalName}
                onChange={(e) => setExternalName(e.target.value)}
                placeholder="Name"
                className="w-full px-3 py-2 text-sm border rounded"
              />
              <input
                data-ocid="teamtalk.invitepicker.external_email.input"
                value={externalEmail}
                onChange={(e) => setExternalEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                className="w-full px-3 py-2 text-sm border rounded"
              />
              <button
                type="button"
                data-ocid="teamtalk.invitepicker.external_invite.button"
                onClick={() => {
                  if (externalEmail.trim()) {
                    onInvite(
                      externalEmail.trim(),
                      externalName.trim() || externalEmail.trim(),
                    );
                    onClose();
                  }
                }}
                disabled={!externalEmail.trim()}
                className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PortalPreviewModal ────────────────────────────────────────────────────────
interface PortalPreviewProps {
  person: BookingPerson;
  project: Project | undefined;
  onClose: () => void;
}

export function PortalPreviewModal({
  person,
  project,
  onClose,
}: PortalPreviewProps) {
  const portalUrl = `https://portal.orca.app/booking/${person.id}`;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      data-ocid="teamtalk.portalpreview.modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Browser chrome */}
        <div className="bg-gray-200 rounded-t-xl px-4 py-2 flex items-center gap-3 border-b">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded px-3 py-0.5 text-xs text-gray-500 font-mono flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-green-500" /> {portalUrl}
          </div>
          <button
            type="button"
            data-ocid="teamtalk.portalpreview.close.button"
            onClick={onClose}
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {/* Portal content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Portal header */}
          <div className="bg-gray-900 text-white px-8 py-6">
            <div className="text-xs text-gray-400 mb-1">BOOKING PORTAL</div>
            <h1 className="text-2xl font-bold">{person.name}</h1>
            <div className="text-gray-300 mt-1">
              {person.role} {project ? `· ${project.name}` : ""}
            </div>
          </div>
          {/* Portal body */}
          <div className="px-8 py-6 space-y-6">
            <div className="bg-white rounded-lg border p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Booking Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Rate</div>
                  <div>{person.rate > 0 ? `£${person.rate}/day` : "TBC"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Total Fee</div>
                  <div>
                    {person.rate > 0 && person.dates?.length > 0
                      ? `£${(person.rate * person.dates.length).toLocaleString()}`
                      : "TBC"}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-400 mb-0.5">Dates</div>
                  <div>
                    {person.dates?.length > 0
                      ? person.dates.map(fmtDate).join(" · ")
                      : "TBC"}
                  </div>
                </div>
              </div>
            </div>
            {person.jobDesc && (
              <div className="bg-white rounded-lg border p-5">
                <h2 className="font-semibold text-gray-900 mb-2">
                  Job Description
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {person.jobDesc}
                </p>
              </div>
            )}
            <div className="bg-white rounded-lg border p-5">
              <h2 className="font-semibold text-gray-900 mb-3">
                Confirm Your Booking
              </h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-medium"
                >
                  Accept Booking
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm border text-gray-600 rounded-lg"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
