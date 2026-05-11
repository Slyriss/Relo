"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog";
import { registerServiceWorker } from "@/lib/pwa";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
    registerServiceWorker();
  }, []);

  return <>{children}</>;
}
