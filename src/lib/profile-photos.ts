import type { SupabaseClient } from "@supabase/supabase-js";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import type { Database } from "@/types/database";

export const PROFILE_PHOTO_BUCKET = "profile-photos";
const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const BLOCKED_PHOTO_HOSTS = ["linkedin.com", "www.linkedin.com", "media.licdn.com", "licdn.com", "lnkd.in"];

export type ProfilePhotoOwner = {
  type: "attendee" | "user";
  id: string;
};

export function validateProfilePhotoSource(rawUrl: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "Photo URL is invalid." };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, reason: "Photo URL must use http or https." };
  }

  const host = url.hostname.toLowerCase();
  if (BLOCKED_PHOTO_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) {
    return {
      ok: false,
      reason: "LinkedIn-hosted profile photos are not imported. Use a consented upload, an approved API/provider, or a public image URL you have permission to store.",
    };
  }

  if (host === "localhost" || isPrivateAddress(host)) {
    return { ok: false, reason: "Private network photo URLs are not allowed." };
  }

  return { ok: true, url };
}

function isPrivateAddress(hostOrAddress: string) {
  if (!isIP(hostOrAddress)) return false;
  if (hostOrAddress === "0.0.0.0" || hostOrAddress === "127.0.0.1" || hostOrAddress === "::1") return true;
  if (hostOrAddress.startsWith("10.") || hostOrAddress.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostOrAddress)) return true;
  if (hostOrAddress.startsWith("169.254.")) return true;
  if (hostOrAddress.toLowerCase().startsWith("fc") || hostOrAddress.toLowerCase().startsWith("fd")) return true;
  return false;
}

async function assertPublicDnsTarget(url: URL) {
  if (isIP(url.hostname)) {
    if (isPrivateAddress(url.hostname)) throw new Error("Private network photo URLs are not allowed.");
    return;
  }

  const records = await lookup(url.hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => isPrivateAddress(record.address))) {
    throw new Error("Photo URL resolves to a private network address.");
  }
}

export function profilePhotoPath(owner: ProfilePhotoOwner, contentType: string) {
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  return `${owner.type}/${owner.id}/${Date.now()}.${ext}`;
}

export async function storeProfilePhotoFromUrl(
  client: SupabaseClient<Database>,
  rawUrl: string,
  owner: ProfilePhotoOwner
) {
  const validated = validateProfilePhotoSource(rawUrl);
  if (!validated.ok) throw new Error(validated.reason);
  await assertPublicDnsTarget(validated.url);

  const response = await fetch(validated.url, {
    headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8" },
    redirect: "manual",
  });
  if (response.status >= 300 && response.status < 400) throw new Error("Redirecting profile photo URLs are not allowed.");
  if (!response.ok) throw new Error(`Could not fetch profile photo: ${response.status}`);

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) throw new Error("URL did not return an image.");

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_PROFILE_PHOTO_BYTES) throw new Error("Profile photo is larger than 5MB.");

  const path = profilePhotoPath(owner, contentType);
  const { error } = await client.storage.from(PROFILE_PHOTO_BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  const { data } = client.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
