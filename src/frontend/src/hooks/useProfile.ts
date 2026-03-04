import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useStableActor } from "./useStableActor";

export function useProfile() {
  const { actor, isFetching } = useStableActor();
  const [fallbackTriggered, setFallbackTriggered] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    const timer = setTimeout(() => setFallbackTriggered(true), 5000);
    return () => clearTimeout(timer);
  }, [actor, isFetching]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["callerUserProfile", actor ? "authenticated" : "none"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await actor.getCallerUserProfile();
      if ("err" in result) return null; // profile not found = null
      return result.ok;
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });

  return {
    profile: data ?? null,
    profileLoading: isLoading && !fallbackTriggered,
    profileError: error,
    refetchProfile: refetch,
  };
}
