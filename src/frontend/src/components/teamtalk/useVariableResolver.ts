import type { Project } from "@/types";
import { useMemo } from "react";
import type { BookingPerson } from "./types";

interface ProjectInfo {
  customFields?: { id: string; name: string; value: string }[];
  budget?: {
    stages?: {
      lines?: {
        type: string;
        days?: number;
        howMany?: number;
        rate?: number;
        markup?: number;
        contingency?: number;
      }[];
    }[];
  };
}

function loadProjectInfo(projectId: string): ProjectInfo {
  try {
    return JSON.parse(
      localStorage.getItem(`orca_project_info_${projectId}`) || "{}",
    );
  } catch {
    return {};
  }
}

function calcBudgetTotal(info: ProjectInfo): number {
  let total = 0;
  for (const s of info.budget?.stages || []) {
    for (const l of s.lines || []) {
      const isLab = l.type === "labour" || l.type === "labor";
      const unit = isLab
        ? (l.days || 0) * (l.rate || 0)
        : (l.howMany || 0) * (l.rate || 0);
      const markup = unit * ((l.markup || 0) / 100);
      const cont = (unit + markup) * ((l.contingency || 0) / 100);
      total += unit + markup + cont;
    }
  }
  return total;
}

function fmtCurrency(v: number) {
  return `£${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function buildCfMap(info: ProjectInfo): Record<string, string> {
  const cfMap: Record<string, string> = {};
  for (const f of info.customFields || []) {
    cfMap[f.name.toLowerCase().replace(/\s+/g, "")] = f.value || "";
  }
  return cfMap;
}

export function useVariableResolver(
  person: BookingPerson | null,
  project: Project | null,
) {
  return useMemo(() => {
    if (!person || !project) return (text: string) => text;

    const info = loadProjectInfo(project.id);
    const budgetTotal = calcBudgetTotal(info);
    const totalFee = person.rate * (person.dates?.length || 0);
    const portalLink = `https://portal.orca.app/booking/${person.id}`;
    const cfMap = buildCfMap(info);

    const vars: Record<string, string> = {
      "{{projectName}}": project.name,
      "{{client}}": cfMap.client || "",
      "{{location}}": cfMap.location || "",
      "{{callTime}}": cfMap.calltime || cfMap.call_time || "",
      "{{wrapTime}}": cfMap.wraptime || cfMap.wrap_time || "",
      "{{parking}}": cfMap.parking || "",
      "{{catering}}": cfMap.catering || "",
      "{{contact}}": cfMap.contact || cfMap.onset_contact || "",
      "{{budget}}": fmtCurrency(budgetTotal),
      "{{notes}}": cfMap.notes || "",
      "{{firstName}}": person.name.split(" ")[0],
      "{{fullName}}": person.name,
      "{{role}}": person.role,
      "{{rate}}": `£${person.rate}`,
      "{{personDates}}": (person.dates || []).map(fmtDate).join(", "),
      "{{totalFee}}": fmtCurrency(totalFee),
      "{{portalLink}}": portalLink,
    };

    return (text: string) => {
      let result = text;
      for (const [key, val] of Object.entries(vars)) {
        result = result.replaceAll(key, val);
      }
      return result;
    };
  }, [person, project]);
}

export function buildVarPreviewGroups(
  person: BookingPerson | null,
  project: Project | null,
) {
  if (!person || !project) return [];
  const info = loadProjectInfo(project.id);
  const budgetTotal = calcBudgetTotal(info);
  const totalFee = person.rate * (person.dates?.length || 0);
  const cfMap = buildCfMap(info);

  return [
    {
      group: "Project",
      vars: [
        { key: "{{projectName}}", preview: project.name },
        { key: "{{client}}", preview: cfMap.client || "—" },
        { key: "{{location}}", preview: cfMap.location || "—" },
        { key: "{{callTime}}", preview: cfMap.calltime || "—" },
        { key: "{{wrapTime}}", preview: cfMap.wraptime || "—" },
        { key: "{{parking}}", preview: cfMap.parking || "—" },
        { key: "{{catering}}", preview: cfMap.catering || "—" },
        { key: "{{contact}}", preview: cfMap.contact || "—" },
        { key: "{{budget}}", preview: fmtCurrency(budgetTotal) },
        { key: "{{notes}}", preview: cfMap.notes || "—" },
      ],
    },
    {
      group: "Person",
      vars: [
        { key: "{{firstName}}", preview: person.name.split(" ")[0] },
        { key: "{{fullName}}", preview: person.name },
        { key: "{{role}}", preview: person.role },
        { key: "{{rate}}", preview: `£${person.rate}` },
        {
          key: "{{personDates}}",
          preview: (person.dates || []).map(fmtDate).join(", ") || "—",
        },
      ],
    },
    {
      group: "Calculated",
      vars: [{ key: "{{totalFee}}", preview: fmtCurrency(totalFee) }],
    },
    {
      group: "System",
      vars: [
        {
          key: "{{portalLink}}",
          preview: `https://portal.orca.app/booking/${person.id}`,
        },
      ],
    },
  ];
}
