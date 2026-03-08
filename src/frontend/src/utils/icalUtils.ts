import type { Project, Stage, Task } from "@/types";

export interface ExternalEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  source: string;
}

export interface CalendarSubscription {
  id: string;
  name: string;
  url: string;
  lastFetched: string | null;
}

const SUBS_KEY = "orca_calendar_subs";
const EVENTS_KEY = "orca_external_events";

export const loadSubscriptions = (): CalendarSubscription[] => {
  try {
    return JSON.parse(localStorage.getItem(SUBS_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveSubscriptions = (subs: CalendarSubscription[]) => {
  localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
};

export const loadExternalEvents = (): ExternalEvent[] => {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveExternalEvents = (events: ExternalEvent[]) => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
};

export function parseICalText(text: string, source: string): ExternalEvent[] {
  const events: ExternalEvent[] = [];
  const blocks = text.split("BEGIN:VEVENT");
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split("END:VEVENT")[0];
    const get = (key: string): string => {
      const match = block.match(new RegExp(`${key}[^:]*:(.+)`));
      return match ? match[1].trim() : "";
    };
    const summary = get("SUMMARY");
    const dtstart = get("DTSTART");
    const dtend = get("DTEND");
    const desc = get("DESCRIPTION");
    if (!summary || !dtstart) continue;
    const parseDate = (s: string): string => {
      const clean = s.replace(/[TZ]/g, "").substring(0, 8);
      if (clean.length >= 8)
        return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`;
      return s;
    };
    events.push({
      id: `ext-${source}-${i}`,
      title: summary,
      startDate: parseDate(dtstart),
      endDate: dtend ? parseDate(dtend) : parseDate(dtstart),
      description: desc,
      source,
    });
  }
  return events;
}

export function generateICalExport(
  projects: Project[],
  stages: Stage[],
  tasks: Task[],
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ORCA//PM//EN",
    "CALSCALE:GREGORIAN",
  ];
  const fmt = (d: string) => d.replace(/-/g, "");
  for (const stage of stages) {
    if (!stage.startDate || !stage.endDate) continue;
    const proj = projects.find((p) => p.id === stage.projectId);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:stage-${stage.id}@orca`);
    lines.push(`DTSTART;VALUE=DATE:${fmt(stage.startDate.substring(0, 10))}`);
    lines.push(`DTEND;VALUE=DATE:${fmt(stage.endDate.substring(0, 10))}`);
    lines.push(`SUMMARY:${proj ? `${proj.name} - ` : ""}${stage.name}`);
    lines.push("END:VEVENT");
  }
  for (const task of tasks) {
    if (!task.dueDate) continue;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:task-${task.id}@orca`);
    lines.push(`DTSTART;VALUE=DATE:${fmt(task.dueDate.substring(0, 10))}`);
    lines.push(`DTEND;VALUE=DATE:${fmt(task.dueDate.substring(0, 10))}`);
    lines.push(`SUMMARY:${task.milestone ? "⭐ " : ""}${task.title}`);
    if (task.description) lines.push(`DESCRIPTION:${task.description}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
