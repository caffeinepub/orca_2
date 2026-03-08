import type { AppRole, TeamMember } from "@/types";
import {
  type HolidayRequest,
  type HolidayStatus,
  countBusinessDays,
  loadHolidays,
  saveHolidays,
} from "@/utils/holidays";
import { hasPermission } from "@/utils/permissions";
import { triggerCloudSync } from "@/utils/storage";
import { Calendar, Check, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface Props {
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: AppRole;
}

const STATUS_STYLES: Record<HolidayStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dt.getMonth()]} ${dt.getFullYear()}`;
};

export default function HolidaysTab({
  members,
  currentUserId,
  currentUserRole,
}: Props) {
  const [holidays, setHolidays] = useState<HolidayRequest[]>(loadHolidays);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ startDate: "", endDate: "", reason: "" });
  const [statusFilter, setStatusFilter] = useState<"all" | HolidayStatus>(
    "all",
  );
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const isAdmin =
    currentUserRole === "Super Admin" ||
    hasPermission(currentUserRole, "view_all_holidays");
  useEffect(() => {
    saveHolidays(holidays);
    triggerCloudSync();
  }, [holidays]);

  const currentMember = members.find((m) => m.id === currentUserId) || {
    name: "You",
    id: currentUserId,
  };

  const filtered = useMemo(() => {
    let list = holidays;
    if (!isAdmin) list = list.filter((h) => h.memberId === currentUserId);
    if (statusFilter !== "all")
      list = list.filter((h) => h.status === statusFilter);
    return list.sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
  }, [holidays, statusFilter, isAdmin, currentUserId]);

  const pendingCount = holidays.filter((h) => h.status === "pending").length;

  const handleSubmit = () => {
    if (!form.startDate || !form.endDate || form.endDate < form.startDate)
      return;
    setHolidays([
      ...holidays,
      {
        id: `hol-${Date.now()}`,
        memberId: currentUserId,
        memberName: currentMember.name,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        status: "pending",
        requestedAt: new Date().toISOString(),
      },
    ]);
    setForm({ startDate: "", endDate: "", reason: "" });
    setShowForm(false);
  };

  const handleApprove = (id: string) => {
    setHolidays(
      holidays.map((h) =>
        h.id === id
          ? {
              ...h,
              status: "approved" as HolidayStatus,
              reviewedAt: new Date().toISOString(),
              reviewedBy: "Super Admin",
            }
          : h,
      ),
    );
  };

  const handleDecline = (id: string) => {
    setHolidays(
      holidays.map((h) =>
        h.id === id
          ? {
              ...h,
              status: "declined" as HolidayStatus,
              reviewedAt: new Date().toISOString(),
              reviewedBy: "Super Admin",
              declineReason,
            }
          : h,
      ),
    );
    setDeclineId(null);
    setDeclineReason("");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this holiday request?"))
      setHolidays(holidays.filter((h) => h.id !== id));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(["all", "pending", "approved", "declined"] as const).map((s) => (
              <button
                type="button"
                key={s}
                data-ocid="holidays.filter.tab"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs rounded-full capitalize ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {s}
                {s === "pending" && pendingCount > 0
                  ? ` (${pendingCount})`
                  : ""}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered.length} requests
          </span>
        </div>
        <button
          type="button"
          data-ocid="holidays.request.button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Request Holiday
        </button>
      </div>
      {showForm && (
        <div className="px-6 py-3 bg-primary/5 border-b flex items-center gap-3 flex-shrink-0">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            data-ocid="holidays.start.input"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="px-3 py-1.5 text-sm border rounded"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <input
            data-ocid="holidays.end.input"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="px-3 py-1.5 text-sm border rounded"
          />
          <input
            data-ocid="holidays.reason.input"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Reason (optional)"
            className="px-3 py-1.5 text-sm border rounded flex-1"
          />
          {form.startDate && form.endDate && form.endDate >= form.startDate && (
            <span className="text-xs text-muted-foreground">
              {countBusinessDays(form.startDate, form.endDate)} working days
            </span>
          )}
          <button
            type="button"
            data-ocid="holidays.submit_button"
            onClick={handleSubmit}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90"
          >
            Submit
          </button>
          <button
            type="button"
            data-ocid="holidays.cancel_button"
            onClick={() => setShowForm(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm" data-ocid="holidays.table">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              {isAdmin && (
                <th className="text-left px-6 py-2.5 font-semibold text-foreground">
                  Member
                </th>
              )}
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                From
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                To
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Days
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Reason
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Status
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">
                Requested
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-foreground w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h, idx) => (
              <tr
                key={h.id}
                className="border-b hover:bg-muted/30"
                data-ocid={`holidays.row.${idx + 1}`}
              >
                {isAdmin && (
                  <td className="px-6 py-3 font-medium text-foreground">
                    {h.memberName}
                  </td>
                )}
                <td className="px-4 py-3 text-foreground">
                  {fmtDate(h.startDate)}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {fmtDate(h.endDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {countBusinessDays(h.startDate, h.endDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {h.reason || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[h.status]}`}
                  >
                    {h.status}
                  </span>
                  {h.declineReason && (
                    <div className="text-[10px] text-red-500 mt-0.5">
                      {h.declineReason}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-[11px] text-muted-foreground">
                  {fmtDate(h.requestedAt.split("T")[0])}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isAdmin && h.status === "pending" && (
                      <>
                        <button
                          type="button"
                          data-ocid={`holidays.approve_button.${idx + 1}`}
                          onClick={() => handleApprove(h.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Approve"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        {declineId === h.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              data-ocid="holidays.decline_reason.input"
                              value={declineReason}
                              onChange={(e) => setDeclineReason(e.target.value)}
                              placeholder="Reason..."
                              className="px-2 py-0.5 text-xs border rounded w-28"
                            />
                            <button
                              type="button"
                              data-ocid="holidays.decline_confirm.button"
                              onClick={() => handleDecline(h.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              data-ocid="holidays.decline_cancel.button"
                              onClick={() => setDeclineId(null)}
                              className="p-1 text-muted-foreground text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            data-ocid={`holidays.decline_button.${idx + 1}`}
                            onClick={() => setDeclineId(h.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            title="Decline"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                    {h.memberId === currentUserId && h.status === "pending" && (
                      <button
                        type="button"
                        data-ocid={`holidays.delete_button.${idx + 1}`}
                        onClick={() => handleDelete(h.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div
            data-ocid="holidays.empty_state"
            className="text-center py-12 text-muted-foreground"
          >
            {holidays.length === 0
              ? "No holiday requests yet."
              : "No matching requests."}
          </div>
        )}
      </div>
    </div>
  );
}
