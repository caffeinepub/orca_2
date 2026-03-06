import { triggerCloudSync } from "@/utils/storage";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface TimesheetEntry {
  id: string;
  date: string;
  project: string;
  task: string;
  hours: number;
  notes: string;
}

const FMT = (d: Date) => d.toISOString().split("T")[0];
const WD = (d: string) =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(d).getDay()];
const FD = (d: string) => {
  const dt = new Date(d);
  return `${dt.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dt.getMonth()]}`;
};

export default function TimesheetsTab({
  currentUserId,
}: { currentUserId: string }) {
  const [entries, setEntries] = useState<TimesheetEntry[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`orca_ts_${currentUserId}`) || "[]",
      );
    } catch {
      return [];
    }
  });
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + 1);
    return FMT(d);
  });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    date: FMT(new Date()),
    project: "",
    task: "",
    hours: 0,
    notes: "",
  });

  useEffect(() => {
    localStorage.setItem(`orca_ts_${currentUserId}`, JSON.stringify(entries));
    triggerCloudSync();
  }, [entries, currentUserId]);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return FMT(d);
  });
  const weekEntries = entries.filter((e) => weekDates.includes(e.date));
  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(FMT(d));
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(FMT(d));
  };
  const thisWeek = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + 1);
    setWeekStart(FMT(d));
  };
  const handleAdd = () => {
    if (!form.project.trim() || form.hours <= 0) return;
    setEntries([...entries, { ...form, id: `ts-${Date.now()}` }]);
    setForm({ date: form.date, project: "", task: "", hours: 0, notes: "" });
    setShowAdd(false);
  };
  const handleDelete = (id: string) =>
    setEntries(entries.filter((e) => e.id !== id));
  const dayTotal = (date: string) =>
    weekEntries.filter((e) => e.date === date).reduce((s, e) => s + e.hours, 0);
  const weekTotal = weekEntries.reduce((s, e) => s + e.hours, 0);
  const today = FMT(new Date());

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-ocid="timesheets.prev.button"
            onClick={prevWeek}
            className="p-1.5 hover:bg-muted rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold min-w-[180px] text-center">
            {FD(weekDates[0])} — {FD(weekDates[6])}
          </span>
          <button
            type="button"
            data-ocid="timesheets.next.button"
            onClick={nextWeek}
            className="p-1.5 hover:bg-muted rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-ocid="timesheets.thisweek.button"
            onClick={thisWeek}
            className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
          >
            This Week
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-primary">
            {weekTotal.toFixed(1)}h total
          </span>
          <button
            type="button"
            data-ocid="timesheets.log.button"
            onClick={() => {
              setShowAdd(true);
              setForm({ ...form, date: today });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Log Time
          </button>
        </div>
      </div>
      {showAdd && (
        <div className="px-6 py-3 bg-primary/5 border-b flex items-center gap-2 flex-shrink-0">
          <input
            data-ocid="timesheets.date.input"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="px-3 py-1.5 text-sm border rounded"
          />
          <input
            data-ocid="timesheets.project.input"
            value={form.project}
            onChange={(e) => setForm({ ...form, project: e.target.value })}
            placeholder="Project"
            className="px-3 py-1.5 text-sm border rounded w-40"
          />
          <input
            data-ocid="timesheets.task.input"
            value={form.task}
            onChange={(e) => setForm({ ...form, task: e.target.value })}
            placeholder="Task"
            className="px-3 py-1.5 text-sm border rounded w-40"
          />
          <input
            data-ocid="timesheets.hours.input"
            type="number"
            step="0.25"
            min="0"
            value={form.hours || ""}
            onChange={(e) =>
              setForm({
                ...form,
                hours: Number.parseFloat(e.target.value) || 0,
              })
            }
            placeholder="Hours"
            className="px-3 py-1.5 text-sm border rounded w-20"
          />
          <input
            data-ocid="timesheets.notes.input"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes"
            className="px-3 py-1.5 text-sm border rounded flex-1"
          />
          <button
            type="button"
            data-ocid="timesheets.add_button"
            onClick={handleAdd}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded"
          >
            Add
          </button>
          <button
            type="button"
            data-ocid="timesheets.cancel_button"
            onClick={() => setShowAdd(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="grid grid-cols-7 gap-3">
          {weekDates.map((date) => {
            const de = weekEntries.filter((e) => e.date === date);
            const dt = dayTotal(date);
            const isT = date === today;
            return (
              <div
                key={date}
                className={`border rounded-lg overflow-hidden ${isT ? "ring-2 ring-blue-400" : ""}`}
              >
                <div
                  className={`px-3 py-2 flex items-center justify-between ${isT ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}
                >
                  <div>
                    <div className="text-xs font-medium">{WD(date)}</div>
                    <div className="text-sm font-bold">{FD(date)}</div>
                  </div>
                  <span
                    className={`text-sm font-bold ${isT ? "text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {dt > 0 ? `${dt.toFixed(1)}h` : "—"}
                  </span>
                </div>
                <div className="p-2 min-h-[80px]">
                  {de.map((e, ei) => (
                    <div
                      key={e.id}
                      className="mb-1.5 p-1.5 bg-muted/30 rounded text-xs group relative"
                      data-ocid={`timesheets.entry.${ei + 1}`}
                    >
                      <div className="font-medium text-foreground">
                        {e.project}
                      </div>
                      {e.task && (
                        <div className="text-muted-foreground">{e.task}</div>
                      )}
                      <div className="text-primary font-semibold">
                        {e.hours}h
                      </div>
                      <button
                        type="button"
                        data-ocid={`timesheets.delete_button.${ei + 1}`}
                        onClick={() => handleDelete(e.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
