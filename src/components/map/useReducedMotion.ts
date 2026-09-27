import { useSyncExternalStore } from "react";

const query = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

const subscribe = (onChange: () => void) => {
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
};

/** Live `prefers-reduced-motion: reduce`, so toggling the OS setting applies without a reload. */
export const useReducedMotion = () => useSyncExternalStore(subscribe, () => query?.matches ?? false, () => false);
