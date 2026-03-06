import type { Project, Stage, Task } from "@/types";
import type { CustomField, ProjectBudget } from "@/types/project";

export const fmt = (v: number) =>
  `£${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (s?: string) => {
  if (!s) return "";
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export function calcBudgetTotals(budget: ProjectBudget, stages: Stage[]) {
  let totalLabour = 0;
  let totalMaterials = 0;
  let totalCostASC = 0;
  let totalClient = 0;
  const perStage: Record<
    string,
    {
      name: string;
      labour: number;
      materials: number;
      costASC: number;
      client: number;
    }
  > = {};

  for (const bs of budget.stages || []) {
    let sL = 0;
    let sM = 0;
    let sA = 0;
    let sC = 0;
    for (const l of bs.lines || []) {
      const isLab = l.type === "labour" || l.type === "labor";
      const unit = isLab
        ? (l.days || 0) * (l.rate || 0)
        : (l.howMany || 0) * (l.rate || 0);
      const markup = unit * ((l.markup || 0) / 100);
      const cont = (unit + markup) * ((l.contingency || 0) / 100);
      if (isLab) {
        sL += unit;
      } else {
        sM += unit;
      }
      sA += unit;
      sC += unit + markup + cont;
    }
    const stage = stages.find((s) => s.id === bs.id);
    perStage[bs.id] = {
      name: stage?.name || bs.name,
      labour: sL,
      materials: sM,
      costASC: sA,
      client: sC,
    };
    totalLabour += sL;
    totalMaterials += sM;
    totalCostASC += sA;
    totalClient += sC;
  }

  return {
    totalLabour,
    totalMaterials,
    totalCostASC,
    totalClient,
    profit: totalClient - totalCostASC,
    perStage,
  };
}

export interface VarCategory {
  label: string;
  vars: { key: string; preview: string }[];
}

export function buildVariableCategories(
  project: Project | undefined,
  projectStages: Stage[],
  projectTasks: Task[],
  budget: ProjectBudget,
  customFields: CustomField[],
): VarCategory[] {
  const bv = calcBudgetTotals(budget, projectStages);
  const allDates = projectStages.flatMap(
    (s) => [s.startDate, s.endDate].filter(Boolean) as string[],
  );
  const firstDate = allDates.length
    ? allDates.reduce((a, b) => (a < b ? a : b))
    : "";
  const lastDate = allDates.length
    ? allDates.reduce((a, b) => (a > b ? a : b))
    : "";
  const teamNames = (project?.teamMembers || [])
    .map((m) => {
      const jobTitle = (m as unknown as Record<string, unknown>).jobTitle as
        | string
        | undefined;
      return `${m.name} (${jobTitle || m.role})`;
    })
    .join(", ");
  const doneTasks = projectTasks.filter((t) => t.status === "done").length;

  return [
    {
      label: "Project",
      vars: [
        { key: "{{projectName}}", preview: project?.name || "" },
        { key: "{{projectStart}}", preview: fmtDate(firstDate) },
        { key: "{{projectEnd}}", preview: fmtDate(lastDate) },
        { key: "{{totalStages}}", preview: String(projectStages.length) },
        { key: "{{totalTasks}}", preview: String(projectTasks.length) },
        { key: "{{completedTasks}}", preview: String(doneTasks) },
        { key: "{{teamMembers}}", preview: teamNames },
      ],
    },
    {
      label: "Budget",
      vars: [
        { key: "{{totalBudget}}", preview: fmt(bv.totalClient) },
        { key: "{{totalLabour}}", preview: fmt(bv.totalLabour) },
        { key: "{{totalMaterials}}", preview: fmt(bv.totalMaterials) },
        { key: "{{costToASC}}", preview: fmt(bv.totalCostASC) },
        { key: "{{costToClient}}", preview: fmt(bv.totalClient) },
        { key: "{{profitToASC}}", preview: fmt(bv.profit) },
      ],
    },
    {
      label: "Per Stage",
      vars: projectStages.flatMap((s) => {
        const sb = bv.perStage[s.id] || {
          labour: 0,
          materials: 0,
          costASC: 0,
          client: 0,
        };
        const tag = s.name.replace(/\s+/g, "_");
        return [
          {
            key: `{{${tag}_dates}}`,
            preview: `${fmtDate(s.startDate)} – ${fmtDate(s.endDate)}`,
          },
          { key: `{{${tag}_labour}}`, preview: fmt(sb.labour) },
          { key: `{{${tag}_materials}}`, preview: fmt(sb.materials) },
          { key: `{{${tag}_costASC}}`, preview: fmt(sb.costASC) },
          { key: `{{${tag}_client}}`, preview: fmt(sb.client) },
        ];
      }),
    },
    {
      label: "Custom Fields",
      vars: customFields.map((f) => ({
        key: `{{cf_${f.name.replace(/\s+/g, "_")}}}`,
        preview: f.value || "—",
      })),
    },
  ];
}

export function resolveVariables(
  text: string,
  categories: VarCategory[],
): string {
  let result = text;
  for (const cat of categories) {
    for (const v of cat.vars) {
      result = result.replaceAll(v.key, v.preview);
    }
  }
  return result;
}
