import PermissionsConfig from "@/components/settings/PermissionsConfig";
import type { AppRole } from "@/types";
import { Shield } from "lucide-react";
import { useState } from "react";

interface SettingsPageProps {
  currentUserRole: AppRole;
}

export default function SettingsPage({ currentUserRole }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState("permissions");
  const tabs = [{ id: "permissions", label: "Permissions", icon: Shield }];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-6 py-3 border-b bg-card flex-shrink-0">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            data-ocid={`settings.${tab.id}.tab`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "permissions" && (
          <PermissionsConfig currentUserRole={currentUserRole} />
        )}
      </div>
    </div>
  );
}
