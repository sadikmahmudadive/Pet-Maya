#include "forwarder.h"
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <esp_task_wdt.h>
#include <mbedtls/base64.h>
#include <mbedtls/md.h>
#include <ota.h>
#include <time.h>
#include <deque>
#include "config.h"
#include "gw_settings.h"
#include "shared_types.h"

extern const uint8_t rootca_crt_bundle_start[] asm("_binary_x509_crt_bundle_start");

namespace forwarder {
namespace {
volatile bool cloudOk = false;
std::deque<RxFrame> backlog;  // store-and-forward while offline
uint32_t lastHeartbeat = 0;
uint32_t lastWifiAttempt = 0;
uint32_t lastOtaTry = 0;

String hmacHex(const String& key, const String& msg) {
  uint8_t out[32];
  mbedtls_md_hmac(mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), (const uint8_t*)key.c_str(), key.length(),
                  (const uint8_t*)msg.c_str(), msg.length(), out);
  static const char* hex = "0123456789abcdef";
  String s;
  s.reserve(64);
  for (uint8_t b : out) { s += hex[b >> 4]; s += hex[b & 15]; }
  return s;
}

String b64(const uint8_t* data, size_t len) {
  unsigned char out[96];
  size_t olen = 0;
  mbedtls_base64_encode(out, sizeof(out), &olen, data, len);
  return String((const char*)out, olen);
}

bool timeValid() { return time(nullptr) > 1735689600; }

void ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (millis() - lastWifiAttempt < 15000 && lastWifiAttempt) return;
  lastWifiAttempt = millis();
  WiFi.disconnect();
  WiFi.begin();
}

void enqueueBacklog(const RxFrame& f) {
  if (backlog.size() >= STORE_FORWARD_MAX) {
    backlog.pop_front();
    stats.dropped++;
  }
  backlog.push_back(f);
}

void pruneBacklog() {
  const uint32_t now = millis();
  while (!backlog.empty() && now - backlog.front().rxMs > STORE_FORWARD_MAX_AGE_MS) {
    backlog.pop_front();
    stats.dropped++;
  }
}

// POST a batch. On success hands downlinks to the radio task and returns true.
bool post(std::vector<RxFrame>& batch) {
  JsonDocument doc;
  doc["fw"] = FW_VERSION;
  doc["uptime"] = millis() / 1000;
  doc["wifiRssi"] = WiFi.RSSI();
  doc["heap"] = ESP.getFreeHeap();
  JsonObject st = doc["stats"].to<JsonObject>();
  st["rxOk"] = stats.rxOk;
  st["rxBad"] = stats.rxBad;
  st["rxForeign"] = stats.rxForeign;
  st["txDown"] = stats.txDown;
  st["dropped"] = stats.dropped;
  JsonArray frames = doc["frames"].to<JsonArray>();
  const uint32_t now = millis();
  for (auto& f : batch) {
    JsonObject o = frames.add<JsonObject>();
    o["ref"] = f.ref;
    o["data"] = b64(f.data, f.len);
    o["rssi"] = serialized(String(f.rssi, 1));
    o["snr"] = serialized(String(f.snr, 1));
    o["ageMs"] = now - f.rxMs;
  }
  String body;
  serializeJson(doc, body);

  const String ts = String((uint32_t)time(nullptr));
  WiFiClientSecure client;
  client.setCACertBundle(rootca_crt_bundle_start);
  HTTPClient http;
  http.setConnectTimeout(HTTP_TIMEOUT_MS);
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(client, LORA_INGEST_URL)) return false;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Gateway-Id", gw.gatewayId);
  http.addHeader("X-Timestamp", ts);
  http.addHeader("X-Signature", hmacHex(gw.secret, ts + "." + body));
  http.addHeader("User-Agent", String("PetMayaGateway/") + FW_VERSION);

  const int code = http.POST(body);
  if (code != 200) {
    LOGF("[fwd] HTTP %d\n", code);
    http.end();
    return false;
  }
  JsonDocument resp;
  const bool parsed = !deserializeJson(resp, http.getString());
  http.end();
  if (!parsed || !(resp["ok"] | false)) return false;

  for (JsonObject d : resp["downlinks"].as<JsonArray>()) {
    const uint32_t ref = d["ref"] | 0;
    const char* data = d["data"] | "";
    TxFrame tx{};
    size_t olen = 0;
    if (mbedtls_base64_decode(tx.data, sizeof(tx.data), &olen, (const unsigned char*)data, strlen(data)) != 0) continue;
    pmlora::Header h;
    if (!pmlora::parseHeader(tx.data, olen, h) || h.type != pmlora::kTypeDownlink) continue;
    tx.len = (uint8_t)olen;
    tx.nodeId = h.nodeId;
    tx.forRxMs = 0;
    tx.deadlineMs = 0;
    for (auto& f : batch) {
      if (f.ref == ref) {
        tx.forRxMs = f.rxMs;
        tx.deadlineMs = f.rxMs + pmlora::kRxWindowMs - DOWNLINK_TX_MARGIN_MS;
        break;
      }
    }
    xQueueSend(downlinkQueue, &tx, 0);
  }

  JsonObject o = resp["ota"];
  if (!o.isNull() && String(o["version"] | "") != FW_VERSION &&
      (lastOtaTry == 0 || millis() - lastOtaTry > 3600000UL)) {
    lastOtaTry = millis();
    ota::apply(o["url"] | "", o["sha256"] | "");  // reboots on success
  }
  return true;
}

void task(void*) {
  esp_task_wdt_add(nullptr);
  std::vector<RxFrame> batch;
  batch.reserve(MAX_FRAMES_PER_POST);
  configTime(0, 0, "pool.ntp.org", "time.google.com");
  uint32_t ref = 1;

  for (;;) {
    esp_task_wdt_reset();
    ensureWifi();

    // Wait briefly for the first uplink, then take whatever else is queued.
    RxFrame f;
    if (xQueueReceive(uplinkQueue, &f, pdMS_TO_TICKS(500)) == pdTRUE) {
      do {
        f.ref = ref++;
        enqueueBacklog(f);
      } while (xQueueReceive(uplinkQueue, &f, 0) == pdTRUE);
    }
    pruneBacklog();

    const bool heartbeatDue = millis() - lastHeartbeat > HEARTBEAT_MS;
    if ((backlog.empty() && !heartbeatDue) || WiFi.status() != WL_CONNECTED || !timeValid()) {
      if (WiFi.status() != WL_CONNECTED) cloudOk = false;
      continue;
    }

    batch.clear();
    for (size_t i = 0; i < backlog.size() && batch.size() < MAX_FRAMES_PER_POST; i++) batch.push_back(backlog[i]);
    if (post(batch)) {
      for (size_t i = 0; i < batch.size(); i++) backlog.pop_front();
      lastHeartbeat = millis();
      cloudOk = true;
    } else {
      cloudOk = false;
      vTaskDelay(pdMS_TO_TICKS(2000));  // back off; frames stay in the backlog
    }
  }
}
}  // namespace

void start() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.setSleep(false);  // gateway is mains powered; keep latency low for downlinks
  WiFi.begin();
  xTaskCreatePinnedToCore(task, "forwarder", 12288, nullptr, 1, nullptr, 0);
}

bool online() { return cloudOk; }

}  // namespace forwarder
