/**
 * Budget domain types for ORCA project info
 * All fields optional for backward compatibility
 */

export type CustomFieldType = "text" | "number" | "date" | "boolean" | "select";

export interface CustomField {
  id: string;
  name: string;
  value: string;
  type?: CustomFieldType;
  options?: string[];
  required?: boolean;
}

export type BudgetLineType = "labour" | "labor" | "other";
export type BudgetProvider = "ASC" | "Client";

export interface BudgetLineItem {
  id: string;
  stageId: string;
  type: BudgetLineType;
  description: string;
  days?: number;
  rate?: number;
  cost?: number;
  howMany?: number;
  markup?: number;
  contingency?: number;
  ascCost?: number;
  clientCost?: number;
  provider?: BudgetProvider;
  notes?: string;
}

export interface BudgetStage {
  id: string;
  name: string;
  lines: BudgetLineItem[];
  collapsed?: boolean;
  color?: string;
}

export interface BudgetSettings {
  defaultRate?: number;
  defaultMarkup?: number;
  defaultContingency?: number;
  currency?: "GBP" | "USD" | "EUR";
}

export interface Invoice {
  id: string;
  date: string;
  description: string;
  percent: number;
  paymentTerms: number;
  status: "Not Sent" | "Sent" | "Paid";
}

export interface ProjectBudget {
  stages: BudgetStage[];
  invoiceSchedule?: any;
  settings?: BudgetSettings;
  receipts?: Receipt[];
  invoiceMode?: "stage" | "project";
  projectInvoices?: Invoice[];
  stageInvoices?: Record<string, Invoice[]>;
}

export type InvoiceStatus = "pending" | "sent" | "paid" | "overdue";

export interface InvoiceItem {
  id: string;
  stageId?: string;
  description: string;
  amount: number;
  dueDate?: string;
  status: InvoiceStatus;
  invoiceNumber?: string;
  notes?: string;
}

export interface ReceiptLineItem {
  id: string;
  description: string;
  amount: number;
}

export interface Receipt {
  id: string;
  date: string;
  vendor: string;
  description: string;
  lineItems?: ReceiptLineItem[];
}

export interface ClientBudgetSettings {
  defaultProvider?: BudgetProvider;
  showLaborSummary?: boolean;
  groupByProvider?: boolean;
  rowOverrides?: Record<string, any>;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  createdAt: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  stages: {
    name: string;
    color?: string;
    order: number;
    startDate?: string;
    endDate?: string;
  }[];
  customFields: CustomField[];
  includeStages?: boolean;
  includeStageDates?: boolean;
  includeTasks?: boolean;
  includeBudget?: boolean;
  includeCustomFields?: boolean;
}
