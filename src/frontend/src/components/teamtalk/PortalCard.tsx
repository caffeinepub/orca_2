import type { Project } from "@/types";
import {
  Calendar,
  CheckCircle,
  DollarSign,
  Edit2,
  Globe,
  Link,
  Mail,
} from "lucide-react";
import { type BookingPerson, STATUS_CONFIG } from "./types";

interface Props {
  person: BookingPerson;
  project: Project | undefined;
  onConfirm: () => void;
  onInvite: () => void;
  onPortalPreview: () => void;
  onEdit: () => void;
}

export default function PortalCard({
  person,
  project,
  onConfirm,
  onInvite,
  onPortalPreview,
  onEdit,
}: Props) {
  const cfg =
    STATUS_CONFIG[
      person.source === "unassigned" ? "unassigned" : person.status
    ];
  const totalFee = person.rate * (person.dates?.length || 0);
  const fmtCurrency = (v: number) =>
    `£${v.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div className="border-b bg-white">
      {/* Dark header bar */}
      <div className="bg-gray-900 text-white px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {project && (
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                {project.name}
              </div>
            )}
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold truncate">{person.name}</h2>
              <span className="text-gray-400 text-xs">·</span>
              <span className="text-xs text-gray-300">{person.role}</span>
            </div>
            <div className="mt-1.5">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.text}`}
              >
                {cfg.label}
              </span>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {person.status !== "confirmed" && (
              <button
                type="button"
                data-ocid="teamtalk.portal.confirm.button"
                onClick={onConfirm}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded"
              >
                <CheckCircle className="w-3 h-3" /> Confirm
              </button>
            )}
            <button
              type="button"
              data-ocid="teamtalk.portal.invite.button"
              onClick={onInvite}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded"
            >
              <Mail className="w-3 h-3" /> Invite
            </button>
            <button
              type="button"
              data-ocid="teamtalk.portal.preview.button"
              onClick={onPortalPreview}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              <Globe className="w-3 h-3" /> Portal
            </button>
            <button
              type="button"
              data-ocid="teamtalk.portal.edit.button"
              onClick={onEdit}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="px-5 py-4">
        {/* Job description */}
        {person.jobDesc && (
          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            {person.jobDesc}
          </p>
        )}

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
          <div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
              Rate
            </div>
            <div className="text-gray-900 font-medium flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-gray-400" />
              {person.rate > 0 ? (
                `£${person.rate}/day`
              ) : (
                <span className="text-gray-400">Not set</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
              Total Fee
            </div>
            <div className="text-gray-900 font-medium">
              {person.rate > 0 && person.dates?.length > 0 ? (
                fmtCurrency(totalFee)
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
              Email
            </div>
            <div className="text-gray-900 flex items-center gap-1">
              {person.email ? (
                <a
                  href={`mailto:${person.email}`}
                  className="text-blue-600 hover:underline truncate max-w-[160px]"
                >
                  {person.email}
                </a>
              ) : (
                <span className="text-gray-400">Not set</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
              Dates
            </div>
            <div className="text-gray-900 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
              {person.dates?.length > 0 ? (
                <span className="truncate">
                  {person.dates.map(fmtDate).join(", ")}
                </span>
              ) : (
                <span className="text-gray-400">No dates</span>
              )}
            </div>
          </div>
        </div>

        {/* Files & links */}
        {person.links?.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              Files & Links
            </div>
            <div className="flex flex-wrap gap-2">
              {person.links.map((link) => (
                <a
                  key={`${link.name}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-blue-600"
                >
                  <Link className="w-3 h-3" /> {link.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
