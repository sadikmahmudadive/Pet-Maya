#include "cloud_client.h"
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <mbedtls/md.h>
#include <time.h>
#include "config.h"
#include "gps_tracker.h"
#include "settings.h"

// Mozilla root bundle compiled into the Arduino-ESP32 core (covers Google Trust Services),
// so TLS is fully verified without pinning a single certificate that could expire.
extern const uint8_t rootca_crt_bundle_start[] asm("_binary_x509_crt_bundle_start");

namespace cloud {

String hmacSha256Hex(const String& key, const String& message) {
  uint8_t out[32];
  const mbedtls_md_info_t* info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  mbedtls_md_hmac(info, (const uint8_t*)key.c_str(), key.length(), (const uint8_t*)message.c_str(),
                  message.length(), out);
  static const char* hex = "0123456789abcdef";
  String s;
  s.reserve(64);
  for (int i = 0; i < 32; i++) {
    s += hex[out[i] >> 4];
    s += hex[out[i] & 15];
  }
  return s;
}

bool ensureTime() {
  auto valid = [] { return time(nullptr) > 1735689600; };  // after 2025-01-01
  if (valid()) return true;
  if (WiFi.status() == WL_CONNECTED) {
    configTime(0, 0, "pool.ntp.org", "time.google.com");
    for (int i = 0; i < 40 && !valid(); i++) delay(125);  // up to 5 s
  }
  if (!valid()) gps::syncClockFromGps();
  return valid();
}

static bool parseDirective(const String& payload, Directive& d) {
  JsonDocument doc;
  if (deserializeJson(doc, payload)) return false;
  d.ok = doc["ok"] | false;
  d.intervalSec = doc["intervalSec"] | 0;
  d.ring = doc["ring"] | false;
  d.lostMode = doc["lostMode"] | false;
  JsonObject z = doc["safeZone"];
  if (!z.isNull()) {
    d.hasZone = true;
    d.zone.valid = true;
    d.zone.lat = z["lat"] | 0.0;
    d.zone.lng = z["lng"] | 0.0;
    d.zone.radiusM = z["radiusM"] | 0.0f;
    if (d.zone.radiusM < 10) d.zone.valid = false;
  }
  JsonObject o = doc["ota"];
  if (!o.isNull()) {
    d.hasOta = true;
    d.otaUrl = o["url"] | "";
    d.otaSha256 = o["sha256"] | "";
    d.otaVersion = o["version"] | "";
  }
  return d.ok;
}

bool sync(const Sample* samples, size_t count, const Telemetry& t, Directive& out, int& httpCode) {
  JsonDocument doc;
  doc["fw"] = FW_VERSION;
  doc["battery"] = t.batteryPct;
  doc["batteryMv"] = t.batteryMv;
  doc["rssi"] = t.rssi;
  doc["isSafe"] = t.isSafe;
  doc["lostMode"] = t.lostMode;
  doc["uptime"] = t.uptimeS;
  doc["heap"] = t.freeHeap;
  doc["dropped"] = t.droppedSamples;
  JsonArray arr = doc["samples"].to<JsonArray>();
  for (size_t i = 0; i < count && i < MAX_SAMPLES_PER_POST; i++) {
    JsonObject s = arr.add<JsonObject>();
    s["ts"] = samples[i].ts;
    s["lat"] = serialized(String(samples[i].lat, 6));
    s["lng"] = serialized(String(samples[i].lng, 6));
    s["spd"] = serialized(String(samples[i].speedKmh, 1));
    s["hdop"] = serialized(String(samples[i].hdop, 1));
    s["alt"] = serialized(String(samples[i].altM, 0));
    s["sats"] = samples[i].sats;
  }
  String body;
  serializeJson(doc, body);

  const String ts = String((uint32_t)time(nullptr));
  const String sig = hmacSha256Hex(settings.deviceSecret, ts + "." + body);

  WiFiClientSecure client;
  client.setCACertBundle(rootca_crt_bundle_start);
  client.setTimeout(HTTP_TIMEOUT_MS / 1000);

  HTTPClient http;
  http.setConnectTimeout(HTTP_TIMEOUT_MS);
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.setReuse(false);
  if (!http.begin(client, INGEST_URL)) return false;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", settings.deviceId);
  http.addHeader("X-Timestamp", ts);
  http.addHeader("X-Signature", sig);
  http.addHeader("User-Agent", String("PetMayaCollar/") + FW_VERSION);

  httpCode = http.POST(body);
  bool ok = false;
  if (httpCode == 200) {
    ok = parseDirective(http.getString(), out);
  } else {
    LOGF("[cloud] HTTP %d %s\n", httpCode, http.errorToString(httpCode).c_str());
  }
  http.end();
  return ok;
}

}  // namespace cloud
