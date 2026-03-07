import type { Project, Stage, TeamMember } from "@/types";
import { useEffect, useMemo, useState } from "react";

interface ResourcePlanningGridProps {
  project: Project;
  stages: Stage[];
  allDates: Date[];
  DAY_HEIGHT: number;
}

export default function ResourcePlanningGrid({
  project,
  stages,
  allDates,
  DAY_HEIGHT,
}: ResourcePlanningGridProps) {
  const [resourceData, setResourceData] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);

  const storageKey = "orca_resource_days";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setResourceData(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load resource data:", error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const teamMembers: TeamMember[] = project.teamMembers || [];

  const toDateKey = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: mounted is intentional to force re-render after browser compositing
  const { validDates, dateToStageId } = useMemo(() => {
    const valid = new Set<string>();
    const stageMap = new Map<string, string>();

    const fmt = (d: Date): string =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    for (const stage of stages) {
      if (!stage.startDate || !stage.endDate) continue;

      const startStr = stage.startDate.substring(0, 10);
      const endStr = stage.endDate.substring(0, 10);

      const [sy, sm, sd] = startStr.split("-").map(Number);
      const [ey, em, ed] = endStr.split("-").map(Number);

      const cursor = new Date(sy, sm - 1, sd);
      const endDate = new Date(ey, em - 1, ed);

      while (cursor <= endDate) {
        const key = fmt(cursor);
        valid.add(key);
        if (!stageMap.has(key)) {
          stageMap.set(key, stage.id);
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return { validDates: valid, dateToStageId: stageMap };
  }, [stages, mounted]);

  const getColor = (total: number): string => {
    if (total <= 0) return "#ffffff";
    if (total <= 0.5) return "#d4edda";
    if (total <= 1.0) return "#b7e4c7";
    if (total <= 1.5) return "#fff3cd";
    return "#f8d7da";
  };

  const handleChange = (
    memberId: string,
    dateKey: string,
    stageId: string,
    value: string,
  ) => {
    const key = `${project.id}:${stageId}:${memberId}:${dateKey}`;
    const num = Number.parseFloat(value);

    const newData = { ...resourceData };
    if (Number.isNaN(num) || num <= 0 || value === "") {
      delete newData[key];
    } else {
      newData[key] = num;
    }

    localStorage.setItem(storageKey, JSON.stringify(newData));
    setResourceData(newData);
  };

  const getValue = (
    memberId: string,
    dateKey: string,
    stageId: string,
  ): number => {
    const key = `${project.id}:${stageId}:${memberId}:${dateKey}`;
    return resourceData[key] || 0;
  };

  const getAggregate = (memberId: string, dateKey: string): number => {
    let total = 0;
    for (const [key, val] of Object.entries(resourceData)) {
      if (key.endsWith(`:${memberId}:${dateKey}`)) {
        total += val;
      }
    }
    return total;
  };

  if (teamMembers.length === 0) {
    return (
      <div
        style={{
          width: "200px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          backgroundColor: "#f9fafb",
          borderLeft: "1px solid #e5e7eb",
        }}
      >
        <p className="text-sm text-gray-600 text-center">
          Add team members to plan resources
        </p>
      </div>
    );
  }

  const COL_W = 60;

  return (
    <div style={{ width: `${teamMembers.length * COL_W}px`, flexShrink: 0 }}>
      {/* Sticky header row with user initials - inside the grid so alignment is guaranteed */}
      <div
        style={{
          display: "flex",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          height: "40px",
        }}
      >
        {teamMembers.map((member) => (
          <div
            key={member.id}
            style={{
              width: `${COL_W}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: member.avatarColor }}
            >
              {member.initials}
            </div>
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {allDates.map((date) => {
        const dateKey = toDateKey(date);
        const isInRange = validDates.has(dateKey);
        const stageId = dateToStageId.get(dateKey) || "";

        return (
          <div
            key={dateKey}
            style={{
              display: "flex",
              height: `${DAY_HEIGHT}px`,
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            {teamMembers.map((member, mi) => {
              const val = isInRange ? getValue(member.id, dateKey, stageId) : 0;
              const agg = isInRange ? getAggregate(member.id, dateKey) : 0;
              const total = Math.max(val, agg);
              const bg = isInRange ? getColor(total) : "#f0f0f0";

              return (
                <div
                  key={member.id}
                  style={{
                    width: `${COL_W}px`,
                    backgroundColor: bg,
                    borderRight:
                      mi < teamMembers.length - 1
                        ? "1px solid #e5e7eb"
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1px",
                  }}
                >
                  {isInRange && (
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={val || ""}
                      onChange={(e) =>
                        handleChange(
                          member.id,
                          dateKey,
                          stageId,
                          e.target.value,
                        )
                      }
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "center",
                        fontSize: "11px",
                        outline: "none",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
