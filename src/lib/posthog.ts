"use client";

type PostHogClient = typeof import("posthog-js").default;

let initialized = false;
let client: PostHogClient | null = null;

export async function initPostHog() {
  if (initialized || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  const posthog = (await import("posthog-js")).default;
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: true
  });
  client = posthog;
  initialized = true;
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  client?.capture(event, properties);
}
