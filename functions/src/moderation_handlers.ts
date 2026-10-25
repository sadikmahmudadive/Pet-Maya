/**
 * Cloud Functions handlers for Community Moderation:
 * - submit_post (Callable): Moderates and creates/edits posts
 * - submit_comment (Callable): Moderates and adds comments
 * - report_content (Callable): User-submitted content reports
 * - moderation_decide (Callable): Admin/Manager approval/rejection queue
 * - backfill_moderation (Callable): One-off admin audit of existing posts
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import {
  clip,
  isAdminRole,
  rateLimit,
  requireUser,
  sniffImageMime,
  validateBase64Image,
} from "./security";
import {
  addStrike,
  allowsContact,
  MESSAGES,
  ModerationItem,
  runModeration,
  WordLists,
} from "./moderation";
import { createRelevanceChecker, createSafetyChecker } from "./moderation_ai";

/**
 * Extracts storage path from Firebase Storage URL or relative path,
 * verifying it belongs to the authenticated user.
 */
async function getImageFromPathOrUrl(
  uid: string,
  rawPathOrUrl?: string,
  rawBase64?: string
): Promise<{ base64: string; mime: string } | null> {
  if (rawBase64) {
    try {
      return validateBase64Image(rawBase64);
    } catch {
      return null;
    }
  }

  if (!rawPathOrUrl || typeof rawPathOrUrl !== "string") return null;

  let storagePath = "";
  if (rawPathOrUrl.startsWith("http")) {
    const match = rawPathOrUrl.match(/\/o\/([^?]+)/);
    if (match && match[1]) {
      storagePath = decodeURIComponent(match[1]);
    }
  } else {
    storagePath = rawPathOrUrl.replace(/^\//, "");
  }

  // Verify the image belongs to the caller's folder
  const allowedPrefixes = [`community_posts/${uid}/`, `community_images/${uid}/`];
  const isOwner = allowedPrefixes.some((p) => storagePath.startsWith(p));
  if (!isOwner) {
    return null;
  }

  try {
    const bucket = admin.storage().bucket();
    const [fileBuffer] = await bucket.file(storagePath).download();
    if (!fileBuffer || fileBuffer.length === 0 || fileBuffer.length > 5 * 1024 * 1024) {
      return null;
    }
    const mime = sniffImageMime(fileBuffer) || "image/jpeg";
    return {
      base64: fileBuffer.toString("base64"),
      mime,
    };
  } catch (err) {
    console.warn(`[Moderation] Could not download image ${storagePath} for moderation:`, err);
    return null;
  }
}

/**
 * Loads dynamic word lists and layer toggles from settings/moderation.
 */
async function getDynamicModerationSettings(): Promise<{
  lists: Partial<WordLists>;
  layers: { words?: boolean; rules?: boolean; safety?: boolean; relevance?: boolean };
}> {
  try {
    const snap = await admin.firestore().collection("settings").doc("moderation").get();
    if (!snap.exists) return { lists: {}, layers: {} };
    const data = snap.data() || {};
    return {
      lists: {
        hard: Array.isArray(data.blockedWords) ? data.blockedWords : [],
        soft: Array.isArray(data.softWords) ? data.softWords : [],
        allow: Array.isArray(data.allowedWords) ? data.allowedWords : [],
      },
      layers: {
        words: data.enableWords !== false,
        rules: data.enableRules !== false,
        safety: data.enableSafety !== false,
        relevance: data.enableRelevance !== false,
      },
    };
  } catch (e) {
    console.error("[Moderation] Error loading settings/moderation:", e);
    return { lists: {}, layers: {} };
  }
}

/**
 * Handles adding strikes and suspending user from posting for 7 days if >= 3 strikes.
 */
async function handleUserStrike(
  uid: string,
  reasonCode: string,
  detail: string
): Promise<{ strikesCount: number; suspendedUntil: number | null }> {
  const db = admin.firestore();
  const strikeRef = db.collection("moderation_strikes").doc(uid);
  const now = Date.now();

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(strikeRef);
    const existing = snap.data()?.strikes as number[] | undefined;
    const { strikes, suspendUntil } = addStrike(existing, now);

    tx.set(
      strikeRef,
      {
        strikes,
        lastStrikeAt: now,
        lastReason: reasonCode,
        lastDetail: detail,
        updatedAt: now,
      },
      { merge: true }
    );

    if (suspendUntil) {
      tx.update(db.collection("users").doc(uid), {
        postingSuspendedUntil: suspendUntil,
      });

      // Send in-app notification about suspension
      tx.set(db.collection("notifications").doc(uid).collection("items").doc(), {
        title: "Community Guidelines Notice",
        message:
          "Your posting and commenting privileges have been suspended for 7 days due to repeated community guidelines violations.",
        body:
          "Your posting privileges are paused until " +
          new Date(suspendUntil).toLocaleDateString() +
          ". Pet Maya is dedicated to keeping our community safe and pet-focused.",
        type: "moderation",
        category: "moderation",
        timestamp: now,
        isRead: false,
        push: true,
      });
    }

    return { strikesCount: strikes.length, suspendedUntil: suspendUntil };
  });
}

/**
 * Writes an audit record to moderation_log
 */
async function logModerationAudit(entry: Record<string, any>) {
  try {
    await admin.firestore().collection("moderation_log").add({
      ...entry,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error("[Moderation] Audit log error:", e);
  }
}

/* ───────────────────────────── Callable Exports ───────────────────────────── */

/**
 * Submit / Edit Post
 */
export const submit_post = onCall(
  { secrets: ["OPENAI_API_KEY"], timeoutSeconds: 60, maxInstances: 20 },
  async (request) => {
    const { uid, profile } = await requireUser(request);

    // Check if user's posting is currently suspended
    const suspendedUntil = Number(profile.postingSuspendedUntil || 0);
    if (suspendedUntil && Date.now() < suspendedUntil) {
      const dateStr = new Date(suspendedUntil).toLocaleDateString();
      throw new HttpsError(
        "permission-denied",
        `Your posting privileges are paused until ${dateStr}.`
      );
    }

    // Rate limit: 20 posts per hour, 50 per day
    await rateLimit("community_post", uid, [
      { limit: 20, seconds: 3600 },
      { limit: 50, seconds: 86400 },
    ]);

    const data = request.data ?? {};
    const content = clip(data.content, 5000);
    const postType = clip(data.postType, 50) || "MOMENT";
    const category = clip(data.category, 50) || postType;
    const imageUrl = clip(data.imageUrl, 500) || null;
    const imagePath = clip(data.imagePath, 500) || null;
    const petTag = clip(data.petTag, 100) || "";

    const isAmberAlert = Boolean(data.isAmberAlert);
    const petName = clip(data.petName, 100);
    const petBreed = clip(data.petBreed, 100);
    const location = clip(data.location, 200);
    const contactPhone = clip(data.contactPhone, 50);
    const microchipId = clip(data.microchipId, 100);

    const sharedPostId = clip(data.sharedPostId, 100) || null;
    const sharedPostAuthor = clip(data.sharedPostAuthor, 100) || null;
    const sharedPostContent = clip(data.sharedPostContent, 1000) || null;
    const sharedPostImageUrl = clip(data.sharedPostImageUrl, 500) || null;

    if (!content && !imageUrl && !imagePath && !data.imageBase64 && !sharedPostId) {
      throw new HttpsError("invalid-argument", "Content or image is required.");
    }

    // Fetch and validate image for moderation
    const image = await getImageFromPathOrUrl(uid, imagePath || imageUrl || undefined, data.imageBase64);

    // Prepare text for moderation evaluation
    const fullText = [content, petName, petBreed, location].filter(Boolean).join(" ");
    const allowContact = isAmberAlert || allowsContact({ postType, category });

    const item: ModerationItem = {
      kind: "post",
      text: fullText,
      image,
      context: { allowContact },
    };

    const apiKey = process.env.OPENAI_API_KEY;
    const openai = apiKey ? new OpenAI({ apiKey }) : null;
    const { lists, layers } = await getDynamicModerationSettings();

    const decision = await runModeration(item, {
      safety: openai ? createSafetyChecker(openai) : undefined,
      relevance: openai ? createRelevanceChecker(openai) : undefined,
      lists,
      layers,
    });

    const db = admin.firestore();
    const postId = clip(data.postId, 100) || `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();

    // Audit log
    await logModerationAudit({
      targetType: "post",
      targetId: postId,
      userId: uid,
      verdict: decision.verdict,
      code: decision.code,
      flags: decision.flags,
      layer: decision.layer,
      textPreview: content.slice(0, 100),
      hasImage: Boolean(image),
    });

    // 1. REJECT
    if (decision.verdict === "reject") {
      const strikeRes = await handleUserStrike(uid, decision.code, decision.flags.join(", "));
      return {
        ok: false,
        verdict: "reject",
        code: decision.code,
        message: decision.message.en,
        messageBn: decision.message.bn,
        strikes: strikeRes.strikesCount,
        suspendedUntil: strikeRes.suspendedUntil,
      };
    }

    const postDoc: Record<string, any> = {
      postId,
      userId: uid,
      userName: clip(profile.name, 100) || "Pet Parent",
      userPhoto: clip(profile.photoUrl, 500) || null,
      author: clip(profile.name, 100) || "Pet Parent",
      authorId: uid,
      content,
      postType,
      category,
      imageUrl: imageUrl || (imagePath ? `https://firebasestorage.googleapis.com/v0/b/${admin.storage().bucket().name}/o/${encodeURIComponent(imagePath)}?alt=media` : null),
      petTag,
      timestamp: now,
      createdAt: new Date(now).toISOString(),
      updatedAt: now,
    };

    if (isAmberAlert) {
      postDoc.isAmberAlert = true;
      postDoc.isResolved = false;
      postDoc.petName = petName;
      postDoc.petBreed = petBreed;
      postDoc.location = location;
      postDoc.contactPhone = contactPhone;
      postDoc.microchipId = microchipId;
    }

    if (sharedPostId) {
      postDoc.sharedPostId = sharedPostId;
      postDoc.sharedPostAuthor = sharedPostAuthor;
      postDoc.sharedPostContent = sharedPostContent;
      postDoc.sharedPostImageUrl = sharedPostImageUrl;
    }

    // 2. PENDING REVIEW
    if (decision.verdict === "pending") {
      await db.collection("community_pending").doc(postId).set({
        ...postDoc,
        status: "pending",
        moderation: {
          code: decision.code,
          flags: decision.flags,
          layer: decision.layer,
          heldAt: now,
        },
      });

      return {
        ok: true,
        verdict: "pending",
        postId,
        code: "needs_review",
        message: MESSAGES.needs_review.en,
        messageBn: MESSAGES.needs_review.bn,
      };
    }

    // 3. APPROVED
    postDoc.likesCount = 0;
    postDoc.commentsCount = 0;
    postDoc.sharesCount = 0;
    postDoc.likedBy = {};
    postDoc.userReactions = {};

    await db.collection("community_posts").doc(postId).set(postDoc, { merge: true });

    return {
      ok: true,
      verdict: "approve",
      postId,
      message: MESSAGES.ok.en,
      messageBn: MESSAGES.ok.bn,
    };
  }
);

/**
 * Submit Comment
 */
export const submit_comment = onCall(
  { secrets: ["OPENAI_API_KEY"], timeoutSeconds: 60, maxInstances: 20 },
  async (request) => {
    const { uid, profile } = await requireUser(request);

    // Check posting suspension
    const suspendedUntil = Number(profile.postingSuspendedUntil || 0);
    if (suspendedUntil && Date.now() < suspendedUntil) {
      const dateStr = new Date(suspendedUntil).toLocaleDateString();
      throw new HttpsError(
        "permission-denied",
        `Your posting privileges are paused until ${dateStr}.`
      );
    }

    // Rate limit: 40 comments per hour
    await rateLimit("community_comment", uid, [
      { limit: 40, seconds: 3600 },
      { limit: 150, seconds: 86400 },
    ]);

    const data = request.data ?? {};
    const postId = clip(data.postId, 100);
    const text = clip(data.text ?? data.commentText, 2000);
    if (!postId || !text) {
      throw new HttpsError("invalid-argument", "postId and text are required.");
    }

    const db = admin.firestore();
    const parentSnap = await db.collection("community_posts").doc(postId).get();
    if (!parentSnap.exists) {
      throw new HttpsError("not-found", "Parent post not found.");
    }
    const parentData = parentSnap.data() || {};
    const parentText = clip(parentData.content, 500);
    const allowContact = Boolean(parentData.isAmberAlert) || allowsContact(parentData);

    const item: ModerationItem = {
      kind: "comment",
      text,
      parentText,
      context: { allowContact },
    };

    const apiKey = process.env.OPENAI_API_KEY;
    const openai = apiKey ? new OpenAI({ apiKey }) : null;
    const { lists, layers } = await getDynamicModerationSettings();

    const decision = await runModeration(item, {
      safety: openai ? createSafetyChecker(openai) : undefined,
      relevance: openai ? createRelevanceChecker(openai) : undefined,
      lists,
      layers,
    });

    const commentId = clip(data.commentId, 100) || `comm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();

    // Audit log
    await logModerationAudit({
      targetType: "comment",
      targetId: commentId,
      postId,
      userId: uid,
      verdict: decision.verdict,
      code: decision.code,
      flags: decision.flags,
      layer: decision.layer,
      textPreview: text.slice(0, 80),
    });

    // 1. REJECT
    if (decision.verdict === "reject") {
      const strikeRes = await handleUserStrike(uid, decision.code, decision.flags.join(", "));
      return {
        ok: false,
        verdict: "reject",
        code: decision.code,
        message: decision.message.en,
        messageBn: decision.message.bn,
        strikes: strikeRes.strikesCount,
        suspendedUntil: strikeRes.suspendedUntil,
      };
    }

    const commentDoc: Record<string, any> = {
      commentId,
      postId,
      userId: uid,
      userName: clip(profile.name, 100) || "Pet Parent",
      author: clip(profile.name, 100) || "Pet Parent",
      userPhoto: clip(profile.photoUrl, 500) || null,
      commentText: text,
      text,
      timestamp: now,
      createdAt: new Date(now).toISOString(),
    };

    // 2. PENDING REVIEW
    if (decision.verdict === "pending") {
      await db.collection("community_pending").doc(commentId).set({
        ...commentDoc,
        status: "pending",
        kind: "comment",
        moderation: {
          code: decision.code,
          flags: decision.flags,
          layer: decision.layer,
          heldAt: now,
        },
      });

      return {
        ok: true,
        verdict: "pending",
        commentId,
        code: "needs_review",
        message: MESSAGES.needs_review.en,
        messageBn: MESSAGES.needs_review.bn,
      };
    }

    // 3. APPROVED
    // Write comment document and update parent post counters & preview atomically
    const postRef = db.collection("community_posts").doc(postId);
    const commentRef = postRef.collection("comments").doc(commentId);

    const batch = db.batch();
    batch.set(commentRef, commentDoc);
    batch.update(postRef, {
      commentsCount: admin.firestore.FieldValue.increment(1),
      comments: admin.firestore.FieldValue.arrayUnion(commentDoc),
    });
    await batch.commit();

    return {
      ok: true,
      verdict: "approve",
      commentId,
      message: MESSAGES.ok.en,
      messageBn: MESSAGES.ok.bn,
    };
  }
);

/**
 * Report Community Content
 */
export const report_content = onCall(async (request) => {
  const { uid } = await requireUser(request);
  await rateLimit("community_report", uid, [
    { limit: 10, seconds: 3600 },
    { limit: 30, seconds: 86400 },
  ]);

  const data = request.data ?? {};
  const targetId = clip(data.postId || data.targetId, 100);
  const targetType = clip(data.targetType, 20) || "post";
  const reason = clip(data.reason, 300) || "Inappropriate content";
  const commentId = clip(data.commentId, 100) || null;

  if (!targetId) throw new HttpsError("invalid-argument", "Target ID is required");

  const db = admin.firestore();
  const reportDocId = `${targetId}_${uid}`;
  const reportRef = db.collection("community_reports").doc(reportDocId);

  const now = Date.now();
  await reportRef.set({
    reportId: reportDocId,
    targetId,
    targetType,
    postId: targetId,
    commentId,
    reporterId: uid,
    reason,
    timestamp: now,
    status: "pending",
  });

  // Count reports for this target
  const reportsSnap = await db
    .collection("community_reports")
    .where("targetId", "==", targetId)
    .where("status", "==", "pending")
    .get();

  const reportCount = reportsSnap.docs.length;

  // Auto-hide when 3 distinct reports received
  if (reportCount >= 3) {
    if (targetType === "post") {
      const postRef = db.collection("community_posts").doc(targetId);
      const postSnap = await postRef.get();
      if (postSnap.exists) {
        const postData = postSnap.data() || {};
        const batch = db.batch();
        batch.set(db.collection("community_pending").doc(targetId), {
          ...postData,
          status: "pending",
          moderation: {
            code: "auto_hidden_by_reports",
            flags: [`reports_count:${reportCount}`],
            layer: "reports",
            heldAt: now,
          },
        });
        batch.delete(postRef);
        await batch.commit();
      }
    }
  }

  return { ok: true, reportCount };
});

/**
 * Admin Moderation Decision (Approve / Reject / Lift Strike)
 */
export const moderation_decide = onCall(async (request) => {
  const { uid, profile } = await requireUser(request);
  const isPrivileged = isAdminRole(profile.role) || profile.staffRole === "Manager";
  if (!isPrivileged) {
    throw new HttpsError("permission-denied", "Manager or Admin role required.");
  }

  const data = request.data ?? {};
  const action = String(data.action ?? "");
  const targetId = clip(data.id || data.targetId, 100);
  const targetType = clip(data.targetType, 20) || "post";
  const db = admin.firestore();
  const now = Date.now();

  if (action === "lift_strike") {
    const userUid = clip(data.userUid || targetId, 100);
    if (!userUid) throw new HttpsError("invalid-argument", "userUid is required");

    await db.collection("moderation_strikes").doc(userUid).delete();
    await db.collection("users").doc(userUid).update({
      postingSuspendedUntil: admin.firestore.FieldValue.delete(),
    });
    return { ok: true, action: "lift_strike", userUid };
  }

  if (!targetId) throw new HttpsError("invalid-argument", "Target ID required.");

  const pendingRef = db.collection("community_pending").doc(targetId);
  const pendingSnap = await pendingRef.get();
  if (!pendingSnap.exists) {
    throw new HttpsError("not-found", "Pending document not found.");
  }
  const itemData = pendingSnap.data() || {};

  if (action === "approve") {
    const batch = db.batch();
    if (targetType === "post") {
      const { status, moderation, ...cleanPost } = itemData;
      batch.set(db.collection("community_posts").doc(targetId), cleanPost);
      batch.delete(pendingRef);
    } else if (targetType === "comment") {
      const postId = itemData.postId;
      const { status, moderation, ...cleanComment } = itemData;
      const postRef = db.collection("community_posts").doc(postId);
      batch.set(postRef.collection("comments").doc(targetId), cleanComment);
      batch.update(postRef, {
        commentsCount: admin.firestore.FieldValue.increment(1),
        comments: admin.firestore.FieldValue.arrayUnion(cleanComment),
      });
      batch.delete(pendingRef);
    }
    await batch.commit();

    // Mark related reports as resolved
    const repSnap = await db.collection("community_reports").where("targetId", "==", targetId).get();
    const repBatch = db.batch();
    repSnap.docs.forEach((d) => repBatch.update(d.ref, { status: "resolved_approved", resolvedAt: now, resolvedBy: uid }));
    await repBatch.commit();

    return { ok: true, action: "approved", targetId };
  }

  if (action === "reject") {
    const reasonCode = clip(data.reasonCode, 50) || "admin_rejected";
    const authorId = itemData.userId || itemData.authorId;

    const batch = db.batch();
    batch.set(db.collection("moderation_removed").doc(targetId), {
      ...itemData,
      status: "removed",
      removedAt: now,
      removedBy: uid,
      reasonCode,
    });
    batch.delete(pendingRef);
    await batch.commit();

    // Apply strike to author
    if (authorId) {
      await handleUserStrike(authorId, reasonCode, `Admin rejected: ${targetId}`);
    }

    // Mark related reports as resolved
    const repSnap = await db.collection("community_reports").where("targetId", "==", targetId).get();
    const repBatch = db.batch();
    repSnap.docs.forEach((d) => repBatch.update(d.ref, { status: "resolved_removed", resolvedAt: now, resolvedBy: uid }));
    await repBatch.commit();

    return { ok: true, action: "rejected", targetId };
  }

  throw new HttpsError("invalid-argument", "Invalid action. Supported: approve, reject, lift_strike");
});

/**
 * Backfill Moderation Audit on Existing Content
 */
export const backfill_moderation = onCall(async (request) => {
  const { profile } = await requireUser(request);
  if (!isAdminRole(profile.role)) {
    throw new HttpsError("permission-denied", "Admin only");
  }

  const db = admin.firestore();
  const limit = Math.min(Math.max(Number(request.data?.limit) || 50, 1), 200);
  const snap = await db.collection("community_posts").limit(limit).get();

  let scanned = 0;
  let clean = 0;
  let flagged = 0;

  const { lists, layers } = await getDynamicModerationSettings();

  for (const doc of snap.docs) {
    scanned++;
    const p = doc.data();
    const text = [p.content, p.petName, p.petBreed, p.location].filter(Boolean).join(" ");
    const item: ModerationItem = {
      kind: "post",
      text,
      context: { allowContact: p.isAmberAlert || allowsContact(p) },
    };

    // Fast heuristic run (words & rules)
    const d = await runModeration(item, {
      lists,
      layers: { ...layers, safety: false, relevance: false },
    });

    if (d.verdict === "reject" || d.verdict === "pending") {
      flagged++;
      // Move to pending for review
      await db.collection("community_pending").doc(doc.id).set({
        ...p,
        status: "pending",
        moderation: {
          code: d.code,
          flags: d.flags,
          layer: d.layer,
          backfilledAt: Date.now(),
        },
      });
      await doc.ref.delete();
    } else {
      clean++;
    }
  }

  return { scanned, clean, flagged };
});
