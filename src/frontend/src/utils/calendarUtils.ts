export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const isWeekend = (date: Date) =>
  date.getDay() === 0 || date.getDay() === 6;

export const isDateInRange = (date: Date, start?: string, end?: string) => {
  if (!start || !end) return false;
  const d = date.getTime();
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  return d >= s.getTime() && d <= e.getTime();
};

export const isStartDate = (date: Date, dateStr?: string) => {
  if (!dateStr) return false;
  const s = new Date(dateStr);
  s.setHours(0, 0, 0, 0);
  return isSameDay(date, s);
};

export const isEndDate = (date: Date, dateStr?: string) => {
  if (!dateStr) return false;
  const e = new Date(dateStr);
  e.setHours(0, 0, 0, 0);
  return isSameDay(date, e);
};

export const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // Monday start
  const days: { date: Date; inMonth: boolean }[] = [];
  for (let i = startPad - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), inMonth: false });
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), inMonth: true });
  }
  while (days.length < 42) {
    const d = new Date(
      year,
      month + 1,
      days.length - startPad - lastDay.getDate() + 1,
    );
    days.push({ date: d, inMonth: false });
  }
  return days;
};

export const getWeekDays = (currentDate: Date) => {
  const d = new Date(currentDate);
  const dayOfWeek = (d.getDay() + 6) % 7; // Monday start
  d.setDate(d.getDate() - dayOfWeek);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
};

export const getGanttDateRange = (today: Date) => {
  const start = new Date(today);
  start.setMonth(start.getMonth() - 3);
  start.setDate(1);
  const end = new Date(today);
  end.setMonth(end.getMonth() + 9);
  end.setDate(new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate());
  const dates: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

export const getMonthMarkers = (dates: Date[], dayWidth: number) => {
  const MNAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const months: { label: string; days: number; left: number; width: number }[] =
    [];
  let prevMonth = -1;
  let currentLeft = 0;
  for (const d of dates) {
    if (d.getMonth() !== prevMonth) {
      months.push({
        label: `${MNAMES[d.getMonth()]} ${d.getFullYear()}`,
        days: 0,
        left: currentLeft,
        width: 0,
      });
      prevMonth = d.getMonth();
    }
    months[months.length - 1].days++;
    months[months.length - 1].width = months[months.length - 1].days * dayWidth;
    currentLeft += dayWidth;
  }
  return months;
};

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
