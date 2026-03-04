import type { Project } from "@/types";
import type { ProjectBudget } from "@/types/project";

export function exportToExcel(
  project: Project,
  budget: ProjectBudget,
  proposalNotes: string,
) {
  let csvContent = "";

  csvContent += "PROJECT OVERVIEW\n";
  csvContent += `Project Name,${escapeCSV(project.name)}\n`;
  csvContent += `Project ID,${escapeCSV(project.id)}\n`;
  csvContent += `Project Color,${escapeCSV(project.color)}\n`;
  csvContent += "\n";
  csvContent += "Proposal Notes\n";
  csvContent += `${escapeCSV(proposalNotes)}\n`;
  csvContent += "\n\n";

  csvContent += "BUDGET DETAILS\n";
  csvContent +=
    "Stage,Type,Description,Days,Rate,Cost,Markup %,Contingency %,Provider,Total\n";

  let totalCost = 0;

  for (const stage of budget.stages || []) {
    csvContent += `${escapeCSV(stage.name)},,,,,,,,,\n`;

    for (const line of stage.lines || []) {
      const isLabor = line.type === "labor" || line.type === "labour";
      const baseCost = line.cost || (line.days || 0) * (line.rate || 0);
      const markup = baseCost * ((line.markup || 0) / 100);
      const contingency = (baseCost + markup) * ((line.contingency || 0) / 100);
      const total = baseCost + markup + contingency;
      totalCost += total;

      csvContent += `,${escapeCSV(line.type)},${escapeCSV(line.description)},`;
      csvContent += `${isLabor ? line.days || 0 : ""},`;
      csvContent += `${isLabor ? line.rate || 0 : ""},`;
      csvContent += `${baseCost.toFixed(2)},`;
      csvContent += `${line.markup || 0},`;
      csvContent += `${line.contingency || 0},`;
      csvContent += `${escapeCSV(line.provider || "ASC")},`;
      csvContent += `${total.toFixed(2)}\n`;
    }

    csvContent += "\n";
  }

  csvContent += `,,,,,,,,TOTAL,${totalCost.toFixed(2)}\n`;
  csvContent += "\n\n";

  csvContent += "RECEIPTS\n";
  csvContent += "Date,Vendor,Description,Item Description,Amount\n";

  for (const receipt of budget.receipts || []) {
    if ((receipt.lineItems || []).length === 0) {
      csvContent += `${escapeCSV(receipt.date)},${escapeCSV(receipt.vendor)},${escapeCSV(receipt.description)},,0.00\n`;
    } else {
      let index = 0;
      for (const item of receipt.lineItems || []) {
        csvContent += `${index === 0 ? escapeCSV(receipt.date) : ""},`;
        csvContent += `${index === 0 ? escapeCSV(receipt.vendor) : ""},`;
        csvContent += `${index === 0 ? escapeCSV(receipt.description) : ""},`;
        csvContent += `${escapeCSV(item.description)},`;
        csvContent += `${(item.amount || 0).toFixed(2)}\n`;
        index++;
      }
    }
  }

  const fileName = `${project.name.replace(/[^a-z0-9]/gi, "_")}_Budget_${new Date().toISOString().split("T")[0]}.csv`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
