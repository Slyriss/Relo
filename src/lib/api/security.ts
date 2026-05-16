import { NextResponse } from "next/server";
import { env } from "@/lib/env";

type LimitWindow = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, LimitWindow>();

export class RequestBodyError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const requestOrigin = new URL(request.url).origin;
  const allowed = new Set([requestOrigin, env.NEXT_PUBLIC_APP_URL]);
  const requestUrl = new URL(requestOrigin);
  if (requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1") {
    const port = requestUrl.port ? `:${requestUrl.port}` : "";
    allowed.add(`${requestUrl.protocol}//localhost${port}`);
    allowed.add(`${requestUrl.protocol}//127.0.0.1${port}`);
  }
  if (!allowed.has(origin)) {
    return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
  }

  return null;
}

export function rateLimit(request: Request, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucketKey = `${key}:${clientIp(request)}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  current.count += 1;
  return null;
}

export function guardPost(request: Request, key: string, limit = 30, windowMs = 60_000) {
  return assertSameOrigin(request) ?? rateLimit(request, key, limit, windowMs);
}

export async function readJsonBody(request: Request, maxBytes = 64_000) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) throw new RequestBodyError("Request body is too large", 413);

  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > maxBytes) {
      throw new RequestBodyError("Request body is too large", 413);
    }
    chunks.push(value);
  }

  try {
    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new RequestBodyError("Invalid JSON", 400);
  }
}
