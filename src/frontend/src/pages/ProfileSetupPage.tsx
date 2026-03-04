import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useProfile } from "../hooks/useProfile";
import { useStableActor } from "../hooks/useStableActor";

export function ProfileSetupPage() {
  const { actor } = useStableActor();
  const { refetchProfile } = useProfile();

  const [formData, setFormData] = useState({
    fullName: "",
    jobTitle: "",
    department: "",
    bio: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setError(null);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!actor) {
      setError("Not connected. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const profileJson = JSON.stringify({
        fullName: formData.fullName.trim(),
        jobTitle: formData.jobTitle.trim(),
        department: formData.department.trim(),
        bio: formData.bio.trim(),
        createdAt: new Date().toISOString(),
      });

      const result = await actor.saveCallerUserProfile(profileJson);
      if ("err" in result) {
        setError(result.err);
        return;
      }

      setSuccess(true);
      await refetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.72 0.18 200 / 0.05) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg mx-4 relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Set up your profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Let's get to know you. This information helps your team collaborate
            better.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-card-dark">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Profile saved!
              </h3>
              <p className="text-muted-foreground text-sm">
                Loading your workspace...
              </p>
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin mx-auto mt-4" />
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  data-ocid="profile_setup.name_input"
                  value={formData.fullName}
                  onChange={handleChange("fullName")}
                  placeholder="Alex Chen"
                  className="bg-input/50 border-border focus:border-primary/50"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="text-sm font-medium">
                  Job Title
                </Label>
                <Input
                  id="jobTitle"
                  data-ocid="profile_setup.title_input"
                  value={formData.jobTitle}
                  onChange={handleChange("jobTitle")}
                  placeholder="Product Manager"
                  className="bg-input/50 border-border focus:border-primary/50"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">
                  Department
                </Label>
                <Input
                  id="department"
                  data-ocid="profile_setup.department_input"
                  value={formData.department}
                  onChange={handleChange("department")}
                  placeholder="Engineering"
                  className="bg-input/50 border-border focus:border-primary/50"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  data-ocid="profile_setup.bio_textarea"
                  value={formData.bio}
                  onChange={handleChange("bio")}
                  placeholder="Tell your team a bit about yourself..."
                  className="bg-input/50 border-border focus:border-primary/50 resize-none"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <motion.div
                  data-ocid="profile_setup.error_state"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <span className="text-sm text-destructive">{error}</span>
                </motion.div>
              )}

              {isSubmitting && (
                <div
                  data-ocid="profile_setup.loading_state"
                  className="flex items-center gap-2 text-muted-foreground text-sm"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving profile...
                </div>
              )}

              <Button
                data-ocid="profile_setup.submit_button"
                type="submit"
                className="w-full h-11 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Continue to ORCA"
                )}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
