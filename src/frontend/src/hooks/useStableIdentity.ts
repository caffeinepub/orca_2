import { useRef } from "react";
import { useInternetIdentity } from "./useInternetIdentity";
import type { InternetIdentityContext } from "./useInternetIdentity";

export function useStableIdentity(): InternetIdentityContext {
  const result = useInternetIdentity();
  const stableRef = useRef<InternetIdentityContext>(result);

  // Only update ref when identity principal changes or loginStatus changes
  const currentPrincipal = result.identity?.getPrincipal().toString();
  const refPrincipal = stableRef.current.identity?.getPrincipal().toString();

  if (
    currentPrincipal !== refPrincipal ||
    result.loginStatus !== stableRef.current.loginStatus
  ) {
    stableRef.current = result;
  }

  return stableRef.current;
}
