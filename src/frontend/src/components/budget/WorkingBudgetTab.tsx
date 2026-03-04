import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, Stage } from "@/types";
import type { BudgetLineItem, Invoice, ProjectBudget } from "@/types/project";
import { ChevronDown, ChevronRight, Plus, Receipt } from "lucide-react";
import { useState } from "react";
import {
  calculateExpectedPayment,
  calculateLineValues,
  calculateProjectTotals,
  formatCurrency,
  getStatusColor,
} from "./budgetCalculations";
import { exportToExcel } from "./excelExport";

interface WorkingBudgetTabProps {
  project: Project;
  stages: Stage[];
  budget: ProjectBudget;
  onUpdateBudget: (updates: Partial<ProjectBudget>) => void;
}

export default function WorkingBudgetTab({
  project,
  stages,
  budget,
  onUpdateBudget,
}: WorkingBudgetTabProps) {
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedInvoices, setCollapsedInvoices] = useState<Set<string>>(
    new Set(),
  );
  const [showModeConfirm, setShowModeConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<"stage" | "project" | null>(
    null,
  );

  const invoiceMode = budget.invoiceMode || "stage";
  const projectInvoices = budget.projectInvoices || [];
  const stageInvoices = budget.stageInvoices || {};
  const settings = budget.settings || {};

  // ---- Helpers ----
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getBudgetStageLines = (stageId: string): BudgetLineItem[] => {
    const bs = budget.stages?.find((s) => s.id === stageId);
    return bs?.lines || [];
  };

  const updateStageLines = (stageId: string, lines: BudgetLineItem[]) => {
    const existingStages = budget.stages || [];
    const stageExists = existingStages.find((s) => s.id === stageId);
    let newStages: typeof existingStages;
    if (stageExists) {
      newStages = existingStages.map((s) =>
        s.id === stageId ? { ...s, lines } : s,
      );
    } else {
      const stage = stages.find((s) => s.id === stageId);
      newStages = [
        ...existingStages,
        { id: stageId, name: stage?.name || "", lines },
      ];
    }
    onUpdateBudget({ stages: newStages });
  };

  const toggleStageCollapse = (stageId: string) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const toggleInvoiceCollapse = (key: string) => {
    setCollapsedInvoices((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ---- Stage totals ----
  const getStageTotals = (stageId: string) => {
    const lines = getBudgetStageLines(stageId);
    const labour = lines.filter(
      (l) => l.type === "labour" || l.type === "labor",
    );
    const other = lines.filter((l) => l.type === "other");
    const labourCost = labour.reduce(
      (sum, l) => sum + calculateLineValues(l).costASC,
      0,
    );
    const otherCost = other.reduce(
      (sum, l) => sum + calculateLineValues(l).costASC,
      0,
    );
    const total = lines.reduce(
      (sum, l) => sum + calculateLineValues(l).client,
      0,
    );
    return { labourCost, otherCost, total };
  };

  // ---- Invoice Mode switch ----
  const hasInvoices =
    projectInvoices.length > 0 ||
    Object.values(stageInvoices).some((arr) => arr.length > 0);

  const handleModeSwitch = (mode: "stage" | "project") => {
    if (mode === invoiceMode) return;
    if (hasInvoices) {
      setPendingMode(mode);
      setShowModeConfirm(true);
    } else {
      onUpdateBudget({ invoiceMode: mode });
    }
  };

  const confirmModeSwitch = () => {
    if (pendingMode) {
      onUpdateBudget({
        invoiceMode: pendingMode,
        projectInvoices: [],
        stageInvoices: {},
      });
    }
    setShowModeConfirm(false);
    setPendingMode(null);
  };

  // ---- Project-level Invoice ops ----
  const addProjectInvoice = () => {
    const newInvoice: Invoice = {
      id: generateId(),
      date: "",
      description: "",
      percent: 0,
      paymentTerms: 30,
      status: "Not Sent",
    };
    onUpdateBudget({ projectInvoices: [...projectInvoices, newInvoice] });
  };

  const updateProjectInvoice = (id: string, updates: Partial<Invoice>) => {
    onUpdateBudget({
      projectInvoices: projectInvoices.map((inv) =>
        inv.id === id ? { ...inv, ...updates } : inv,
      ),
    });
  };

  const deleteProjectInvoice = (id: string) => {
    onUpdateBudget({
      projectInvoices: projectInvoices.filter((inv) => inv.id !== id),
    });
  };

  // ---- Stage-level Invoice ops ----
  const getStageInvoices = (stageId: string): Invoice[] =>
    stageInvoices[stageId] || [];

  const addStageInvoice = (stageId: string) => {
    const newInvoice: Invoice = {
      id: generateId(),
      date: "",
      description: "",
      percent: 0,
      paymentTerms: 30,
      status: "Not Sent",
    };
    onUpdateBudget({
      stageInvoices: {
        ...stageInvoices,
        [stageId]: [...getStageInvoices(stageId), newInvoice],
      },
    });
  };

  const updateStageInvoice = (
    stageId: string,
    id: string,
    updates: Partial<Invoice>,
  ) => {
    onUpdateBudget({
      stageInvoices: {
        ...stageInvoices,
        [stageId]: getStageInvoices(stageId).map((inv) =>
          inv.id === id ? { ...inv, ...updates } : inv,
        ),
      },
    });
  };

  const deleteStageInvoice = (stageId: string, id: string) => {
    onUpdateBudget({
      stageInvoices: {
        ...stageInvoices,
        [stageId]: getStageInvoices(stageId).filter((inv) => inv.id !== id),
      },
    });
  };

  // ---- Line item ops ----
  const addLabourLine = (stageId: string) => {
    const lines = getBudgetStageLines(stageId);
    const newLine: BudgetLineItem = {
      id: generateId(),
      stageId,
      type: "labour",
      description: "",
      days: 0,
      rate: settings.defaultRate || 0,
      markup: settings.defaultMarkup || 0,
      contingency: settings.defaultContingency || 0,
    };
    updateStageLines(stageId, [...lines, newLine]);
  };

  const addOtherLine = (stageId: string) => {
    const lines = getBudgetStageLines(stageId);
    const newLine: BudgetLineItem = {
      id: generateId(),
      stageId,
      type: "other",
      description: "",
      howMany: 0,
      rate: 0,
      markup: settings.defaultMarkup || 0,
      contingency: settings.defaultContingency || 0,
    };
    updateStageLines(stageId, [...lines, newLine]);
  };

  const updateLine = (
    stageId: string,
    lineId: string,
    updates: Partial<BudgetLineItem>,
  ) => {
    const lines = getBudgetStageLines(stageId);
    updateStageLines(
      stageId,
      lines.map((l) => (l.id === lineId ? { ...l, ...updates } : l)),
    );
  };

  const deleteLine = (stageId: string, lineId: string) => {
    const lines = getBudgetStageLines(stageId);
    updateStageLines(
      stageId,
      lines.filter((l) => l.id !== lineId),
    );
  };

  // ---- Project totals ----
  const projectTotals = calculateProjectTotals(budget);

  // ---- Invoice table renderer ----
  const renderInvoiceTable = (
    invoices: Invoice[],
    totalClientAmount: number,
    onAdd: () => void,
    onUpdate: (id: string, updates: Partial<Invoice>) => void,
    onDelete: (id: string) => void,
  ) => {
    const totalPercent = invoices.reduce(
      (sum, inv) => sum + (inv.percent || 0),
      0,
    );
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + (totalClientAmount * (inv.percent || 0)) / 100,
      0,
    );
    const percentWarning =
      invoices.length > 0 && Math.abs(totalPercent - 100) > 0.01;

    return (
      <div className="mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1.5 text-left border border-gray-200 font-medium">
                  Invoice Date
                </th>
                <th className="px-2 py-1.5 text-left border border-gray-200 font-medium">
                  Description
                </th>
                <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                  % of Total
                </th>
                <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                  Amount
                </th>
                <th className="px-2 py-1.5 text-center border border-gray-200 font-medium">
                  Payment Terms
                </th>
                <th className="px-2 py-1.5 text-center border border-gray-200 font-medium">
                  Expected Payment
                </th>
                <th className="px-2 py-1.5 text-center border border-gray-200 font-medium">
                  Status
                </th>
                <th className="px-2 py-1.5 border border-gray-200" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const amount = (totalClientAmount * (inv.percent || 0)) / 100;
                const expectedPayment = calculateExpectedPayment(
                  inv.date,
                  inv.paymentTerms || 30,
                );
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-1 py-0.5">
                      <input
                        type="date"
                        value={inv.date || ""}
                        onChange={(e) =>
                          onUpdate(inv.id, { date: e.target.value })
                        }
                        className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                      />
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5">
                      <input
                        type="text"
                        value={inv.description || ""}
                        onChange={(e) =>
                          onUpdate(inv.id, { description: e.target.value })
                        }
                        placeholder="Description"
                        className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                      />
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-right">
                      <input
                        type="number"
                        value={inv.percent || ""}
                        onChange={(e) =>
                          onUpdate(inv.id, {
                            percent: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-16 text-xs text-right border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                      />
                    </td>
                    <td className="border border-gray-200 px-2 py-0.5 text-right font-mono">
                      {formatCurrency(amount)}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-center">
                      <Select
                        value={String(inv.paymentTerms || 30)}
                        onValueChange={(val) =>
                          onUpdate(inv.id, {
                            paymentTerms: Number.parseInt(val),
                          })
                        }
                      >
                        <SelectTrigger className="h-6 text-xs w-20 border-0 focus:ring-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[7, 14, 30, 60, 90].map((d) => (
                            <SelectItem key={d} value={String(d)}>
                              {d} days
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-200 px-2 py-0.5 text-center text-gray-600">
                      {expectedPayment}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-center">
                      <Select
                        value={inv.status || "Not Sent"}
                        onValueChange={(val) =>
                          onUpdate(inv.id, { status: val as Invoice["status"] })
                        }
                      >
                        <SelectTrigger
                          className={`h-6 text-xs w-24 border-0 focus:ring-1 ${getStatusColor(inv.status)}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Sent">Not Sent</SelectItem>
                          <SelectItem value="Sent">Sent</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5 text-center">
                      <button
                        type="button"
                        onClick={() => onDelete(inv.id)}
                        className="text-gray-400 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-gray-200 px-2 py-3 text-center text-gray-400 text-xs"
                  >
                    No invoices yet. Click "Add Invoice" to create one.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td
                  colSpan={2}
                  className="border border-gray-200 px-2 py-1.5 text-right text-xs"
                >
                  Total
                </td>
                <td
                  className={`border border-gray-200 px-2 py-1.5 text-right text-xs ${percentWarning ? "text-red-600 font-bold" : ""}`}
                >
                  {totalPercent.toFixed(1)}%
                </td>
                <td className="border border-gray-200 px-2 py-1.5 text-right text-xs font-mono">
                  {formatCurrency(totalAmount)}
                </td>
                <td colSpan={4} className="border border-gray-200 px-2 py-1.5">
                  {percentWarning && (
                    <span className="text-red-600 text-xs">
                      ⚠ Total should be 100%
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          data-ocid="budget.add_invoice.button"
        >
          <Plus className="w-3 h-3" /> Add Invoice
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Default Budget Settings */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Default Budget Settings
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="budget-default-rate"
              className="block text-xs text-gray-500 mb-1"
            >
              Default Rate (£/day)
            </label>
            <input
              id="budget-default-rate"
              type="number"
              value={settings.defaultRate ?? ""}
              onChange={(e) =>
                onUpdateBudget({
                  settings: {
                    ...settings,
                    defaultRate: Number.parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              data-ocid="budget.default_rate.input"
            />
          </div>
          <div>
            <label
              htmlFor="budget-default-markup"
              className="block text-xs text-gray-500 mb-1"
            >
              Default Markup %
            </label>
            <input
              id="budget-default-markup"
              type="number"
              value={settings.defaultMarkup ?? ""}
              onChange={(e) =>
                onUpdateBudget({
                  settings: {
                    ...settings,
                    defaultMarkup: Number.parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              data-ocid="budget.default_markup.input"
            />
          </div>
          <div>
            <label
              htmlFor="budget-default-contingency"
              className="block text-xs text-gray-500 mb-1"
            >
              Default Contingency %
            </label>
            <input
              id="budget-default-contingency"
              type="number"
              value={settings.defaultContingency ?? ""}
              onChange={(e) =>
                onUpdateBudget({
                  settings: {
                    ...settings,
                    defaultContingency: Number.parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              data-ocid="budget.default_contingency.input"
            />
          </div>
        </div>
      </div>

      {/* Invoice Mode Toggle */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Invoice Mode
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleModeSwitch("stage")}
            className={`px-4 py-2 text-sm font-medium rounded ${invoiceMode === "stage" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            data-ocid="budget.stage_mode.toggle"
          >
            Stage-Level
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("project")}
            className={`px-4 py-2 text-sm font-medium rounded ${invoiceMode === "project" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            data-ocid="budget.project_mode.toggle"
          >
            Project-Level
          </button>
        </div>
      </div>

      {/* Project-Level Invoice Schedule */}
      {invoiceMode === "project" && (
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Project Invoice Schedule
            </h3>
            <span className="text-xs text-gray-500">
              Total: {formatCurrency(projectTotals.clientTotal)}
            </span>
          </div>
          {renderInvoiceTable(
            projectInvoices,
            projectTotals.clientTotal,
            addProjectInvoice,
            updateProjectInvoice,
            deleteProjectInvoice,
          )}
        </div>
      )}

      {/* Per-Stage Sections */}
      {stages.map((stage) => {
        const lines = getBudgetStageLines(stage.id);
        const labourLines = lines.filter(
          (l) => l.type === "labour" || l.type === "labor",
        );
        const otherLines = lines.filter((l) => l.type === "other");
        const stageTotals = getStageTotals(stage.id);
        const isCollapsed = collapsedStages.has(stage.id);
        const stageInvs = getStageInvoices(stage.id);
        const stageClientTotal = stageTotals.total;

        return (
          <div
            key={stage.id}
            className="border rounded-lg bg-white overflow-hidden"
          >
            {/* Stage header */}
            <button
              type="button"
              onClick={() => toggleStageCollapse(stage.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              data-ocid={`budget.stage_${stage.id}.toggle`}
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
                <span className="font-semibold text-sm text-gray-800">
                  {stage.name}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>Labour: {formatCurrency(stageTotals.labourCost)}</span>
                <span>Other: {formatCurrency(stageTotals.otherCost)}</span>
                <span className="font-semibold text-gray-700">
                  Total: {formatCurrency(stageTotals.total)}
                </span>
              </div>
            </button>

            {!isCollapsed && (
              <div className="p-4 space-y-4">
                {/* Stage Invoice Schedule (stage mode only) */}
                {invoiceMode === "stage" && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleInvoiceCollapse(stage.id)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-1"
                    >
                      {collapsedInvoices.has(stage.id) ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      Invoice Schedule
                      <span className="text-xs text-gray-400">
                        ({stageInvs.length} invoice
                        {stageInvs.length !== 1 ? "s" : ""})
                      </span>
                    </button>
                    {!collapsedInvoices.has(stage.id) &&
                      renderInvoiceTable(
                        stageInvs,
                        stageClientTotal,
                        () => addStageInvoice(stage.id),
                        (id, updates) =>
                          updateStageInvoice(stage.id, id, updates),
                        (id) => deleteStageInvoice(stage.id, id),
                      )}
                  </div>
                )}

                {/* Labour Table */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Labour
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2 py-1.5 text-left border border-gray-200 font-medium">
                            Role
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Days
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Rate
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Unit £
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Cost ASC £
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Markup %
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Markup £
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Cont %
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Cont £
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Client £
                          </th>
                          <th className="px-2 py-1.5 text-center border border-gray-200 font-medium">
                            <Receipt className="w-3 h-3 inline" />
                          </th>
                          <th className="px-2 py-1.5 border border-gray-200" />
                        </tr>
                      </thead>
                      <tbody>
                        {labourLines.map((line) => {
                          const vals = calculateLineValues(line);
                          return (
                            <tr key={line.id} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-1 py-0.5">
                                <input
                                  type="text"
                                  value={line.description || ""}
                                  onChange={(e) =>
                                    updateLine(stage.id, line.id, {
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Role"
                                  className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 min-w-[80px]"
                                />
                              </td>
                              <td className="border border-gray-200 px-1 py-0.5 text-right">
                                <input
                                  type="number"
                                  value={line.days ?? ""}
                                  onChange={(e) =>
                                    updateLine(stage.id, line.id, {
                                      days:
                                        Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-14 text-xs text-right border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                                />
                              </td>
                              <td className="border border-gray-200 px-1 py-0.5 text-right">
                                <input
                                  type="number"
                                  value={line.rate ?? ""}
                                  onChange={(e) =>
                                    updateLine(stage.id, line.id, {
                                      rate:
                                        Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-16 text-xs text-right border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                                />
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-right font-mono bg-gray-50">
                                {formatCurrency(vals.unit)}
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-right font-mono bg-gray-50">
                                {formatCurrency(vals.costASC)}
                              </td>
                              <td className="border border-gray-200 px-1 py-0.5 text-right">
                                <input
                                  type="number"
                                  value={line.markup ?? ""}
                                  onChange={(e) =>
                                    updateLine(stage.id, line.id, {
                                      markup:
                                        Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-12 text-xs text-right border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                                />
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-right font-mono bg-gray-50">
                                {formatCurrency(vals.markupAmount)}
                              </td>
                              <td className="border border-gray-200 px-1 py-0.5 text-right">
                                <input
                                  type="number"
                                  value={line.contingency ?? ""}
                                  onChange={(e) =>
                                    updateLine(stage.id, line.id, {
                                      contingency:
                                        Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-12 text-xs text-right border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                                />
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-right font-mono bg-gray-50">
                                {formatCurrency(vals.contAmount)}
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-right font-mono font-semibold bg-gray-50">
                                {formatCurrency(vals.client)}
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-center text-gray-400">
                                -
                              </td>
                              <td className="border border-gray-200 px-1 py-0.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => deleteLine(stage.id, line.id)}
                                  className="text-gray-400 hover:text-red-500 text-xs"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {labourLines.length === 0 && (
                          <tr>
                            <td
                              colSpan={12}
                              className="border border-gray-200 px-2 py-2 text-center text-gray-400 text-xs"
                            >
                              No labour lines
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={() => addLabourLine(stage.id)}
                    className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    data-ocid={`budget.add_labour_${stage.id}.button`}
                  >
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </div>

                {/* Other Costs Table */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Other Costs
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2 py-1.5 text-left border border-gray-200 font-medium">
                            Item
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            How Many
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Rate
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Unit £
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Cost ASC £
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Markup %
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Markup £
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Cont %
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Cont £
                          </th>
                          <th className="px-2 py-1.5 text-right border border-gray-200 font-medium">
                            Client £
                          </th>
                          <th className="px-2 py-1.5 text-center border border-gray-200 font-medium">
                            <Receipt className="w-3 h-3 inline" />
                          </th>
                          <th className="px-2 py-1.5 border border-gray-200" />
                        </tr>
                      </thead>
                      <tbody>
                        {otherLines.map((line) => {
                          const vals = calculateLineValues(line);
                          return (
                            <tr key={line.id} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-1 py-0.5">
                                <input
                                  type="text"
                                  value={line.description || ""}
                                  onChange={(e) =>
                                    updateLine(stage.id, line.id, {
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Item"
                                  className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 min-w-[80px]"
                                />
                              </td>
                              <td className="border border-gray-200 px-1 py-0.5 text-right">
                                <input
                                  type="number"
                                  value={line.howMany ?? ""}
                                  onChange={(e) =>
                                    updateLine(stage.id, line.id, {
                                      howMany:
                                        Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-14 text-xs text-right border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                                />
                              </td>
                              <td className="border border-gray-200 px-1 py-0.5 text-right">
                                <input
                                  type="number"
                                  value={line.rate ?? ""}
                                  onChange={(e) =>
                                    updateLine(stage.id, line.id, {
                                      rate:
                                        Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-16 text-xs text-right border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                                />
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-right font-mono bg-gray-50">
                                {formatCurrency(vals.unit)}
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-right font-mono bg-gray-50">
                                {formatCurrency(vals.costASC)}
                              </td>
                              <td className="border border-gray-200 px-1 py-0.5 text-right">
                                <input
                                  type="number"
                                  value={line.markup ?? ""}
                                  onChange={(e) =>
                                    updateLine(stage.id, line.id, {
                                      markup:
                                        Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-12 text-xs text-right border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                                />
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-right font-mono bg-gray-50">
                                {formatCurrency(vals.markupAmount)}
                              </td>
                              <td className="border border-gray-200 px-1 py-0.5 text-right">
                                <input
                                  type="number"
                                  value={line.contingency ?? ""}
                                  onChange={(e) =>
                                    updateLine(stage.id, line.id, {
                                      contingency:
                                        Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-12 text-xs text-right border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                                />
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-right font-mono bg-gray-50">
                                {formatCurrency(vals.contAmount)}
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-right font-mono font-semibold bg-gray-50">
                                {formatCurrency(vals.client)}
                              </td>
                              <td className="border border-gray-200 px-2 py-0.5 text-center text-gray-400">
                                -
                              </td>
                              <td className="border border-gray-200 px-1 py-0.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => deleteLine(stage.id, line.id)}
                                  className="text-gray-400 hover:text-red-500 text-xs"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {otherLines.length === 0 && (
                          <tr>
                            <td
                              colSpan={12}
                              className="border border-gray-200 px-2 py-2 text-center text-gray-400 text-xs"
                            >
                              No other cost lines
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={() => addOtherLine(stage.id)}
                    className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    data-ocid={`budget.add_other_${stage.id}.button`}
                  >
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {stages.length === 0 && (
        <div
          className="border rounded-lg p-8 bg-white text-center text-gray-400 text-sm"
          data-ocid="budget.stages.empty_state"
        >
          No stages found for this project. Add stages on the Board tab first.
        </div>
      )}

      {/* Project Totals */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Project Totals
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: "Total Days", value: projectTotals.totalDays.toFixed(1) },
            {
              label: "Labour Cost",
              value: formatCurrency(projectTotals.labourCost),
            },
            {
              label: "Other Costs",
              value: formatCurrency(projectTotals.otherCost),
            },
            {
              label: "Total ASC",
              value: formatCurrency(projectTotals.totalASC),
            },
            {
              label: "Total Markup",
              value: formatCurrency(projectTotals.totalMarkup),
            },
            {
              label: "Total Contingency",
              value: formatCurrency(projectTotals.totalContingency),
            },
          ].map((item) => (
            <div key={item.label} className="bg-white border rounded p-2">
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="text-sm font-semibold font-mono mt-0.5">
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white border rounded p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">
              Total Client £
            </span>
            <span className="text-lg font-bold font-mono text-gray-900">
              {formatCurrency(projectTotals.clientTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end pb-4">
        <button
          type="button"
          onClick={() => exportToExcel(project, budget, "")}
          className="px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
          data-ocid="budget.export_excel.button"
        >
          Export to Excel
        </button>
      </div>

      {/* Mode Switch Confirmation */}
      <AlertDialog open={showModeConfirm} onOpenChange={setShowModeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Invoice Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching invoice mode will clear all existing invoices. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowModeConfirm(false);
                setPendingMode(null);
              }}
              data-ocid="budget.mode_confirm.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmModeSwitch}
              data-ocid="budget.mode_confirm.confirm_button"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
