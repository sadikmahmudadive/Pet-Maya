// Golden vectors shared with firmware/lora-tracker/test and pmlora::selfTest()
// (generated independently with Python `cryptography`). Run: npm test
const test = require("node:test");
const assert = require("node:assert");
const codec = require("../lib/lora_codec.js");

const KEY = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
const UPLINK_FRAME = Buffer.from(
  "113d2c1b0a2a000000c9b670ef5d0f2432d00553f367b6132359bd89d4dc2d3fd788f79773d6439b", "hex");
const DOWNLINK_FRAME = "123d2c1b0a070000004234b7670470d2cb61ebbf3716850085a94a090e4a";

test("decrypts the golden uplink", () => {
  const r = codec.openUplink(KEY, UPLINK_FRAME);
  assert.ok(r);
  assert.strictEqual(r.header.nodeId, 0x0a1b2c3d);
  assert.strictEqual(r.header.counter, 42);
  assert.deepStrictEqual(r.uplink, {
    latE7: 237808875, lngE7: 904125000, altM: 12, speedKmh: 3, hdopX10: 12, sats: 8,
    batteryPct: 87, flags: codec.UP_HAS_FIX | codec.UP_INSIDE_ZONE, fixAgeS: 2,
    fwMajor: 1, fwMinor: 0, lastDownCounter: 5,
  });
});

test("rejects a tampered uplink", () => {
  const bad = Buffer.from(UPLINK_FRAME);
  bad[12] ^= 1;
  assert.strictEqual(codec.openUplink(KEY, bad), null);
  const wrongKey = Buffer.alloc(16, 7);
  assert.strictEqual(codec.openUplink(wrongKey, UPLINK_FRAME), null);
});

test("seals the golden downlink", () => {
  const frame = codec.sealDownlink(KEY, 0x0a1b2c3d, 7, {
    intervalS: 300, flags: codec.DOWN_RING | codec.DOWN_ZONE_VALID,
    zoneLatE7: 237800000, zoneLngE7: 904100000, zoneRadiusM: 350,
  });
  assert.strictEqual(frame.toString("hex"), DOWNLINK_FRAME);
});

test("ids and keys", () => {
  assert.strictEqual(codec.deviceIdFor(0x0a1b2c3d), "PML-0A1B2C3D");
  // Must match firmware/tools/provision.py
  assert.strictEqual(codec.loraKeyFor("test", "PML-0A1B2C3D").length, 16);
  assert.strictEqual(codec.gatewaySecretFor("test", "GW-0001").length, 64);
});
