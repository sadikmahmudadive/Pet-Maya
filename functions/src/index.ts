import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import * as crypto from "crypto";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import {
  DEVICE_MASTER_SECRET, MAX_CLOCK_SKEW_S, deviceAlerts, intervalFromMode, newDeviceDefaults, num, safeZoneOf,
} from "./iot_common";

admin.initializeApp();

export const openai_proxy = onCall({ secrets: ["OPENAI_API_KEY"] }, async (request) => {
  // 1. Authentication Check & Logging
  if (!request.auth) {
    console.warn("openai_proxy called without active authentication context. Proceeding anyway for debugging...");
  } else {
    console.log(`openai_proxy called by user: ${request.auth.uid}`);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: OPENAI_API_KEY is not defined in environment variables or secrets!");
    return { response: "AI Configuration Error: API Key missing on server.", schedule: [], breed: "Error", recommendation: {} };
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const { method, ...payload } = request.data;

  try {
    switch (method) {
      case "health_diagnosis":
        return await handleHealthDiagnosis(openai, payload);
      case "nutrition_schedule":
        return await handleNutritionSchedule(openai, payload);
      case "nutrition_recommendation":
        return await handleNutritionRecommendation(openai, payload);
      case "breed_finder":
        return await handleBreedFinder(openai, payload);
      default:
        throw new HttpsError(
          "invalid-argument",
          "Unknown method requested."
        );
    }
  } catch (error: any) {
    console.error("CRITICAL AI Error:", error);
    // Return detailed error to the app logs
    return {
      response: `AI Connection Error: ${error.message}. Ensure your Firebase project is on the BLAZE plan.`,
      schedule: ["08:00", "13:00", "19:00"],
      breed: `Error: ${error.message}`,
      recommendation: { error: error.message }
    };
  }
});

const BROADCAST_TOPICS: Record<string, string> = {
  "All Users": "everyone",
  "Everyone in App": "everyone",
  "All Pet Owners": "pet_owners",
  "All Veterinarians": "vets",
  "All Shop Merchants": "merchants",
};

// Roles are stored either as display labels or as Dart enum names.
const BROADCAST_ROLES: Record<string, string[]> = {
  pet_owners: ["Pet Owner", "petOwner"],
  vets: ["Veterinarian", "veterinarian"],
  merchants: ["Pet Shop", "petShop"],
};

const ADMIN_ROLES = ["Admin", "admin", "superAdmin", "Super Admin"];

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const send_broadcast = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Auth required");
  }

  const userDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
  if (!ADMIN_ROLES.includes(userDoc.data()?.role)) {
    throw new HttpsError("permission-denied", "Admin only");
  }

  const title = clip(request.data?.title, 100);
  const message = clip(request.data?.message, 500);
  if (!title || !message) {
    throw new HttpsError("invalid-argument", "Title and message are required");
  }
  const topic = BROADCAST_TOPICS[request.data?.targetGroup] ?? "everyone";

  // Persist to each recipient's in-app notification centre. `push: false`
  // stops push_on_notification re-sending what the topic message delivers.
  try {
    const db = admin.firestore();
    const role = BROADCAST_ROLES[topic];
    const users = role
      ? await db.collection("users").where("role", "in", role).select().get()
      : await db.collection("users").select().get();
    const now = Date.now();
    for (let i = 0; i < users.docs.length; i += 400) {
      const batch = db.batch();
      users.docs.slice(i, i + 400).forEach((u) => {
        batch.set(db.collection("notifications").doc(u.id).collection("items").doc(), {
          title, message, body: message, type: "system", category: "system",
          timestamp: now, isRead: false, read: false, push: false,
        });
      });
      await batch.commit();
    }
  } catch (error: any) {
    console.error("Broadcast persist error:", error);
  }

  try {
    // Notification payload lets the OS display the push while the app is
    // backgrounded or terminated; data carries routing info for taps.
    const messageId = await admin.messaging().send({
      topic,
      notification: { title, body: message },
      data: { category: "system", type: "system" },
      android: { priority: "high", notification: { channelId: "high_importance_channel" } },
      apns: { payload: { aps: { sound: "default" } } },
      webpush: { notification: { icon: "/favicon-96x96.png" }, fcmOptions: { link: "/" } },
    });
    console.log(`Broadcast ${messageId} sent to ${topic} by ${request.auth.uid}`);
    return { success: true, messageId };
  } catch (error: any) {
    console.error("FCM Error:", error);
    throw new HttpsError("internal", "Failed to send broadcast");
  }
});

/**
 * Pushes every in-app notification (notifications/{uid}/items/{id}) to the
 * user's registered devices, so any feature that writes a notification
 * document also reaches the lock screen. Stale tokens are pruned.
 */
export const push_on_notification = onDocumentCreated(
  "notifications/{uid}/items/{id}",
  async (event) => {
    const data = event.data?.data();
    if (!data || data.push === false) return;
    const { uid, id } = event.params;

    const userRef = admin.firestore().collection("users").doc(uid);
    const user = (await userRef.get()).data();
    if (!user) return;

    const tokens = Array.from(
      new Set<string>([
        ...(Array.isArray(user.fcmTokens) ? user.fcmTokens : []),
        ...(typeof user.fcmToken === "string" && user.fcmToken ? [user.fcmToken] : []),
      ])
    );
    if (tokens.length === 0) return;

    const title = clip(data.title, 100) || "Pet Maya";
    const body = clip(data.body ?? data.message, 500);
    if (!body) return;
    const category = clip(data.category ?? data.type, 30) || "general";

    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { category, type: category, notificationId: id, url: clip(data.url, 300) },
      android: { priority: "high", notification: { channelId: "high_importance_channel" } },
      apns: { payload: { aps: { sound: "default" } } },
      webpush: { notification: { icon: "/favicon-96x96.png" }, fcmOptions: { link: data.url || "/" } },
    });

    const dead = tokens.filter((_, i) => {
      const code = res.responses[i].error?.code;
      return (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      );
    });
    if (dead.length > 0) {
      const update: Record<string, any> = { fcmTokens: admin.firestore.FieldValue.arrayRemove(...dead) };
      if (dead.includes(user.fcmToken)) update.fcmToken = admin.firestore.FieldValue.delete();
      await userRef.update(update);
    }
  }
);

/* ───────────────────────── Tele-vet video calls ─────────────────────────
 * Signaling lives in Firestore calls/{callId}; media flows peer-to-peer over
 * WebRTC. The functions below ring the callee, tidy up and mint TURN creds.
 */

const TURN_SECRET = defineSecret("TURN_SECRET");
const RING_TIMEOUT_MS = 60_000;
const MAX_CALL_MS = 3 * 60 * 60_000;

/** STUN plus (when TURN_URLS + TURN_SECRET are configured) coturn
 *  time-limited credentials (use-auth-secret / REST API scheme). */
export const get_ice_servers = onCall({ secrets: [TURN_SECRET] }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

  const iceServers: Record<string, any>[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ];
  const urls = (process.env.TURN_URLS || "").split(",").map((u) => u.trim()).filter(Boolean);
  const secret = TURN_SECRET.value();
  if (urls.length > 0 && secret) {
    const ttl = 6 * 3600;
    const username = `${Math.floor(Date.now() / 1000) + ttl}:${request.auth.uid}`;
    const credential = crypto.createHmac("sha1", secret).update(username).digest("base64");
    iceServers.push({ urls, username, credential });
  } else {
    console.warn("TURN not configured: calls behind strict NATs will fail to connect.");
  }
  return { iceServers, ttl: 6 * 3600 };
});

async function userTokens(uid: string): Promise<string[]> {
  const user = (await admin.firestore().collection("users").doc(uid).get()).data();
  if (!user) return [];
  return Array.from(new Set<string>([
    ...(Array.isArray(user.fcmTokens) ? user.fcmTokens : []),
    ...(typeof user.fcmToken === "string" && user.fcmToken ? [user.fcmToken] : []),
  ]));
}

async function pruneDeadTokens(uid: string, tokens: string[], res: admin.messaging.BatchResponse) {
  const dead = tokens.filter((_, i) => {
    const code = res.responses[i].error?.code;
    return code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token";
  });
  if (dead.length > 0) {
    await admin.firestore().collection("users").doc(uid).update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...dead),
    }).catch(() => undefined);
  }
}

/** Data-only, high-priority push: the app's background handler raises the
 *  native incoming-call screen. iOS gets a visible alert instead (CallKit
 *  there would need PushKit/VoIP pushes, which FCM does not carry). */
async function sendCallPush(uid: string, data: Record<string, string>, alert?: { title: string; body: string }) {
  const tokens = await userTokens(uid);
  if (tokens.length === 0) return;
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    data,
    android: { priority: "high", ttl: 45_000 },
    apns: {
      headers: {
        "apns-priority": "10",
        "apns-push-type": alert ? "alert" : "background",
        "apns-expiration": String(Math.floor(Date.now() / 1000) + 45),
      },
      payload: alert
        ? { aps: { alert, sound: "default", "interruption-level": "time-sensitive", category: "INCOMING_CALL" } }
        : { aps: { "content-available": 1 } },
    },
  });
  await pruneDeadTokens(uid, tokens, res);
}

export const on_call_created = onDocumentCreated("calls/{callId}", async (event) => {
  const call = event.data?.data();
  if (!call || call.status !== "ringing") return;
  const db = admin.firestore();
  const ref = event.data!.ref;

  // Reject if the callee is already in another call.
  const busy = await db.collection("calls")
    .where("calleeId", "==", call.calleeId).where("status", "==", "accepted").limit(1).get();
  if (!busy.empty) {
    await ref.update({ status: "busy", endedAt: Date.now(), endReason: "callee_busy" });
    return;
  }

  const callerName = clip(call.callerName, 80) || "Pet Maya";
  await sendCallPush(call.calleeId, {
    type: "incoming_call",
    callId: event.params.callId,
    callerId: String(call.callerId),
    callerName,
    petName: clip(call.petName, 60),
    appointmentId: clip(call.appointmentId, 80),
    timeoutMs: String(RING_TIMEOUT_MS),
  }, {
    title: "Incoming video call",
    body: `${callerName} is calling about ${clip(call.petName, 60) || "a pet"}`,
  });
});

export const on_call_updated = onDocumentUpdated("calls/{callId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || before.status === after.status) return;
  const db = admin.firestore();
  const { callId } = event.params;
  const ref = event.data!.after.ref;

  // Tell the callee's devices to stop ringing / dismiss the call UI.
  if (before.status === "ringing") {
    await sendCallPush(after.calleeId, { type: "call_ended", callId, status: String(after.status) });
  }

  // Missed / cancelled → leave a notification for the callee.
  if (before.status === "ringing" && (after.status === "missed" || after.status === "cancelled")) {
    await db.collection("notifications").doc(after.calleeId).collection("items").add({
      title: "Missed video call",
      body: `You missed a video consultation call from ${clip(after.callerName, 80) || "a user"}.`,
      category: "system", type: "system", read: false, isRead: false, timestamp: Date.now(),
    });
  }
  // Declined → let the caller know in-app.
  if (before.status === "ringing" && after.status === "declined") {
    await db.collection("notifications").doc(after.callerId).collection("items").add({
      title: "Call declined",
      body: `${clip(after.calleeName, 80) || "The other party"} couldn't take your call. Try again shortly or book an appointment.`,
      category: "system", type: "system", read: false, isRead: false, timestamp: Date.now(), push: false,
    });
  }

  // Terminal state: drop ICE candidates, they're single-use.
  if (["ended", "declined", "missed", "cancelled", "busy"].includes(after.status)) {
    await Promise.all([
      db.recursiveDelete(ref.collection("callerCandidates")),
      db.recursiveDelete(ref.collection("calleeCandidates")),
    ]).catch((e) => console.warn("candidate cleanup failed", e));
  }
});

/** Safety net for clients that crash mid-call: ring timeouts and zombie calls. */
export const expire_stale_calls = onSchedule("every 2 minutes", async () => {
  const db = admin.firestore();
  const now = Date.now();
  const ringing = await db.collection("calls").where("status", "==", "ringing").get();
  const active = await db.collection("calls").where("status", "==", "accepted").get();
  const writes: Promise<unknown>[] = [];
  ringing.docs.forEach((d) => {
    if (now - (d.data().createdAtMs ?? 0) > RING_TIMEOUT_MS + 15_000) {
      writes.push(d.ref.update({ status: "missed", endedAt: now, endReason: "timeout" }));
    }
  });
  active.docs.forEach((d) => {
    if (now - (d.data().answeredAt ?? now) > MAX_CALL_MS) {
      writes.push(d.ref.update({ status: "ended", endedAt: now, endReason: "max_duration" }));
    }
  });
  await Promise.all(writes);
});

/* ───────────────────────── IoT collar telemetry ─────────────────────────
 * firmware/ (ESP32) POSTs signed JSON here. Per-device secret =
 * HMAC-SHA256(DEVICE_MASTER_SECRET, deviceId), so no per-device secret storage
 * is needed and compromising one collar doesn't expose the others.
 * Signature: HMAC-SHA256(deviceSecret, "<unix ts>.<raw body>"), hex.
 */

const DEVICE_ID_RE = /^[A-Za-z0-9_-]{6,40}$/;

function deviceSecretFor(master: string, deviceId: string): string {
  return crypto.createHmac("sha256", master).update(deviceId).digest("hex");
}

function barsFromRssi(rssi: number): number {
  return rssi >= -55 ? 4 : rssi >= -67 ? 3 : rssi >= -78 ? 2 : 1;
}

export const device_ingest = onRequest(
  { secrets: [DEVICE_MASTER_SECRET], maxInstances: 20, timeoutSeconds: 30, memory: "256MiB" },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }

    const deviceId = String(req.get("x-device-id") || "");
    const ts = Number(req.get("x-timestamp"));
    const sig = String(req.get("x-signature") || "");
    if (!DEVICE_ID_RE.test(deviceId) || !Number.isFinite(ts) || sig.length !== 64) {
      res.status(400).json({ ok: false, error: "bad_request" }); return;
    }
    if (Math.abs(Date.now() / 1000 - ts) > MAX_CLOCK_SKEW_S) {
      res.status(401).json({ ok: false, error: "clock_skew" }); return;
    }

    const raw: Buffer = (req as any).rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    const secret = deviceSecretFor(DEVICE_MASTER_SECRET.value(), deviceId);
    const expected = crypto.createHmac("sha256", secret).update(`${ts}.`).update(raw).digest("hex");
    const sigOk = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig.toLowerCase()));
    if (!sigOk) { res.status(401).json({ ok: false, error: "bad_signature" }); return; }

    const body = req.body ?? {};
    const samples: any[] = Array.isArray(body.samples) ? body.samples.slice(0, 50) : [];
    const valid = samples.filter((s) =>
      num(s.lat) !== null && num(s.lng) !== null && Math.abs(s.lat) <= 90 && Math.abs(s.lng) <= 180 &&
      num(s.ts) !== null && s.ts > 1_700_000_000 && s.ts <= Date.now() / 1000 + MAX_CLOCK_SKEW_S);
    valid.sort((a, b) => a.ts - b.ts);

    const db = admin.firestore();
    const ref = db.collection("devices").doc(deviceId);
    const snap = await ref.get();
    const dev = snap.data() ?? {};
    if (dev.revoked === true) { res.status(403).json({ ok: false, error: "revoked" }); return; }
    if (typeof dev.lastRequestTs === "number" && ts <= dev.lastRequestTs) {
      res.status(409).json({ ok: false, error: "replay" }); return; // stale/duplicated request
    }

    const lostMode = dev.lostMode === true;
    const intervalSec = intervalFromMode(dev.trackingMode, lostMode);
    const battery = Math.min(Math.max(Math.round(Number(body.battery) || 0), 0), 100);
    const isSafe = body.isSafe !== false;
    const now = Date.now();

    const update: Record<string, any> = {
      isOnline: true,
      batteryLevel: battery,
      signalStrength: barsFromRssi(Number(body.rssi) || -90),
      firmwareVersion: String(body.fw || "").slice(0, 20),
      isSafeZone: isSafe,
      lastSync: new Date(now).toISOString(),
      lastSyncAt: now,
      lastRequestTs: ts,
      intervalSec,
      updatedAt: now,
    };
    if (!snap.exists) Object.assign(update, newDeviceDefaults(deviceId, now, { connectivity: "wifi" }));
    const last = valid[valid.length - 1];
    if (last) {
      update.latitude = last.lat;
      update.longitude = last.lng;
      update.speedKmh = num(last.spd) ?? 0;
      update.gpsAccuracyHdop = num(last.hdop) ?? null;
    }

    // Ring request (one-shot): the app sets ringRequestedAt; we ack it once.
    const ringReq = num(dev.ringRequestedAt) ?? 0;
    const ring = ringReq > (num(dev.lastRingAckAt) ?? 0);
    if (ring) update.lastRingAckAt = ringReq;

    // Alerts → owner's in-app notification feed (push_on_notification delivers the push).
    const alerts = deviceAlerts(dev, isSafe, battery, update, now);

    // Track history (idempotent per timestamp; set a Firestore TTL policy on `expireAt`).
    const batch = db.batch();
    batch.set(ref, update, { merge: true });
    valid.forEach((s) => {
      batch.set(ref.collection("history").doc(String(s.ts)), {
        lat: s.lat, lng: s.lng, speedKmh: num(s.spd) ?? 0, hdop: num(s.hdop) ?? null,
        altM: num(s.alt) ?? null, sats: num(s.sats) ?? null, ts: s.ts * 1000,
        expireAt: admin.firestore.Timestamp.fromMillis(s.ts * 1000 + 30 * 24 * 3600 * 1000),
      });
    });
    await Promise.all([batch.commit(), ...alerts]);

    // Directive back to the collar.
    const directive: Record<string, any> = { ok: true, intervalSec, ring, lostMode, serverTime: now };
    const zone = safeZoneOf(dev);
    if (zone) directive.safeZone = zone;
    const fw = (await db.collection("firmware").doc("esp32dev").get()).data();
    if (fw && fw.enabled !== false && fw.version && fw.url && fw.sha256 && fw.version !== body.fw &&
        dev.otaDisabled !== true) {
      directive.ota = { version: fw.version, url: fw.url, sha256: fw.sha256 };
    }
    res.status(200).json(directive);
  }
);

/** Collars that stopped reporting are shown as offline in the apps. */
export const mark_offline_devices = onSchedule("every 5 minutes", async () => {
  const db = admin.firestore();
  const now = Date.now();
  const online = await db.collection("devices").where("isOnline", "==", true).get();
  const writes = online.docs.filter((d) => {
    const x = d.data();
    const grace = Math.max(3 * (Number(x.intervalSec) || 60) * 1000, 180_000);
    return typeof x.lastSyncAt === "number" && now - x.lastSyncAt > grace;
  }).map((d) => d.ref.update({ isOnline: false }));
  await Promise.all(writes);
});

async function handleHealthDiagnosis(openai: OpenAI, data: any) {
  const content: any[] = [
    { type: "text", text: `Pet Name: ${data.petName}. Issue description: ${data.prompt}` },
  ];

  if (data.image) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${data.image}` },
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a highly experienced Senior Veterinarian. Rules: 1. Highlight key terms with **. 2. Plain text only. 3. Describe location/appearance in photo. 4. Specific reasoning. 5. Empathetic tone. 6. State Urgency (Emergency/Routine).",
      },
      { role: "user", content: content as any },
    ],
    temperature: 0.5,
  });

  return { response: response.choices[0].message.content };
}

async function handleNutritionSchedule(openai: OpenAI, data: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a pet nutrition expert. Return ONLY a JSON array of HH:MM strings." },
      { role: "user", content: `Pet: ${data.petName}, Breed: ${data.breed}, Age: ${data.age}, Weight: ${data.weight}` },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || "[]";
  const schedule = JSON.parse(content.replace(/```json|```/g, "").trim());
  return { schedule };
}

async function handleNutritionRecommendation(openai: OpenAI, data: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Analyze pet profile. Return JSON: calories, nutrients (array), recommendations (array). ONLY valid JSON." },
      { role: "user", content: `Pet: ${data.petName}, Breed: ${data.breed}, Age: ${data.age}, Weight: ${data.weight}. Current Diet: ${data.currentDiet || "Not specified"}` },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || "{}";
  const recommendation = JSON.parse(content.replace(/```json|```/g, "").trim());
  return { recommendation };
}

async function handleBreedFinder(openai: OpenAI, data: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Identify the breed. Return only the name." },
      {
        role: "user",
        content: [
          { type: "text", text: "Identify the breed of this pet. Return only the name." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${data.image}` } },
        ] as any,
      },
    ],
    max_tokens: 50,
  });

  return { breed: response.choices[0].message.content };
}
export { get_tracker_key, lora_ingest, mark_offline_gateways } from "./lora";
