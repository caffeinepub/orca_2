import { Button } from "@/components/ui/button";
import { Loader2, Shield, Waves } from "lucide-react";
import { motion } from "motion/react";
import { useStableIdentity } from "../hooks/useStableIdentity";

export function LoginPage() {
  const { login, isInitializing, isLoggingIn } = useStableIdentity();
  const isLoading = isInitializing || isLoggingIn;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background atmospheric layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.72 0.18 200 / 0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 80% 80%, oklch(0.65 0.17 160 / 0.04) 0%, transparent 60%)",
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(oklch(0.72 0.18 200) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.72 0.18 200) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Decorative wave lines */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none overflow-hidden opacity-10">
        <Waves className="w-full h-full text-primary" strokeWidth={0.5} />
      </div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6 glow-primary">
            <span className="text-2xl font-display font-black text-primary tracking-tighter">
              O
            </span>
          </div>
          <h1 className="text-5xl font-display font-black tracking-tight text-foreground text-glow mb-2">
            ORCA
          </h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase font-medium">
            Project Management Platform
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-8 shadow-card-dark"
        >
          <div className="mb-6">
            <h2 className="text-lg font-display font-semibold text-foreground mb-1">
              Welcome back
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in securely with Internet Identity to access your workspace.
            </p>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 mb-6 p-3 bg-primary/5 border border-primary/15 rounded-lg">
            <Shield className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground">
              Decentralized authentication — your keys, your identity
            </span>
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
              className="w-full h-11 font-semibold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 glow-primary"
              size="lg"
            >
              Sign in with Internet Identity
            </Button>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-primary/70 hover:text-primary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
