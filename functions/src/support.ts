/**
 * Support Center and app feedback.
 *
 * Clients cannot write these collections at all (firestore.rules); every write goes through a callable here so the
 * sender's role is decided by the server (nobody can post as "Pet Maya Support"), spam is rate limited, and the
 * ticket's bookkeeping (status, unread flags, message count) stays consistent.
 *
 *  support_submit_ticket — a user opens a ticket (support_tickets/{id}).
 *  support_reply         — the ticket's owner or support staff adds a message (support_tickets/{id}/messages/{id}).
 *  support_set_status    — staff set Open / In progress / Resolved.
 *  support_mark_read     — clears the caller's unread flag on a ticket.
 *  submit_app_feedback   — star rating + comment (app_feedback/{id}).
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { clip, isAdminRole, rateLimit, requireUser } from "./security";

export const TICKET_CATEGORIES = ["Order", "Delivery", "Payment", "Account", "Points & rewards", "Vet booking", "App problem", "Other"];
export const FEEDBACK_CATEGORIES = ["Bug", "Idea", "Praise", "Other"];
export const TICKET_STATUSES = ["open", "in_progress", "resolved"];
export const MAX_MESSAGES_PER_TICKET = 200;

/** Support staff: admins and managers. */
export function isSupportStaff(profile: Record<string, any>): boolean {
  return isAdminRole(profile.role) || profile.staffRole === "Manager";
}

/**
 * A ticket photo must be one of the caller's own uploads (support/{uid}/…) in this project's storage: an https
 * Firebase Storage URL whose object path starts with the caller's folder. Anything else is dropped.
 */
export function cleanSupportImageUrl(uid: string, raw: unknown): string {
  const url = typeof raw === "string" ? raw.trim() : "";
  if (!url || url.length > 800) return "";
  const m = url.match(/^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?]+)/);
  if (!m) return "";
  let path = "";
  try { path = decodeURIComponent(m[1]); } catch { return ""; }
  return path.startsWith(`support/${uid}/`) && !path.includes("..") ? url : "";
}

export interface TicketInput { subject: string; category: string; message: string; orderNumber: string }

/** Validates and trims a new ticket; throws HttpsError with a message the user can act on. */
export function cleanTicketInput(data: Record<string, any>): TicketInput {
  const subject = clip(data?.subject, 100).trim();
  const message = clip(data?.message, 2000).trim();
  const category = TICKET_CATEGORIES.includes(data?.category) ? data.category : "Other";
  if (subject.length < 3) throw new HttpsError("invalid-argument", "Please add a short subject (at least 3 characters).");
  if (message.length < 10) throw new HttpsError("invalid-argument", "Please describe the problem in a little more detail (at least 10 characters).");
  return { subject, category, message, orderNumber: clip(data?.orderNumber, 40).trim() };
}

/** Status after a new message: a user's reply reopens a resolved ticket; the first staff reply moves open -> in progress. */
export function statusAfterMessage(current: string, sender: "user" | "staff"): string {
  if (sender === "user") return current === "resolved" ? "open" : current;
  return current === "open" ? "in_progress" : current;
}

function notificationFor(title: string, message: string, ticketId: string) {
  // Both notification shapes (see CLAUDE.md): app {id,title,message,type,isRead,timestamp}, server/web {title,body,category,url,timestamp}.
  return {
    title, message, body: message,
    type: "support", category: "support",
    url: "", ticketId,
    timestamp: Date.now(), isRead: false, read: false,
  };
}

const db = () => admin.firestore();

export const support_submit_ticket = onCall(async (request) => {
  const { uid, profile } = await requireUser(request);
  await rateLimit("support_ticket", uid, [{ limit: 5, seconds: 3600 }, { limit: 15, seconds: 86400 }]);

  const input = cleanTicketInput(request.data ?? {});
  const now = Date.now();
  const ref = db().collection("support_tickets").doc();
  await ref.set({
    ownerID: uid,
    ownerName: clip(profile.name, 80),
    ownerEmail: clip(profile.email, 120),
    ownerPhone: clip(profile.phone, 30),
    ...input,
    imageUrl: cleanSupportImageUrl(uid, request.data?.imageUrl),
    status: "open",
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    lastMessageBy: "user",
    messageCount: 0,
    unreadForUser: false,
    unreadForStaff: true,
    appVersion: clip(request.data?.appVersion, 20),
    platform: clip(request.data?.platform, 20),
  });
  return { id: ref.id };
});

export const support_reply = onCall(async (request) => {
  const { uid, profile } = await requireUser(request);
  await rateLimit("support_reply", uid, [{ limit: 30, seconds: 3600 }]);

  const ticketId = clip(request.data?.ticketId, 60);
  const text = clip(request.data?.text, 2000).trim();
  if (!ticketId) throw new HttpsError("invalid-argument", "ticketId is required");
  if (!text) throw new HttpsError("invalid-argument", "Write a message first.");

  const ticketRef = db().collection("support_tickets").doc(ticketId);
  const staff = isSupportStaff(profile);
  const owner = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ticketRef);
    const t = snap.data();
    if (!snap.exists || !t) throw new HttpsError("not-found", "That ticket no longer exists.");
    if (!staff && t.ownerID !== uid) throw new HttpsError("permission-denied", "This is not your ticket.");
    if ((t.messageCount ?? 0) >= MAX_MESSAGES_PER_TICKET) {
      throw new HttpsError("resource-exhausted", "This conversation is full. Please open a new ticket.");
    }
    const sender = staff && t.ownerID !== uid ? "staff" : "user";
    const now = Date.now();
    tx.set(ticketRef.collection("messages").doc(), {
      senderID: uid,
      senderRole: sender,
      senderName: sender === "staff" ? "Pet Maya Support" : clip(profile.name, 80) || "You",
      text,
      createdAt: now,
    });
    tx.update(ticketRef, {
      status: statusAfterMessage(String(t.status || "open"), sender),
      lastMessageAt: now,
      lastMessageBy: sender,
      updatedAt: now,
      messageCount: admin.firestore.FieldValue.increment(1),
      unreadForUser: sender === "staff",
      unreadForStaff: sender === "user",
    });
    if (sender === "staff") {
      tx.set(db().collection("notifications").doc(String(t.ownerID)).collection("items").doc(),
        notificationFor("💬 Pet Maya Support replied", `Re: ${clip(t.subject, 60)} — ${clip(text, 120)}`, ticketId));
    }
    return String(t.ownerID);
  });
  return { ok: true, owner };
});

export const support_set_status = onCall(async (request) => {
  const { profile } = await requireUser(request);
  if (!isSupportStaff(profile)) throw new HttpsError("permission-denied", "Manager or Admin role required.");
  const ticketId = clip(request.data?.ticketId, 60);
  const status = String(request.data?.status ?? "");
  if (!ticketId || !TICKET_STATUSES.includes(status)) throw new HttpsError("invalid-argument", "ticketId and a valid status are required.");

  const ticketRef = db().collection("support_tickets").doc(ticketId);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ticketRef);
    const t = snap.data();
    if (!snap.exists || !t) throw new HttpsError("not-found", "That ticket no longer exists.");
    if (t.status === status) return;
    tx.update(ticketRef, { status, updatedAt: Date.now() });
    if (status === "resolved") {
      tx.set(db().collection("notifications").doc(String(t.ownerID)).collection("items").doc(),
        notificationFor("✅ Support ticket resolved", `“${clip(t.subject, 80)}” was marked resolved. Reply in the ticket if you still need help.`, ticketId));
    }
  });
  return { ok: true };
});

export const support_mark_read = onCall(async (request) => {
  const { uid, profile } = await requireUser(request);
  const ticketId = clip(request.data?.ticketId, 60);
  if (!ticketId) throw new HttpsError("invalid-argument", "ticketId is required");
  const ref = db().collection("support_tickets").doc(ticketId);
  const t = (await ref.get()).data();
  if (!t) return { ok: true };
  if (t.ownerID === uid) {
    if (t.unreadForUser) await ref.update({ unreadForUser: false });
  } else if (isSupportStaff(profile)) {
    if (t.unreadForStaff) await ref.update({ unreadForStaff: false });
  } else {
    throw new HttpsError("permission-denied", "This is not your ticket.");
  }
  return { ok: true };
});

export const submit_app_feedback = onCall(async (request) => {
  const { uid, profile } = await requireUser(request);
  await rateLimit("app_feedback", uid, [{ limit: 5, seconds: 86400 }]);

  const rating = Math.round(Number(request.data?.rating));
  if (!(rating >= 1 && rating <= 5)) throw new HttpsError("invalid-argument", "Please choose a rating from 1 to 5 stars.");
  const category = FEEDBACK_CATEGORIES.includes(request.data?.category) ? request.data.category : "Other";
  const message = clip(request.data?.message, 1000).trim();
  if (rating <= 3 && message.length < 5) {
    throw new HttpsError("invalid-argument", "Please tell us briefly what went wrong so we can fix it.");
  }
  const ref = db().collection("app_feedback").doc();
  await ref.set({
    ownerID: uid,
    ownerName: clip(profile.name, 80),
    ownerEmail: clip(profile.email, 120),
    rating, category, message,
    appVersion: clip(request.data?.appVersion, 20),
    platform: clip(request.data?.platform, 20),
    createdAt: Date.now(),
  });
  return { id: ref.id };
});
