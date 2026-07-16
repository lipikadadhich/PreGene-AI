import { useEffect, useState } from "react";

/**
 * Simulates the loading phase of a future API call so skeleton states can be
 * built and previewed now. Swap the `setTimeout` for a real fetch/query when
 * the backend is ready — components consuming this hook won't need changes.
 */
export function useMockLoading(delayMs = 700): boolean {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return isLoading;
}
