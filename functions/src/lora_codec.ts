/* Pet Maya LoRa protocol v1 — TypeScript mirror of firmware/shared/lib/pmlora/pmlora.h.
 * Pure (no Firebase) so it can be unit-tested against the shared golden vectors:
 *   node --test test/   (after `npm run build`)
 */
import * as crypto from "crypto";

export const VERSION = 1;
export const TYPE_UPLINK = 1;
export const TYPE_DOWNLINK = 2;
export const HEADER_LEN = 9;
export const TAG_LEN = 8;
export const UPLINK_LEN = 23;
export const DOWNLINK_LEN = 13;

export const UP_HAS_FIX = 1 << 0;
export const UP_INSIDE_ZONE = 1 << 1;
export const UP_LOST_MODE = 1 << 2;
export const UP_ACK_REQUEST = 1 << 3;
export const UP_LOW_BATTERY = 1 << 4;
export const UP_COLD_BOOT = 1 << 5;
export const UP_RINGING = 1 << 6;

export const DOWN_RING = 1 << 0;
export const DOWN_LOST_MODE = 1 << 1;
export const DOWN_ZONE_VALID = 1 << 2;

export interface Header { version: number; type: number; nodeId: number; counter: number }

export interface Uplink {
  latE7: number; lngE7: number; altM: number; speedKmh: number; hdopX10: number; sats: number;
  batteryPct: number; flags: number; fixAgeS: number; fwMajor: number; fwMinor: number;
  lastDownCounter: number;
}

export interface Downlink {
  intervalS: number; flags: number; zoneLatE7: number; zoneLngE7: number; zoneRadiusM: number;
}

export function deviceIdFor(nodeId: number): string {
  return "PML-" + (nodeId >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

/** Per-tracker AES-128 key: first 16 bytes of HMAC-SHA256(master, "pm-lora:" + deviceId). */
export function loraKeyFor(master: string, deviceId: string): Buffer {
  return crypto.createHmac("sha256", master).update(`pm-lora:${deviceId}`).digest().subarray(0, 16);
}

/** Per-gateway API secret (hex): HMAC-SHA256(master, "gw:" + gatewayId). */
export function gatewaySecretFor(master: string, gatewayId: string): string {
  return crypto.createHmac("sha256", master).update(`gw:${gatewayId}`).digest("hex");
}

export function parseHeader(frame: Buffer): Header | null {
  if (frame.length < HEADER_LEN + TAG_LEN) return null;
  const h: Header = {
    version: frame[0] >> 4,
    type: frame[0] & 0x0f,
    nodeId: frame.readUInt32LE(1),
    counter: frame.readUInt32LE(5),
  };
  if (h.version !== VERSION) return null;
  if (h.type === TYPE_UPLINK && frame.length !== HEADER_LEN + UPLINK_LEN + TAG_LEN) return null;
  if (h.type === TYPE_DOWNLINK && frame.length !== HEADER_LEN + DOWNLINK_LEN + TAG_LEN) return null;
  if (h.type !== TYPE_UPLINK && h.type !== TYPE_DOWNLINK) return null;
  return h;
}

function nonce(nodeId: number, counter: number, dir: number): Buffer {
  const n = Buffer.alloc(13);
  n.writeUInt32LE(nodeId >>> 0, 0);
  n.writeUInt32LE(counter >>> 0, 4);
  n[8] = dir;
  return n;
}

function encodeHeader(type: number, nodeId: number, counter: number): Buffer {
  const h = Buffer.alloc(HEADER_LEN);
  h[0] = (VERSION << 4) | type;
  h.writeUInt32LE(nodeId >>> 0, 1);
  h.writeUInt32LE(counter >>> 0, 5);
  return h;
}

export function decodeUplink(p: Buffer): Uplink {
  return {
    latE7: p.readInt32LE(0), lngE7: p.readInt32LE(4), altM: p.readInt16LE(8),
    speedKmh: p[10], hdopX10: p[11], sats: p[12], batteryPct: p[13], flags: p[14],
    fixAgeS: p.readUInt16LE(15), fwMajor: p[17], fwMinor: p[18], lastDownCounter: p.readUInt32LE(19),
  };
}

export function encodeDownlink(d: Downlink): Buffer {
  const b = Buffer.alloc(DOWNLINK_LEN);
  b.writeUInt16LE(Math.max(0, Math.min(65535, Math.round(d.intervalS))), 0);
  b[2] = d.flags & 0xff;
  b.writeInt32LE(d.zoneLatE7 | 0, 3);
  b.writeInt32LE(d.zoneLngE7 | 0, 7);
  b.writeUInt16LE(Math.max(0, Math.min(65535, Math.round(d.zoneRadiusM))), 11);
  return b;
}

/** Verify (AES-128-CCM, 8-byte tag) and decrypt an uplink frame. null if forged/corrupt. */
export function openUplink(key: Buffer, frame: Buffer): { header: Header; uplink: Uplink } | null {
  const header = parseHeader(frame);
  if (!header || header.type !== TYPE_UPLINK) return null;
  const aad = frame.subarray(0, HEADER_LEN);
  const ct = frame.subarray(HEADER_LEN, frame.length - TAG_LEN);
  const tag = frame.subarray(frame.length - TAG_LEN);
  try {
    const d = crypto.createDecipheriv("aes-128-ccm", key, nonce(header.nodeId, header.counter, 0), { authTagLength: TAG_LEN });
    d.setAuthTag(tag);
    d.setAAD(aad, { plaintextLength: ct.length });
    const plain = Buffer.concat([d.update(ct), d.final()]);
    return { header, uplink: decodeUplink(plain) };
  } catch {
    return null;
  }
}

export function sealDownlink(key: Buffer, nodeId: number, counter: number, dl: Downlink): Buffer {
  const header = encodeHeader(TYPE_DOWNLINK, nodeId, counter);
  const plain = encodeDownlink(dl);
  const c = crypto.createCipheriv("aes-128-ccm", key, nonce(nodeId, counter, 1), { authTagLength: TAG_LEN });
  c.setAAD(header, { plaintextLength: plain.length });
  const ct = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([header, ct, c.getAuthTag()]);
}
