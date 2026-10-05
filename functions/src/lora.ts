/* ───────────────────────── LoRa network server ─────────────────────────
 * Gateways (firmware/lora-gateway) POST the raw frames they hear. Gateways hold no
 * tracker keys: this function authenticates the gateway, then verifies + decrypts each
 * frame with the tracker's own key, de-duplicates frames heard by several gateways
 * (frame counter), updates devices/PML-xxxxxxxx (same fields the apps already read),
 * and answers with encrypted downlinks (interval / lost mode / safe zone / ring).
 *
 * Downlink delivery is acknowledged by the tracker echoing `lastDownCounter`, so
 * one-shot commands (ring) are retried until they actually arrive.
 */
import * as crypto from "crypto";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  DEVICE_MASTER_SECRET, MAX_CLOCK_SKEW_S, deviceAlerts, haversineM, intervalFromMode, newDeviceDefaults, num,
  safeZoneOf,
} from "./iot_common";
import {
  DOWN_LOST_MODE, DOWN_RING, DOWN_ZONE_VALID, Downlink, TYPE_UPLINK, UP_ACK_REQUEST, UP_COLD_BOOT, UP_HAS_FIX,
  deviceIdFor, gatewaySecretFor, loraKeyFor, openUplink, parseHeader, sealDownlink,
} from "./lora_codec";

const GATEWAY_ID_RE = /^[A-Za-z0-9_-]{6,40}$/;
/** Floor for LoRa reporting: ~185 ms airtime per uplink at SF9 → 1 % duty cycle ≈ 20 s. */
const LORA_MIN_INTERVAL_S = 20;
const SAFE_ZONE_MARGIN_M = 15;
const MAX_FRAMES = 32;
const MAX_FRAME_AGE_MS = 60 * 60 * 1000;

function loraBars(rssi: number): number {
  return rssi >= -90 ? 4 : rssi >= -105 ? 3 : rssi >= -115 ? 2 : 1;
}

interface FrameIn { ref: number; data: Buffer; rssi: number; snr: number; ageMs: number }

/** Desired tracker configuration derived from what the owner set in the apps. */
function desiredConfig(dev: Record<string, any>) {
  const lost = dev.lostMode === true;
  const intervalS = Math.max(intervalFromMode(dev.trackingMode, lost), LORA_MIN_INTERVAL_S);
  const zone = safeZoneOf(dev);
  const dl: Downlink = {
    intervalS,
    flags: (lost ? DOWN_LOST_MODE : 0) | (zone ? DOWN_ZONE_VALID : 0),
    zoneLatE7: zone ? Math.round(zone.lat * 1e7) : 0,
    zoneLngE7: zone ? Math.round(zone.lng * 1e7) : 0,
    zoneRadiusM: zone ? Math.min(Math.round(zone.radiusM), 65535) : 0,
  };
  const hash = `${dl.intervalS}|${dl.flags}|${dl.zoneLatE7}|${dl.zoneLngE7}|${dl.zoneRadiusM}`;
  return { dl, hash, zone, intervalS };
}

/** Handle one frame. Returns a downlink to send back via this gateway, if any. */
async function processFrame(f: FrameIn, master: string, gatewayId: string, now: number): Promise<Buffer | null> {
  const header = parseHeader(f.data);
  if (!header || header.type !== TYPE_UPLINK) return null;
  const deviceId = deviceIdFor(header.nodeId);
  const key = loraKeyFor(master, deviceId);
  const opened = openUplink(key, f.data);
  if (!opened) return null; // forged, corrupted, or a tracker provisioned for another project
  const { uplink: u } = opened;

  const db = admin.firestore();
  const ref = db.collection("devices").doc(deviceId);
  const heardAt = now - Math.min(Math.max(f.ageMs, 0), MAX_FRAME_AGE_MS);
  const fresh = f.ageMs < 2500; // still inside the tracker's receive window

  let downlink: Buffer | null = null;
  let alerts: Promise<unknown>[] = [];
  let historyFix: Record<string, any> | null = null;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const dev = snap.data() ?? {};
    if (dev.revoked === true) return;
    // De-duplication + replay protection: each counter value is accepted once.
    if (typeof dev.upCounter === "number" && header.counter <= dev.upCounter) return;

    const battery = Math.min(Math.max(u.batteryPct, 0), 100);
    const hasPosition = u.latE7 !== 0 || u.lngE7 !== 0;
    const lat = u.latE7 / 1e7;
    const lng = u.lngE7 / 1e7;
    const update: Record<string, any> = {
      connectivity: "lora",
      upCounter: header.counter,
      isOnline: true,
      batteryLevel: battery,
      signalStrength: loraBars(f.rssi),
      loraRssi: f.rssi,
      loraSnr: f.snr,
      lastGatewayId: gatewayId,
      firmwareVersion: `${u.fwMajor}.${u.fwMinor}-lora`,
      lastSync: new Date(heardAt).toISOString(),
      lastSyncAt: heardAt,
      gpsFix: (u.flags & UP_HAS_FIX) !== 0,
      gpsSatellites: u.sats,
      updatedAt: now,
    };
    if (!snap.exists) Object.assign(update, newDeviceDefaults(deviceId, now, { connectivity: "lora" }));

    // Server-side geofence (authoritative for alerts; the tracker runs its own copy
    // only to speed up reporting on its own when the pet escapes).
    const cfg = desiredConfig(dev);
    let isSafe = dev.isSafeZone !== false;
    if (hasPosition) {
      update.latitude = lat;
      update.longitude = lng;
      update.speedKmh = u.speedKmh;
      update.gpsAccuracyHdop = u.hdopX10 === 255 ? null : u.hdopX10 / 10;
      update.gpsFixAgeS = u.fixAgeS;
      if (cfg.zone) {
        const d = haversineM(cfg.zone.lat, cfg.zone.lng, lat, lng);
        isSafe = isSafe ? d <= cfg.zone.radiusM + SAFE_ZONE_MARGIN_M : d <= cfg.zone.radiusM;
      } else {
        isSafe = true;
      }
      if (u.flags & UP_HAS_FIX) {
        const fixTs = Math.floor(heardAt / 1000) - u.fixAgeS;
        historyFix = {
          id: String(fixTs),
          lat, lng, speedKmh: u.speedKmh, hdop: u.hdopX10 === 255 ? null : u.hdopX10 / 10,
          altM: u.altM, sats: u.sats, ts: fixTs * 1000, via: "lora", gatewayId, rssi: f.rssi,
          expireAt: admin.firestore.Timestamp.fromMillis(fixTs * 1000 + 30 * 24 * 3600 * 1000),
        };
      }
    }
    update.isSafeZone = isSafe;
    update.intervalSec = cfg.intervalS;

    // Downlink acknowledgement → commit what the tracker has now applied.
    const pending = num(dev.pendingDownCounter) ?? 0;
    let appliedHash = dev.appliedConfigHash ?? null;
    let ringAckAt = num(dev.lastRingAckAt) ?? 0;
    if (pending > 0 && u.lastDownCounter >= pending) {
      appliedHash = dev.pendingConfigHash ?? appliedHash;
      update.appliedConfigHash = appliedHash;
      if (num(dev.pendingRingAt)) { ringAckAt = dev.pendingRingAt; update.lastRingAckAt = ringAckAt; }
      update.pendingDownCounter = 0;
      update.pendingRingAt = 0;
    }

    // Do we need to talk back? Only while the tracker is still listening.
    const ringReq = num(dev.ringRequestedAt) ?? 0;
    const ringPending = ringReq > ringAckAt;
    const coldBoot = (u.flags & UP_COLD_BOOT) !== 0;
    const need = (u.flags & UP_ACK_REQUEST) !== 0 || coldBoot || ringPending || cfg.hash !== appliedHash;
    if (need && fresh) {
      const downCounter = Math.max(num(dev.downCounter) ?? 0, u.lastDownCounter) + 1;
      const dl: Downlink = { ...cfg.dl, flags: cfg.dl.flags | (ringPending ? DOWN_RING : 0) };
      downlink = sealDownlink(key, header.nodeId, downCounter, dl);
      update.downCounter = downCounter;
      update.pendingDownCounter = downCounter;
      update.pendingConfigHash = cfg.hash;
      update.pendingRingAt = ringPending ? ringReq : 0;
    }

    alerts = deviceAlerts(dev, isSafe, battery, update, now);
    tx.set(ref, update, { merge: true });
  });

  const writes: Promise<unknown>[] = [...alerts];
  const fix = historyFix as Record<string, any> | null;
  if (fix) {
    const { id, ...data } = fix;
    writes.push(ref.collection("history").doc(id).set(data));
  }
  await Promise.all(writes);
  return downlink;
}

export const lora_ingest = onRequest(
  { secrets: [DEVICE_MASTER_SECRET], maxInstances: 20, timeoutSeconds: 30, memory: "256MiB", minInstances: 0 },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }

    const gatewayId = String(req.get("x-gateway-id") || "");
    const ts = Number(req.get("x-timestamp"));
    const sig = String(req.get("x-signature") || "");
    if (!GATEWAY_ID_RE.test(gatewayId) || !Number.isFinite(ts) || sig.length !== 64) {
      res.status(400).json({ ok: false, error: "bad_request" }); return;
    }
    if (Math.abs(Date.now() / 1000 - ts) > MAX_CLOCK_SKEW_S) {
      res.status(401).json({ ok: false, error: "clock_skew" }); return;
    }
    const master = DEVICE_MASTER_SECRET.value();
    const raw: Buffer = (req as any).rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    const expected = crypto.createHmac("sha256", gatewaySecretFor(master, gatewayId))
      .update(`${ts}.`).update(raw).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig.toLowerCase()))) {
      res.status(401).json({ ok: false, error: "bad_signature" }); return;
    }

    const db = admin.firestore();
    const gwRef = db.collection("gateways").doc(gatewayId);
    const gwSnap = await gwRef.get();
    const gwDoc = gwSnap.data() ?? {};
    if (gwDoc.revoked === true) { res.status(403).json({ ok: false, error: "revoked" }); return; }
    if (typeof gwDoc.lastRequestTs === "number" && ts <= gwDoc.lastRequestTs) {
      res.status(409).json({ ok: false, error: "replay" }); return;
    }

    const body = req.body ?? {};
    const now = Date.now();
    const frames: FrameIn[] = (Array.isArray(body.frames) ? body.frames : []).slice(0, MAX_FRAMES)
      .map((f: any) => ({
        ref: Number(f?.ref) || 0,
        data: Buffer.from(String(f?.data ?? ""), "base64"),
        rssi: Number(f?.rssi) || -130,
        snr: Number(f?.snr) || 0,
        ageMs: Number(f?.ageMs) || 0,
      }))
      .filter((f: FrameIn) => f.data.length > 0 && f.data.length <= 64 && f.ageMs <= MAX_FRAME_AGE_MS);

    const downlinks: { ref: number; data: string }[] = [];
    let accepted = 0;
    for (const f of frames) {
      try {
        const dl = await processFrame(f, master, gatewayId, now);
        accepted++;
        if (dl) downlinks.push({ ref: f.ref, data: dl.toString("base64") });
      } catch (e) {
        console.error("lora frame failed", e);
      }
    }

    const stats = body.stats && typeof body.stats === "object" ? body.stats : {};
    const gwUpdate: Record<string, any> = {
      lastRequestTs: ts,
      lastSeenAt: now,
      isOnline: true,
      firmwareVersion: String(body.fw || "").slice(0, 20),
      uptimeS: num(body.uptime),
      wifiRssi: num(body.wifiRssi),
      freeHeap: num(body.heap),
      stats: {
        rxOk: num(stats.rxOk), rxBad: num(stats.rxBad), rxForeign: num(stats.rxForeign),
        txDown: num(stats.txDown), dropped: num(stats.dropped),
      },
      framesForwarded: admin.firestore.FieldValue.increment(accepted),
    };
    if (!gwSnap.exists) Object.assign(gwUpdate, { createdAt: now, name: gatewayId });
    await gwRef.set(gwUpdate, { merge: true });

    const resp: Record<string, any> = { ok: true, downlinks, serverTime: now };
    const fw = (await db.collection("firmware").doc("lora-gateway").get()).data();
    if (fw && fw.enabled !== false && fw.version && fw.url && fw.sha256 && fw.version !== body.fw &&
        gwDoc.otaDisabled !== true) {
      resp.ota = { version: fw.version, url: fw.url, sha256: fw.sha256 };
    }
    res.status(200).json(resp);
  }
);

/** Gateways that stopped checking in (every 60 s) are flagged for the admin dashboard. */
export const mark_offline_gateways = onSchedule("every 5 minutes", async () => {
  const db = admin.firestore();
  const now = Date.now();
  const online = await db.collection("gateways").where("isOnline", "==", true).get();
  await Promise.all(online.docs
    .filter((d) => now - (num(d.data().lastSeenAt) ?? 0) > 5 * 60 * 1000)
    .map((d) => d.ref.update({ isOnline: false })));
});
