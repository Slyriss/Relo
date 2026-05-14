import { env } from "@/lib/env";

export function getSupabasePublicKey() {
  return env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabasePublicConfig() {
  const key = getSupabasePublicKey();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !key) return null;
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key,
  };
}

export function isDemoMode() {
  return env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function isProductionDataMode() {
  return !isDemoMode() && Boolean(getSupabasePublicConfig());
}
