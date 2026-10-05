/* Shared by the Wi-Fi collar (device_ingest) and LoRa (lora_ingest) pipelines. */
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";

/** Root of all device/gateway credentials. Never leaves Secret Manager + the factory tool. */
export const DEVICE_MASTER_SECRET = defineSecret("DEVICE_MASTER_SECRET");
export const MAX_CLOCK_SKEW_S = 300;

export function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** "Real-Time (10s)" → 10, "Balanced (5m)" → 300, "Lost mode (5 s)" → 5. */
export function intervalFromMode(mode: unknown, lost: boolean): number {
  if (lost) return 5;
  const m = String(mode ?? "").match(/\((\d+)\s*(s|sec|m|min)\b/i);
  if (!m) return 60;
  const n = Number(m[1]) * (m[2].toLowerCase().startsWith("m") ? 60 : 1);
  return Math.min(Math.max(n, 5), 3600);
}

export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * 6371000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Safe zone configured in the apps (web Gps page fields). */
export function safeZoneOf(dev: Record<string, any>): { lat: number; lng: number; radiusM: number } | null {
  const lat = num(dev.homeLat);
  const lng = num(dev.homeLng);
  if (!lat || !lng) return null;
  return { lat, lng, radiusM: num(dev.safeZoneRadius) ?? 350 };
}

/**
 * Owner alerts on state transitions (left safe zone, low battery). Mutates `update`
 * with the de-bounce flags and returns the notification writes to await.
 * push_on_notification turns each notification doc into a push.
 */
export function deviceAlerts(
  dev: Record<string, any>, isSafe: boolean, battery: number, update: Record<string, any>, now: number,
): Promise<unknown>[] {
  const db = admin.firestore();
  const ownerId = dev.ownerId || dev.userId;
  const petName = dev.petName || "Your pet";
  const writes: Promise<unknown>[] = [];
  const notify = (title: string, text: string) => {
    if (!ownerId) return;
    writes.push(db.collection("notifications").doc(String(ownerId)).collection("items").add({
      title, body: text, category: "health", type: "health", read: false, isRead: false, timestamp: now,
    }));
  };
  if (!isSafe && dev.isSafeZone !== false) {
    notify(`🚨 ${petName} left the safe zone`,
      `${petName}'s collar is outside its safe zone. Open Live Tracking to see where they are.`);
  }
  if (battery <= 15 && dev.lowBatteryNotified !== true) {
    notify("🔋 Collar battery low", `${petName}'s collar is at ${battery}%. Charge it soon.`);
    update.lowBatteryNotified = true;
  } else if (battery >= 30 && dev.lowBatteryNotified === true) {
    update.lowBatteryNotified = false;
  }
  return writes;
}

export function newDeviceDefaults(deviceId: string, now: number, extra: Record<string, any> = {}) {
  return {
    serialNumber: deviceId, name: "Pet Maya ProTrack", deviceType: "gps_collar",
    modelNumber: "PetMaya ProTrack Gen 2", claimed: false, createdAt: now, ...extra,
  };
}
