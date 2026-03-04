import { useRef } from "react";
import { useActor } from "./useActor";

export function useStableActor() {
  const hasInvalidatedRef = useRef(false);
  const { actor, isFetching } = useActor();

  // Reset invalidation flag when actor is no longer fetching
  if (!isFetching) {
    hasInvalidatedRef.current = false;
  }

  return { actor, isFetching, hasInvalidatedRef };
}
