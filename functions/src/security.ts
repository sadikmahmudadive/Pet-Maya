/**
 * Shared guards for callable functions: authentication, suspension, per-user
 * rate limits and input validation. Pure helpers are exported for unit tests.
 */
import { HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

export const ADMIN_ROLES = ["Admin", "admin", "superAdmin", "Super Admin"];

export function isAdminRole(role: unknown): boolean {
  return typeof role === "string" && ADMIN_ROLES.includes(role);
}

/** Signed-in, non-suspended caller; returns uid and profile data. */
export async function requireUser(request: CallableRequest<any>) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required");
  const uid = request.auth.uid;
  const profile = (await admin.firestore().collection("users").doc(uid).get()).data() ?? {};
  if (profile.isSuspended === true) throw new HttpsError("permission-denied", "Account suspended");
  return { uid, profile };
}

export interface Window { limit: number; seconds: number }

/**
 * Fixed-window counters, one per window, in rate_limits/{key}:{uid}.
 * Pure part: decides whether a call fits and returns the new state.
 */
export function nextWindowState(
  state: Record<string, { start: number; count: number }> | undefined,
  windows: Window[],
  nowMs: number,
): { allowed: boolean; retryAfterS: number; state: Record<string, { start: number; count: number }> } {
  const next: Record<string, { start: number; count: number }> = {};
  let retryAfterS = 0;
  for (const w of windows) {
    const k = String(w.seconds);
    const cur = state?.[k];
    const fresh = !cur || nowMs - cur.start >= w.seconds * 1000;
    const start = fresh ? nowMs : cur!.start;
    const count = fresh ? 0 : cur!.count;
    if (count + 1 > w.limit) {
      retryAfterS = Math.max(retryAfterS, Math.ceil((start + w.seconds * 1000 - nowMs) / 1000));
    }
    next[k] = { start, count: count + 1 };
  }
  return { allowed: retryAfterS === 0, retryAfterS, state: retryAfterS === 0 ? next : (state ?? {}) };
}

/** Throws resource-exhausted when the caller exceeds any window. */
export async function rateLimit(key: string, uid: string, windows: Window[]): Promise<void> {
  const db = admin.firestore();
  const ref = db.collection("rate_limits").doc(`${key}:${uid}`);
  const verdict = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const res = nextWindowState(snap.data()?.windows, windows, Date.now());
    if (res.allowed) {
      tx.set(ref, {
        windows: res.state,
        updatedAt: Date.now(),
        // Firestore TTL policy on `expireAt` cleans old counters up.
        expireAt: admin.firestore.Timestamp.fromMillis(Date.now() + 2 * 24 * 3600 * 1000),
      });
    }
    return res;
  });
  if (!verdict.allowed) {
    throw new HttpsError("resource-exhausted", `Too many requests. Try again in ${verdict.retryAfterS}s.`);
  }
}

/** Trimmed string clipped to max, "" for non-strings. */
export function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Validates a base64 image from the client and returns its real MIME type
 * (from magic bytes, never from the client), or throws invalid-argument.
 * Only raw base64 is accepted: data URLs, http(s) URLs and other schemes are
 * rejected so the AI provider is never asked to fetch an attacker-chosen URL.
 */
export function validateBase64Image(value: unknown): { base64: string; mime: string } {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpsError("invalid-argument", "Image is required");
  }
  const b64 = value.replace(/\s+/g, "");
  if (b64.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 4) {
    throw new HttpsError("invalid-argument", "Image is too large (max 4 MB)");
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) {
    throw new HttpsError("invalid-argument", "Image must be base64 encoded");
  }
  const head = Buffer.from(b64.slice(0, 32), "base64");
  const mime = sniffImageMime(head);
  if (!mime) throw new HttpsError("invalid-argument", "Only JPEG, PNG or WebP images are supported");
  return { base64: b64, mime };
}

export function sniffImageMime(head: Buffer): string | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head.length >= 8 && head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (head.length >= 12 && head.subarray(0, 4).toString("ascii") === "RIFF" &&
      head.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

/**
 * Links inside notifications may only point into the app/site. Anything else
 * (javascript:, data:, //evil.com, https://phish…) becomes "/".
 */
export function safeInternalLink(value: unknown): string {
  const s = clip(value, 300);
  return /^\/(?![\/\\])[\w\-./?=&%#:+~]*$/.test(s) ? s : "/";
}
