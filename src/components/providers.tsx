"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog";
import { registerServiceWorker } from "@/lib/pwa";
import { useAppStore } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const refreshWorkspace = useAppStore((state) => state.refreshWorkspace);

  useEffect(() => {
    initPostHog();
    registerServiceWorker();
    void refreshWorkspace();
  }, [refreshWorkspace]);

  return <>{children}</>;
}
