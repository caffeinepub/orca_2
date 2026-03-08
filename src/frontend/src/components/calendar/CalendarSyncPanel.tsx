import type { Project, Stage, Task } from "@/types";
import {
  type CalendarSubscription,
  type ExternalEvent,
  downloadIcs,
  generateICalExport,
  loadExternalEvents,
  loadSubscriptions,
  parseICalText,
  saveExternalEvents,
  saveSubscriptions,
} from "@/utils/icalUtils";
import { generateId } from "@/utils/storage";
import { Download, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
}

export default function CalendarSyncPanel({
  isOpen,
  onClose,
  projects,
  stages,
  tasks,
}: Props) {
  const [subs, setSubs] = useState<CalendarSubscription[]>([]);
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [fetching, setFetching] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload from storage each time the panel opens
  useEffect(() => {
    if (isOpen) {
      setSubs(loadSubscriptions());
      setEvents(loadExternalEvents());
    }
  }, [isOpen]);

  const addSub = () => {
    if (!newUrl.trim()) return;
    let name = newName.trim();
    if (!name) {
      try {
        name = new URL(newUrl).hostname;
      } catch {
        name = newUrl;
      }
    }
    const sub: CalendarSubscription = {
      id: generateId(),
      name,
      url: newUrl.trim(),
      lastFetched: null,
    };
    const updated = [...subs, sub];
    setSubs(updated);
    saveSubscriptions(updated);
    setNewUrl("");
    setNewName("");
  };

  const removeSub = (id: string) => {
    const updated = subs.filter((s) => s.id !== id);
    setSubs(updated);
    saveSubscriptions(updated);
    const filtered = events.filter((e) => e.source !== id);
    setEvents(filtered);
    saveExternalEvents(filtered);
  };

  const fetchAll = async () => {
    setFetching(true);
    const allEvents: ExternalEvent[] = [];
    const updatedSubs = [...subs];
    for (const sub of updatedSubs) {
      try {
        const res = await fetch(sub.url);
        const text = await res.text();
        const parsed = parseICalText(text, sub.id);
        allEvents.push(...parsed);
        sub.lastFetched = new Date().toISOString();
      } catch {
        allEvents.push(...events.filter((e) => e.source === sub.id));
      }
    }
    setSubs(updatedSubs);
    saveSubscriptions(updatedSubs);
    setEvents(allEvents);
    saveExternalEvents(allEvents);
    setFetching(false);
  };

  const handleExport = () => {
    const ical = generateICalExport(projects, stages, tasks);
    downloadIcs(ical, "orca-calendar.ics");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close panel"
      />
      <div className="relative w-96 bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Calendar Sync</h3>
          <button
            type="button"
            data-ocid="calendar.sync.close_button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Export */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Export ORCA Calendar
            </h4>
            <button
              type="button"
              data-ocid="calendar.sync.export.button"
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 w-full justify-center"
            >
              <Download className="w-4 h-4" /> Download .ics file
            </button>
            <p className="text-[10px] text-gray-400 mt-1">
              Import this file into Google Calendar, Outlook, or Apple Calendar.
            </p>
          </div>

          {/* Subscribe */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Subscribe to External Calendar
            </h4>
            <div className="space-y-2">
              <input
                type="text"
                data-ocid="calendar.sync.name.input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Calendar name..."
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
              <input
                type="text"
                data-ocid="calendar.sync.url.input"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="iCal URL (https://...)"
                className="w-full border rounded px-2 py-1.5 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addSub();
                }}
              />
              <button
                type="button"
                data-ocid="calendar.sync.add.button"
                onClick={addSub}
                disabled={!newUrl.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-40"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Some URLs may not load due to browser CORS restrictions. You can
              download the .ics file manually and import it instead.
            </p>
          </div>

          {/* Subscriptions list */}
          {subs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase">
                  Subscriptions
                </h4>
                <button
                  type="button"
                  data-ocid="calendar.sync.refresh.button"
                  onClick={fetchAll}
                  disabled={fetching}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${fetching ? "animate-spin" : ""}`}
                  />
                  {fetching ? "Fetching..." : "Refresh all"}
                </button>
              </div>
              <div className="space-y-2">
                {subs.map((sub, idx) => {
                  const count = events.filter(
                    (e) => e.source === sub.id,
                  ).length;
                  return (
                    <div
                      key={sub.id}
                      data-ocid={`calendar.sync.sub.item.${idx + 1}`}
                      className="flex items-center justify-between p-2 border rounded text-xs"
                    >
                      <div>
                        <div className="font-medium">{sub.name}</div>
                        <div className="text-gray-400 truncate max-w-[200px]">
                          {sub.url}
                        </div>
                        <div className="text-gray-400">
                          {count} events
                          {sub.lastFetched
                            ? ` — last fetched ${new Date(sub.lastFetched).toLocaleDateString()}`
                            : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        data-ocid={`calendar.sync.sub.delete_button.${idx + 1}`}
                        onClick={() => removeSub(sub.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
