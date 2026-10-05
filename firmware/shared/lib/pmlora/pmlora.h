// Pet Maya LoRa protocol (v1) — shared by the tracker, the gateway and (mirrored in
// TypeScript) the cloud function `lora_ingest`.
//
// The design follows LoRaWAN's split: gateways are dumb relays that never hold keys,
// so any Pet Maya gateway can carry any tracker, and the cloud is the "network server"
// that authenticates, de-duplicates and decrypts.
//
// Frame (over the air, max 49 bytes):
//   [0]      version(4 bits) | type(4 bits)
//   [1..4]   nodeId     uint32 LE
//   [5..8]   counter    uint32 LE   (uplink and downlink counters are independent)
//   [9..n-9] ciphertext (AES-128-CCM)
//   [n-8..]  tag        8 bytes     (CCM MIC over header + payload)
// Nonce (13 B) = nodeId LE | counter LE | direction (0 up, 1 down) | 0,0,0,0
// AAD          = the 9 header bytes.
#pragma once
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

namespace pmlora {

constexpr uint8_t kVersion = 1;
constexpr uint8_t kTypeUplink = 1;
constexpr uint8_t kTypeDownlink = 2;
constexpr uint8_t kDirUp = 0;
constexpr uint8_t kDirDown = 1;

constexpr size_t kHeaderLen = 9;
constexpr size_t kTagLen = 8;
constexpr size_t kNonceLen = 13;
constexpr size_t kKeyLen = 16;
constexpr size_t kUplinkLen = 23;
constexpr size_t kDownlinkLen = 13;
constexpr size_t kMaxFrame = kHeaderLen + kUplinkLen + kTagLen;

// ── Radio profile (both ends must match) ──────────────────────────────────────
// 433 MHz ISM. CHECK YOUR LOCAL REGULATIONS for allowed frequency, power and duty cycle.
constexpr float kFreqMHz = 433.175f;
constexpr float kBandwidthKHz = 125.0f;
constexpr uint8_t kSpreadingFactor = 9;  // ~2–5 km urban, 10+ km line of sight; ~185 ms per uplink
constexpr uint8_t kCodingRate = 5;       // 4/5
constexpr uint8_t kSyncWord = 0x12;      // private network (LoRaWAN uses 0x34)
constexpr uint16_t kPreambleLen = 8;

// Class-A style receive window: the tracker listens this long right after each uplink.
constexpr uint32_t kRxWindowMs = 3000;
// Gateway: delay between receiving an uplink and sending a cached downlink.
constexpr uint32_t kDownlinkTurnaroundMs = 150;

// ── Flags ─────────────────────────────────────────────────────────────────────
enum UpFlags : uint8_t {
  kUpHasFix = 1 << 0,
  kUpInsideZone = 1 << 1,
  kUpLostMode = 1 << 2,
  kUpAckRequest = 1 << 3,  // "please send me a downlink" (link check / config resync)
  kUpLowBattery = 1 << 4,
  kUpColdBoot = 1 << 5,    // first uplink after power-on
  kUpRinging = 1 << 6,
};
enum DownFlags : uint8_t {
  kDownRing = 1 << 0,
  kDownLostMode = 1 << 1,
  kDownZoneValid = 1 << 2,
};

struct Header {
  uint8_t version = kVersion;
  uint8_t type = 0;
  uint32_t nodeId = 0;
  uint32_t counter = 0;
};

struct Uplink {
  int32_t latE7 = 0;  // degrees × 1e7
  int32_t lngE7 = 0;
  int16_t altM = 0;
  uint8_t speedKmh = 0;
  uint8_t hdopX10 = 255;
  uint8_t sats = 0;
  uint8_t batteryPct = 0;
  uint8_t flags = 0;
  uint16_t fixAgeS = 0;          // seconds since the reported fix was taken
  uint8_t fwMajor = 0;
  uint8_t fwMinor = 0;
  uint32_t lastDownCounter = 0;  // acknowledges the newest downlink applied
};

struct Downlink {
  uint16_t intervalS = 0;
  uint8_t flags = 0;
  int32_t zoneLatE7 = 0;
  int32_t zoneLngE7 = 0;
  uint16_t zoneRadiusM = 0;
};

// ── Little-endian helpers ─────────────────────────────────────────────────────
inline void put16(uint8_t* p, uint16_t v) { p[0] = v; p[1] = v >> 8; }
inline void put32(uint8_t* p, uint32_t v) { p[0] = v; p[1] = v >> 8; p[2] = v >> 16; p[3] = v >> 24; }
inline uint16_t get16(const uint8_t* p) { return (uint16_t)(p[0] | (p[1] << 8)); }
inline uint32_t get32(const uint8_t* p) {
  return (uint32_t)p[0] | ((uint32_t)p[1] << 8) | ((uint32_t)p[2] << 16) | ((uint32_t)p[3] << 24);
}

// ── Header / nonce ────────────────────────────────────────────────────────────
inline void encodeHeader(const Header& h, uint8_t out[kHeaderLen]) {
  out[0] = (uint8_t)((h.version << 4) | (h.type & 0x0F));
  put32(out + 1, h.nodeId);
  put32(out + 5, h.counter);
}

inline bool parseHeader(const uint8_t* frame, size_t len, Header& h) {
  if (len < kHeaderLen + kTagLen) return false;
  h.version = frame[0] >> 4;
  h.type = frame[0] & 0x0F;
  h.nodeId = get32(frame + 1);
  h.counter = get32(frame + 5);
  if (h.version != kVersion) return false;
  if (h.type == kTypeUplink) return len == kHeaderLen + kUplinkLen + kTagLen;
  if (h.type == kTypeDownlink) return len == kHeaderLen + kDownlinkLen + kTagLen;
  return false;
}

inline void buildNonce(uint32_t nodeId, uint32_t counter, uint8_t dir, uint8_t out[kNonceLen]) {
  memset(out, 0, kNonceLen);
  put32(out, nodeId);
  put32(out + 4, counter);
  out[8] = dir;
}

// ── Payload codecs ────────────────────────────────────────────────────────────
inline void encodeUplink(const Uplink& u, uint8_t out[kUplinkLen]) {
  put32(out + 0, (uint32_t)u.latE7);
  put32(out + 4, (uint32_t)u.lngE7);
  put16(out + 8, (uint16_t)u.altM);
  out[10] = u.speedKmh;
  out[11] = u.hdopX10;
  out[12] = u.sats;
  out[13] = u.batteryPct;
  out[14] = u.flags;
  put16(out + 15, u.fixAgeS);
  out[17] = u.fwMajor;
  out[18] = u.fwMinor;
  put32(out + 19, u.lastDownCounter);
}

inline void decodeUplink(const uint8_t in[kUplinkLen], Uplink& u) {
  u.latE7 = (int32_t)get32(in + 0);
  u.lngE7 = (int32_t)get32(in + 4);
  u.altM = (int16_t)get16(in + 8);
  u.speedKmh = in[10];
  u.hdopX10 = in[11];
  u.sats = in[12];
  u.batteryPct = in[13];
  u.flags = in[14];
  u.fixAgeS = get16(in + 15);
  u.fwMajor = in[17];
  u.fwMinor = in[18];
  u.lastDownCounter = get32(in + 19);
}

inline void encodeDownlink(const Downlink& d, uint8_t out[kDownlinkLen]) {
  put16(out + 0, d.intervalS);
  out[2] = d.flags;
  put32(out + 3, (uint32_t)d.zoneLatE7);
  put32(out + 7, (uint32_t)d.zoneLngE7);
  put16(out + 11, d.zoneRadiusM);
}

inline void decodeDownlink(const uint8_t in[kDownlinkLen], Downlink& d) {
  d.intervalS = get16(in + 0);
  d.flags = in[2];
  d.zoneLatE7 = (int32_t)get32(in + 3);
  d.zoneLngE7 = (int32_t)get32(in + 7);
  d.zoneRadiusM = get16(in + 11);
}

// "PML-0A1B2C3D" — the Firestore devices/{id} document for a LoRa tracker.
inline void deviceIdFor(uint32_t nodeId, char out[13]) { snprintf(out, 13, "PML-%08X", (unsigned)nodeId); }

// ── Authenticated encryption (ESP32 build only; implemented with mbedTLS) ─────
// seal: header + plaintext → full frame. open: verifies the tag, then decrypts.
bool seal(const uint8_t key[kKeyLen], const Header& h, uint8_t dir, const uint8_t* plain,
          size_t plainLen, uint8_t* frameOut, size_t& frameLen);
bool open(const uint8_t key[kKeyLen], const uint8_t* frame, size_t frameLen, uint8_t dir,
          Header& h, uint8_t* plainOut, size_t& plainLen);
// Known-answer test of the crypto + framing against the shared golden vector.
bool selfTest();

}  // namespace pmlora
