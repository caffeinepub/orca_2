import type { BudgetLineItem, ProjectBudget } from "@/types/project";

export function calculateLineValues(line: BudgetLineItem) {
  const isLabour = line.type === "labour" || line.type === "labor";
  const unit = isLabour
    ? (line.days || 0) * (line.rate || 0)
    : (line.howMany || 0) * (line.rate || 0);
  const costASC = unit;
  const markupAmount = costASC * ((line.markup || 0) / 100);
  const contAmount = (costASC + markupAmount) * ((line.contingency || 0) / 100);
  const client = costASC + markupAmount + contAmount;

  return { unit, costASC, markupAmount, contAmount, client };
}

export function calculateStageTotals(stageId: string, budget: ProjectBudget) {
  const lines = getStageLines(stageId, budget);
  const labourLines = lines.filter(
    (l) => l.type === "labour" || l.type === "labor",
  );
  const otherLines = lines.filter((l) => l.type === "other");

  const totalDays = labourLines.reduce((sum, l) => sum + (l.days || 0), 0);
  const labourCost = labourLines.reduce((sum, l) => {
    const { costASC } = calculateLineValues(l);
    return sum + costASC;
  }, 0);
  const otherCost = otherLines.reduce((sum, l) => {
    const { costASC } = calculateLineValues(l);
    return sum + costASC;
  }, 0);
  const stageTotal = lines.reduce((sum, l) => {
    const { client } = calculateLineValues(l);
    return sum + client;
  }, 0);

  return { totalDays, labourCost, otherCost, stageTotal };
}

export function calculateProjectTotals(budget: ProjectBudget) {
  const allLines = (budget.stages || []).flatMap((s) => s.lines || []);
  const labourLines = allLines.filter(
    (l) => l.type === "labour" || l.type === "labor",
  );
  const otherLines = allLines.filter((l) => l.type === "other");

  const totalDays = labourLines.reduce((sum, l) => sum + (l.days || 0), 0);
  const labourCost = labourLines.reduce((sum, l) => {
    const { costASC } = calculateLineValues(l);
    return sum + costASC;
  }, 0);
  const otherCost = otherLines.reduce((sum, l) => {
    const { costASC } = calculateLineValues(l);
    return sum + costASC;
  }, 0);
  const totalASC = labourCost + otherCost;

  const totalMarkup = allLines.reduce((sum, l) => {
    const { markupAmount } = calculateLineValues(l);
    return sum + markupAmount;
  }, 0);
  const totalContingency = allLines.reduce((sum, l) => {
    const { contAmount } = calculateLineValues(l);
    return sum + contAmount;
  }, 0);
  const clientTotal = allLines.reduce((sum, l) => {
    const { client } = calculateLineValues(l);
    return sum + client;
  }, 0);

  return {
    totalDays,
    labourCost,
    otherCost,
    totalASC,
    totalMarkup,
    totalContingency,
    clientTotal,
  };
}

export function formatCurrency(value: number): string {
  return `£${value.toFixed(2)}`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "Not Sent":
      return "text-gray-600";
    case "Sent":
      return "text-orange-600";
    case "Paid":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
}

export function calculateExpectedPayment(
  invoiceDate: string,
  paymentTerms: number,
): string {
  if (!invoiceDate) return "";
  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + paymentTerms);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

export function getStageLines(
  stageId: string,
  budget: ProjectBudget,
): BudgetLineItem[] {
  const stage = budget.stages?.find((s) => s.id === stageId);
  return stage?.lines || [];
}
