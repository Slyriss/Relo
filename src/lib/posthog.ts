"use client";

import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: true
  });
  initialized = true;
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}
