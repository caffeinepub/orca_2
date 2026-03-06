export type HolidayStatus = "pending" | "approved" | "declined";

export interface HolidayRequest {
  id: string;
  memberId: string;
  memberName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: HolidayStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  declineReason?: string;
}

const STORAGE_KEY = "orca_holidays";

export function loadHolidays(): HolidayRequest[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveHolidays(holidays: HolidayRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holidays));
}

export function isOnHoliday(memberId: string, date: string): boolean {
  const holidays = loadHolidays();
  return holidays.some(
    (h) =>
      h.status === "approved" &&
      h.memberId === memberId &&
      date >= h.startDate &&
      date <= h.endDate,
  );
}

export function getHolidaysOnDate(date: Date): HolidayRequest[] {
  const holidays = loadHolidays();
  const dk = date.toISOString().split("T")[0];
  return holidays.filter(
    (h) => h.status === "approved" && dk >= h.startDate && dk <= h.endDate,
  );
}

export function getApprovedHolidays(): HolidayRequest[] {
  return loadHolidays().filter((h) => h.status === "approved");
}

export function countBusinessDays(start: string, end: string): number {
  let count = 0;
  const current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}
