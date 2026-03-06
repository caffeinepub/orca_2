export type BookingStatus = "available" | "pending" | "confirmed" | "declined";
export type PersonSource = "resourced" | "temp" | "unassigned";
export type SendChannel = "email" | "message";

export interface BookingLink {
  name: string;
  url: string;
}

export interface BookingPerson {
  id: string;
  name: string;
  role: string;
  projectId: string;
  source: PersonSource;
  avatar: string;
  status: BookingStatus;
  email: string;
  rate: number;
  dates: string[];
  jobDesc: string;
  links: BookingLink[];
  unread: number;
  confirmedAt?: string;
}

export type MessageType =
  | "invite"
  | "response"
  | "accepted"
  | "declined"
  | "confirmed"
  | "update"
  | "general";

export interface BookingMessage {
  id: string;
  personId: string;
  type: MessageType;
  date: string;
  from: string;
  channel?: SendChannel;
  subject?: string;
  body: string;
  availableDates?: string[];
  attachments?: { name: string; size: string }[];
}

export interface BookingTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
}

export interface BookingAttachment {
  id: string;
  personId: string;
  name: string;
  size: string;
  fileId?: string;
}

export interface TemplateVariable {
  key: string;
  label: string;
  group: "Project" | "Person" | "Calculated" | "System";
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: "{{projectName}}", label: "Project Name", group: "Project" },
  { key: "{{client}}", label: "Client", group: "Project" },
  { key: "{{location}}", label: "Location", group: "Project" },
  { key: "{{callTime}}", label: "Call Time", group: "Project" },
  { key: "{{wrapTime}}", label: "Wrap Time", group: "Project" },
  { key: "{{parking}}", label: "Parking", group: "Project" },
  { key: "{{catering}}", label: "Catering", group: "Project" },
  { key: "{{contact}}", label: "On-set Contact", group: "Project" },
  { key: "{{budget}}", label: "Budget", group: "Project" },
  { key: "{{notes}}", label: "Notes", group: "Project" },
  { key: "{{firstName}}", label: "First Name", group: "Person" },
  { key: "{{fullName}}", label: "Full Name", group: "Person" },
  { key: "{{role}}", label: "Role", group: "Person" },
  { key: "{{rate}}", label: "Rate", group: "Person" },
  { key: "{{personDates}}", label: "Booked Dates", group: "Person" },
  { key: "{{totalFee}}", label: "Total Fee", group: "Calculated" },
  { key: "{{portalLink}}", label: "Portal Link", group: "System" },
];

export const STATUS_CONFIG: Record<
  BookingStatus | "unassigned",
  {
    bg: string;
    text: string;
    dot: string;
    label: string;
  }
> = {
  confirmed: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Confirmed",
  },
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Pending",
  },
  declined: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Declined",
  },
  available: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Available",
  },
  unassigned: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
    label: "Open Role",
  },
};

export const DEFAULT_TEMPLATES: BookingTemplate[] = [
  {
    id: "tpl-1",
    name: "Standard Booking",
    category: "Booking",
    subject: "{{role}} — {{projectName}}",
    body: "Hi {{firstName}},\n\nI'd like to book you as {{role}} on {{projectName}}.\n\nDates: {{personDates}}\nRate: {{rate}}/day\nTotal: {{totalFee}}\nCall time: {{callTime}}\nWrap: {{wrapTime}}\nLocation: {{location}}\nParking: {{parking}}\n\nPlease confirm via your portal: {{portalLink}}\n\nBest,",
  },
  {
    id: "tpl-2",
    name: "Quick Check Availability",
    category: "Enquiry",
    subject: "Availability check — {{projectName}}",
    body: "Hi {{firstName}},\n\nAre you available on {{personDates}} for a {{role}} role?\n\nProject: {{projectName}}\nRate: {{rate}}/day\n\nLet me know and I'll send full details.\n\nThanks,",
  },
  {
    id: "tpl-3",
    name: "Confirmed — Send Details",
    category: "Confirmation",
    subject: "Confirmed: {{role}} — {{projectName}}",
    body: "Hi {{firstName}},\n\nYou're confirmed as {{role}} on {{projectName}}.\n\nDates: {{personDates}}\nCall: {{callTime}} | Wrap: {{wrapTime}}\nLocation: {{location}}\nParking: {{parking}}\nCatering: {{catering}}\nOn-set contact: {{contact}}\n\nSee your portal for files & terms: {{portalLink}}\n\nSee you there!",
  },
  {
    id: "tpl-4",
    name: "Date Change Request",
    category: "Update",
    subject: "Date change — {{projectName}}",
    body: "Hi {{firstName}},\n\nThere's been a schedule change on {{projectName}}.\n\nYour updated dates: {{personDates}}\nAll other details remain the same.\n\nPlease confirm the new dates via your portal: {{portalLink}}\n\nApologies for the change.",
  },
];
