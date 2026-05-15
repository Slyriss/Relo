"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog";
import { registerServiceWorker } from "@/lib/pwa";
import { useAppStore } from "@/lib/store";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function Providers({ children }: { children: React.ReactNode }) {
  const refreshWorkspace = useAppStore((state) => state.refreshWorkspace);

  useEffect(() => {
    initPostHog();
    registerServiceWorker();
    void refreshWorkspace();

    const supabase = createSupabaseBrowserClient();
    const subscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void refreshWorkspace();
      }
      if (event === "SIGNED_OUT") {
        useAppStore.setState({
          user: null,
          organization: null,
          events: [],
          attendees: [],
          meetings: [],
          meetingRequests: [],
          checkIns: [],
        });
      }
    }).data.subscription;

    return () => subscription?.unsubscribe();
  }, [refreshWorkspace]);

  return <>{children}</>;
}
