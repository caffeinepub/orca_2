import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/types";
import type {
  BudgetProvider,
  ClientBudgetSettings,
  ProjectBudget,
} from "@/types/project";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { calculateLineValues, formatCurrency } from "./budgetCalculations";

interface ClientBudgetTabProps {
  project: Project;
  budget: ProjectBudget;
  clientBudgetSettings?: ClientBudgetSettings;
  onUpdateSettings: (settings: ClientBudgetSettings) => void;
}

export default function ClientBudgetTab({
  project: _project,
  budget,
  clientBudgetSettings,
  onUpdateSettings,
}: ClientBudgetTabProps) {
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(
    new Set(),
  );

  const settings = clientBudgetSettings || {};
  const rowOverrides = settings.rowOverrides || {};

  const toggleStageCollapse = (stageId: string) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const getProvider = (
    lineId: string,
    defaultProvider: BudgetProvider = "ASC",
  ): BudgetProvider => {
    return (
      (rowOverrides[lineId]?.provider as BudgetProvider) ?? defaultProvider
    );
  };

  const setProvider = (lineId: string, provider: BudgetProvider) => {
    onUpdateSettings({
      ...settings,
      rowOverrides: {
        ...rowOverrides,
        [lineId]: { ...(rowOverrides[lineId] || {}), provider },
      },
    });
  };

  // Project-level totals — depend on budget and rowOverrides (via settings)
  const projectTotals = useMemo(() => {
    let totalClient = 0;
    let clientProvidesCount = 0;

    for (const budgetStage of budget.stages || []) {
      const labourLines = (budgetStage.lines || []).filter(
        (l) => l.type === "labour" || l.type === "labor",
      );
      const otherLines = (budgetStage.lines || []).filter(
        (l) => l.type === "other",
      );

      // Labour summary row per stage
      const labourTotal = labourLines.reduce(
        (sum, l) => sum + calculateLineValues(l).client,
        0,
      );
      const labourOverride = rowOverrides[`labour_${budgetStage.id}`]
        ?.provider as BudgetProvider | undefined;
      const labourProvider: BudgetProvider = labourOverride ?? "ASC";
      if (labourProvider === "ASC" && labourTotal > 0)
        totalClient += labourTotal;

      // Other items
      for (const line of otherLines) {
        const lineOverride = rowOverrides[line.id]?.provider as
          | BudgetProvider
          | undefined;
        const provider: BudgetProvider = lineOverride ?? "ASC";
        if (provider === "Client") {
          clientProvidesCount++;
        } else {
          totalClient += calculateLineValues(line).client;
        }
      }
    }

    return { totalClient, clientProvidesCount };
  }, [budget, rowOverrides]);

  return (
    <div className="space-y-4 max-w-full">
      {(budget.stages || []).map((budgetStage) => {
        const labourLines = (budgetStage.lines || []).filter(
          (l) => l.type === "labour" || l.type === "labor",
        );
        const otherLines = (budgetStage.lines || []).filter(
          (l) => l.type === "other",
        );
        const isCollapsed = collapsedStages.has(budgetStage.id);

        // Labour summary
        const labourTotal = labourLines.reduce(
          (sum, l) => sum + calculateLineValues(l).client,
          0,
        );
        const totalDays = labourLines.reduce(
          (sum, l) => sum + (l.days || 0),
          0,
        );
        const labourProvider = getProvider(`labour_${budgetStage.id}`, "ASC");

        // Stage subtotals
        let stageASCTotal = 0;
        let stageClientProvidesCount = 0;
        let stageTotal = 0;

        if (labourProvider === "ASC" && labourTotal > 0) {
          stageASCTotal += labourTotal;
          stageTotal += labourTotal;
        }

        for (const line of otherLines) {
          const provider = getProvider(line.id, "ASC");
          const val = calculateLineValues(line).client;
          if (provider === "Client") {
            stageClientProvidesCount++;
          } else {
            stageASCTotal += val;
            stageTotal += val;
          }
        }

        return (
          <div
            key={budgetStage.id}
            className="border rounded-lg bg-white overflow-hidden"
          >
            {/* Stage header */}
            <button
              type="button"
              onClick={() => toggleStageCollapse(budgetStage.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              data-ocid={`client_budget.stage_${budgetStage.id}.toggle`}
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
                <span className="font-semibold text-sm text-gray-800">
                  {budgetStage.name}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>ASC: {formatCurrency(stageASCTotal)}</span>
                {stageClientProvidesCount > 0 && (
                  <span>Client provides: {stageClientProvidesCount}</span>
                )}
                <span className="font-semibold text-gray-700">
                  Stage Total: {formatCurrency(stageTotal)}
                </span>
              </div>
            </button>

            {!isCollapsed && (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-1.5 text-left border border-gray-200 font-medium">
                          Item Type
                        </th>
                        <th className="px-2 py-1.5 text-left border border-gray-200 font-medium">
                          Item
                        </th>
                        <th className="px-2 py-1.5 text-center border border-gray-200 font-medium">
                          Provider
                        </th>
                        <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                          Client £
                        </th>
                        <th className="px-2 py-1.5 text-left border border-gray-200 font-medium">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Labour summary row */}
                      {labourLines.length > 0 && (
                        <tr
                          className={
                            labourProvider === "Client" ? "opacity-60" : ""
                          }
                        >
                          <td className="border border-gray-200 px-2 py-1.5 text-gray-500 italic">
                            Labour
                          </td>
                          <td className="border border-gray-200 px-2 py-1.5 font-medium">
                            Labour (Summary)
                          </td>
                          <td className="border border-gray-200 px-1 py-0.5 text-center">
                            <Select
                              value={labourProvider}
                              onValueChange={(val) =>
                                setProvider(
                                  `labour_${budgetStage.id}`,
                                  val as BudgetProvider,
                                )
                              }
                            >
                              <SelectTrigger className="h-6 text-xs w-20 border-0 focus:ring-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ASC">ASC</SelectItem>
                                <SelectItem value="Client">Client</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">
                            {labourProvider === "Client"
                              ? "£0.00"
                              : formatCurrency(labourTotal)}
                          </td>
                          <td className="border border-gray-200 px-2 py-1.5 text-gray-500">
                            {labourProvider === "Client"
                              ? "Client to provide"
                              : `${totalDays} day${totalDays !== 1 ? "s" : ""} total`}
                          </td>
                        </tr>
                      )}

                      {/* Other items */}
                      {otherLines.map((line) => {
                        const provider = getProvider(line.id, "ASC");
                        const val = calculateLineValues(line).client;
                        const isClientProvided = provider === "Client";

                        return (
                          <tr
                            key={line.id}
                            className={isClientProvided ? "opacity-60" : ""}
                          >
                            <td className="border border-gray-200 px-2 py-1.5 text-gray-500 italic">
                              Other
                            </td>
                            <td className="border border-gray-200 px-2 py-1.5">
                              {line.description || "(unnamed)"}
                            </td>
                            <td className="border border-gray-200 px-1 py-0.5 text-center">
                              <Select
                                value={provider}
                                onValueChange={(v) =>
                                  setProvider(line.id, v as BudgetProvider)
                                }
                              >
                                <SelectTrigger className="h-6 text-xs w-20 border-0 focus:ring-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ASC">ASC</SelectItem>
                                  <SelectItem value="Client">Client</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">
                              {isClientProvided ? "£0.00" : formatCurrency(val)}
                            </td>
                            <td className="border border-gray-200 px-2 py-1.5 text-gray-500">
                              {isClientProvided
                                ? "Client to provide"
                                : line.notes || ""}
                            </td>
                          </tr>
                        );
                      })}

                      {labourLines.length === 0 && otherLines.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="border border-gray-200 px-2 py-3 text-center text-gray-400 text-xs"
                          >
                            No budget lines for this stage
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-medium">
                        <td
                          colSpan={3}
                          className="border border-gray-200 px-2 py-1.5 text-right text-xs"
                        >
                          Stage Total
                        </td>
                        <td className="border border-gray-200 px-2 py-1.5 text-right text-xs font-mono">
                          {formatCurrency(stageTotal)}
                        </td>
                        <td className="border border-gray-200 px-2 py-1.5 text-xs text-gray-400">
                          {stageClientProvidesCount > 0 &&
                            `(+ ${stageClientProvidesCount} client item${stageClientProvidesCount !== 1 ? "s" : ""})`}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {(budget.stages || []).length === 0 && (
        <div
          className="border rounded-lg p-8 bg-white text-center text-gray-400 text-sm"
          data-ocid="client_budget.stages.empty_state"
        >
          No budget data yet. Switch to Working Budget and add some cost lines.
        </div>
      )}

      {/* Project Totals */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Project Totals
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border rounded p-3">
            <div className="text-xs text-gray-500 mb-1">Total Client £</div>
            <div className="text-lg font-bold font-mono">
              {formatCurrency(projectTotals.totalClient)}
            </div>
          </div>
          <div className="bg-white border rounded p-3">
            <div className="text-xs text-gray-500 mb-1">
              Items Client Provides
            </div>
            <div className="text-lg font-bold">
              {projectTotals.clientProvidesCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
