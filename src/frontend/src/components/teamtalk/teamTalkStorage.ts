import {
  type BookingAttachment,
  type BookingMessage,
  type BookingPerson,
  type BookingTemplate,
  DEFAULT_TEMPLATES,
} from "./types";

const getKey = (key: string): string => {
  const prefix = "orca_";
  const principalKey = Object.keys(localStorage).find(
    (k) => k.startsWith(prefix) && k.endsWith("_projects"),
  );
  const principal = principalKey
    ? principalKey.replace(prefix, "").replace("_projects", "")
    : "anonymous";
  return `${prefix}${principal}_tt_${key}`;
};

export const loadBookings = (): BookingPerson[] => {
  try {
    return JSON.parse(localStorage.getItem(getKey("bookings")) || "[]");
  } catch {
    return [];
  }
};
export const saveBookings = (b: BookingPerson[]) =>
  localStorage.setItem(getKey("bookings"), JSON.stringify(b));

export const loadMessages = (): BookingMessage[] => {
  try {
    return JSON.parse(localStorage.getItem(getKey("messages")) || "[]");
  } catch {
    return [];
  }
};
export const saveMessages = (m: BookingMessage[]) =>
  localStorage.setItem(getKey("messages"), JSON.stringify(m));

export const loadTemplates = (): BookingTemplate[] => {
  try {
    const stored = localStorage.getItem(getKey("templates"));
    if (!stored) return DEFAULT_TEMPLATES;
    const parsed = JSON.parse(stored);
    return parsed.length > 0 ? parsed : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
};
export const saveTemplates = (t: BookingTemplate[]) =>
  localStorage.setItem(getKey("templates"), JSON.stringify(t));

export const loadAttachments = (): BookingAttachment[] => {
  try {
    return JSON.parse(localStorage.getItem(getKey("attachments")) || "[]");
  } catch {
    return [];
  }
};
export const saveAttachments = (a: BookingAttachment[]) =>
  localStorage.setItem(getKey("attachments"), JSON.stringify(a));

export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const formatDate = (d: string): string =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const formatDateTime = (d: string): string =>
  new Date(d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
