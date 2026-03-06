import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useStableIdentity } from "../hooks/useStableIdentity";

export function LoginPage() {
  const { login, isInitializing, isLoggingIn } = useStableIdentity();
  const isLoading = isInitializing || isLoggingIn;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 max-w-md w-full px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-5xl font-bold text-foreground">ORCA</h1>
          <p className="text-muted-foreground text-center">
            Project Management Platform
          </p>
        </div>

        {/* Login card */}
        <div className="w-full bg-card border border-border rounded-xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Welcome back
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in securely with Internet Identity to access your workspace.
            </p>
          </div>

          {isLoading ? (
            <div
              data-ocid="login.loading_state"
              className="flex flex-col items-center gap-3 py-4"
            >
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                {isInitializing
                  ? "Initializing..."
                  : "Opening Internet Identity..."}
              </p>
            </div>
          ) : (
            <Button
              data-ocid="login.primary_button"
              onClick={login}
              className="w-full"
              size="lg"
            >
              Sign in with Internet Identity
            </Button>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center">
          Sign in securely using Internet Identity to access your projects and
          collaborate with your team.
        </p>
      </div>
    </div>
  );
}
