import type { AppRole, Feature } from "@/types";
import {
  FEATURE_CATEGORIES,
  FEATURE_LABELS,
  type PermissionsConfig as PConfig,
  loadPermissionsConfig,
  savePermissionsConfig,
} from "@/utils/permissions";
import { Check, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  currentUserRole: AppRole;
}

export default function PermissionsConfig({ currentUserRole }: Props) {
  const [config, setConfig] = useState<PConfig>(loadPermissionsConfig);
  const editableRoles: AppRole[] = ["Admin", "Standard", "Freelancer"];
  const canEdit = currentUserRole === "Super Admin";

  useEffect(() => {
    savePermissionsConfig(config);
  }, [config]);

  const toggle = (role: AppRole, feature: Feature) => {
    if (!canEdit || role === "Super Admin") return;
    setConfig((prev) => {
      const current = prev[role] || [];
      const has = current.includes(feature);
      return {
        ...prev,
        [role]: has
          ? current.filter((f) => f !== feature)
          : [...current, feature],
      };
    });
  };

  const resetToDefaults = () => {
    if (!confirm("Reset all permissions to defaults?")) return;
    localStorage.removeItem("orca_permissions_config");
    setConfig(loadPermissionsConfig());
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold">Feature Permissions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control which features each role can access. Super Admin always has
            full access.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            data-ocid="permissions.reset.button"
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border rounded hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <table
          className="w-full text-sm border-collapse"
          data-ocid="permissions.table"
        >
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-foreground min-w-[220px]">
                Feature
              </th>
              {editableRoles.map((role) => (
                <th
                  key={role}
                  className="text-center px-4 py-3 font-semibold text-foreground min-w-[100px]"
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_CATEGORIES.map((cat) => (
              <>
                <tr key={cat.label}>
                  <td
                    colSpan={editableRoles.length + 1}
                    className="px-6 py-2 bg-primary/5 text-[10px] font-bold text-primary uppercase tracking-wide border-y"
                  >
                    {cat.label}
                  </td>
                </tr>
                {cat.features.map((feature) => (
                  <tr key={feature} className="border-b hover:bg-muted/30">
                    <td className="px-6 py-2.5 text-foreground">
                      {FEATURE_LABELS[feature]}
                    </td>
                    {editableRoles.map((role) => {
                      const has = config[role]?.includes(feature) ?? false;
                      return (
                        <td key={role} className="text-center px-4 py-2.5">
                          {canEdit ? (
                            <button
                              type="button"
                              data-ocid="permissions.toggle"
                              onClick={() => toggle(role, feature)}
                              className={`w-6 h-6 rounded border mx-auto flex items-center justify-center transition-colors ${has ? "bg-green-100 border-green-400" : "bg-background border-border hover:border-muted-foreground"}`}
                            >
                              {has && (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              )}
                            </button>
                          ) : has ? (
                            <Check className="w-3.5 h-3.5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
      {!canEdit && (
        <div className="px-6 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
          Only Super Admins can modify feature permissions.
        </div>
      )}
    </div>
  );
}
