// Pet Maya LoRa Finder — offline receiver for your own trackers.
//
// Listens on the Pet Maya LoRa profile like a gateway, but instead of relaying opaque
// frames to the cloud it holds the keys of the trackers paired to it, decrypts them
// locally and streams positions to the app over BLE (works with no internet at all).
// It can also send one-shot commands (ring / search mode) back to a tracker inside the
// tracker's receive window, using the command frame type of the protocol.
//
// Trackers keep talking to gateways at the same time — one LoRa broadcast, many listeners.

#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <esp_task_wdt.h>
#include <indicators.h>
#include <pmlora.h>
#include <pmradio.h>

#include "ble_link.h"
#include "config.h"
#include "trackers.h"

namespace {
uint32_t passkey = 0;
bool radioOk = false;

String deviceIdOf(uint32_t nodeId) {
  char id[13];
  pmlora::deviceIdFor(nodeId, id);
  return String(id);
}

bool parseDeviceId(const char* s, uint32_t& nodeId) {
  if (!s || strncmp(s, "PML-", 4) != 0 || strlen(s) != 12) return false;
  char* end = nullptr;
  nodeId = strtoul(s + 4, &end, 16);
  return *end == 0 && nodeId != 0;
}

bool parseKey(const char* hex, uint8_t out[pmlora::kKeyLen]) {
  if (!hex || strlen(hex) != pmlora::kKeyLen * 2) return false;
  for (size_t i = 0; i < pmlora::kKeyLen; i++) {
    char b[3] = {hex[2 * i], hex[2 * i + 1], 0};
    char* end = nullptr;
    out[i] = (uint8_t)strtoul(b, &end, 16);
    if (*end) return false;
  }
  return true;
}

String fixJson(size_t i) {
  const PairedTracker& t = trackers::at(i);
  const TrackerLive& l = trackers::live(i);
  JsonDocument d;
  d["t"] = "fix";
  d["id"] = deviceIdOf(t.nodeId);
  if (l.up.latE7 || l.up.lngE7) {
    d["lat"] = serialized(String(l.up.latE7 / 1e7, 7));
    d["lng"] = serialized(String(l.up.lngE7 / 1e7, 7));
  }
  d["alt"] = l.up.altM;
  d["spd"] = l.up.speedKmh;
  if (l.up.hdopX10 != 255) d["hd"] = serialized(String(l.up.hdopX10 / 10.0, 1));
  d["sat"] = l.up.sats;
  d["bat"] = l.up.batteryPct;
  d["f"] = l.up.flags;
  d["age"] = l.up.fixAgeS;
  d["rssi"] = (int)lroundf(l.rssi);
  d["snr"] = serialized(String(l.snr, 1));
  d["ago"] = (millis() - l.heardMs) / 1000;
  String s;
  serializeJson(d, s);
  return s;
}

void status(const char* type, const String& id = "", const char* cmd = nullptr, const char* err = nullptr) {
  JsonDocument d;
  d["t"] = type;
  if (id.length()) d["id"] = id;
  if (cmd) d["cmd"] = cmd;
  if (err) d["err"] = err;
  String s;
  serializeJson(d, s);
  blelink::notifyStatus(s);
  LOGF("[status] %s\n", s.c_str());
}

void ack(const char* op, bool ok, const char* err = nullptr) {
  JsonDocument d;
  d["t"] = "ack";
  d["op"] = op;
  d["ok"] = ok;
  if (err) d["err"] = err;
  String s;
  serializeJson(d, s);
  blelink::notifyStatus(s);
}

const char* cmdName(uint8_t flags) {
  return (flags & pmlora::kCmdRing) && (flags & pmlora::kCmdSearch) ? "ring+search"
         : (flags & pmlora::kCmdRing)                                ? "ring"
                                                                     : "search";
}

// ── App → finder ──────────────────────────────────────────────────────────────
void handleControl(const String& raw) {
  JsonDocument d;
  if (deserializeJson(d, raw)) { ack("?", false, "bad_json"); return; }
  const char* op = d["op"] | "";
  uint32_t nodeId = 0;
  const bool hasId = parseDeviceId(d["id"] | "", nodeId);

  if (!strcmp(op, "add")) {
    uint8_t key[pmlora::kKeyLen];
    if (!hasId || !parseKey(d["key"] | "", key)) { ack(op, false, "bad_id_or_key"); return; }
    const bool ok = trackers::add(nodeId, key, d["name"] | "");
    ack(op, ok, ok ? nullptr : "full");
  } else if (!strcmp(op, "remove")) {
    const bool ok = hasId && trackers::remove(nodeId);
    ack(op, ok, ok ? nullptr : "not_found");
  } else if (!strcmp(op, "list")) {
    for (size_t i = 0; i < trackers::count(); i++) {
      JsonDocument t;
      t["t"] = "tracker";
      t["id"] = deviceIdOf(trackers::at(i).nodeId);
      t["name"] = trackers::at(i).name;
      t["heard"] = trackers::live(i).heard;
      String s;
      serializeJson(t, s);
      blelink::notifyStatus(s);
    }
    status("listEnd");
  } else if (!strcmp(op, "dump")) {
    for (size_t i = 0; i < trackers::count(); i++) {
      if (trackers::live(i).heard) blelink::notifyFix(fixJson(i));
    }
  } else if (!strcmp(op, "info")) {
    JsonDocument i;
    i["t"] = "info";
    i["fw"] = FW_VERSION;
    i["trackers"] = trackers::count();
    i["max"] = MAX_TRACKERS;
    i["radio"] = radioOk;
    i["uptime"] = millis() / 1000;
    String s;
    serializeJson(i, s);
    blelink::notifyStatus(s);
  } else if (!strcmp(op, "ring") || !strcmp(op, "search")) {
    const int idx = hasId ? trackers::indexOf(nodeId) : -1;
    if (idx < 0) { ack(op, false, "not_paired"); return; }
    TrackerLive& l = trackers::live(idx);
    const uint8_t flag = !strcmp(op, "ring") ? pmlora::kCmdRing : pmlora::kCmdSearch;
    l.cmdFlags = (l.cmdPending ? l.cmdFlags : 0) | flag;  // ring + search can travel together
    if (flag == pmlora::kCmdSearch) l.cmdSearchMinutes = (uint8_t)constrain((int)(d["min"] | DEFAULT_SEARCH_MINUTES), 0, 255);
    l.cmdPending = true;
    l.cmdCounter = 0;
    l.cmdAttempts = 0;
    status("queued", deviceIdOf(nodeId), cmdName(l.cmdFlags));
  } else {
    ack(op, false, "unknown_op");
  }
}

// ── Tracker → finder ──────────────────────────────────────────────────────────
void sendCommandIfPending(size_t i, uint32_t rxMs) {
  TrackerLive& l = trackers::live(i);
  if (!l.cmdPending) return;
  const String id = deviceIdOf(trackers::at(i).nodeId);

  // The tracker echoes the newest downlink/command counter it applied.
  if (l.cmdCounter && l.up.lastDownCounter >= l.cmdCounter) {
    l.cmdPending = false;
    status("delivered", id, cmdName(l.cmdFlags));
    return;
  }
  if (l.cmdAttempts >= COMMAND_MAX_ATTEMPTS) {
    l.cmdPending = false;
    status("failed", id, cmdName(l.cmdFlags), "no_ack");
    return;
  }

  pmlora::Command c;
  c.flags = l.cmdFlags;
  c.searchMinutes = l.cmdSearchMinutes;
  uint8_t plain[pmlora::kCommandLen];
  pmlora::encodeCommand(c, plain);
  pmlora::Header h;
  h.type = pmlora::kTypeCommand;
  h.nodeId = trackers::at(i).nodeId;
  h.counter = l.up.lastDownCounter + 1;
  uint8_t frame[pmlora::kMaxFrame];
  size_t len = 0;
  if (!pmlora::seal(trackers::at(i).key, h, pmlora::kDirDown, plain, sizeof(plain), frame, len)) return;

  while ((int32_t)(millis() - (rxMs + pmlora::kDownlinkTurnaroundMs)) < 0) delay(1);
  if (pmradio::transmit(frame, len)) {
    l.cmdCounter = h.counter;
    l.cmdAttempts++;
    indicators::flash(150);
    status("sent", id, cmdName(l.cmdFlags));
  }
  pmradio::startReceive();
}

void pollRadio() {
  if (!pmradio::packetReady()) return;
  uint8_t buf[pmlora::kMaxFrame];
  float rssi, snr;
  const int len = pmradio::read(buf, sizeof(buf), rssi, snr);
  const uint32_t rxMs = millis();
  pmradio::startReceive();
  if (len <= 0) return;

  pmlora::Header h;
  if (!pmlora::parseHeader(buf, len, h) || h.type != pmlora::kTypeUplink) return;
  const int idx = trackers::indexOf(h.nodeId);
  if (idx < 0) return;  // someone else's tracker — we can't (and shouldn't) read it

  uint8_t plain[pmlora::kUplinkLen];
  size_t plainLen = 0;
  if (!pmlora::open(trackers::at(idx).key, buf, len, pmlora::kDirUp, h, plain, plainLen)) return;
  TrackerLive& l = trackers::live(idx);
  if (l.heard && h.counter <= l.upCounter) return;  // replay / duplicate

  pmlora::decodeUplink(plain, l.up);
  l.heard = true;
  l.heardMs = rxMs;
  l.upCounter = h.counter;
  l.rssi = rssi;
  l.snr = snr;
  indicators::flash(60);
  if (PIN_BUZZER >= 0 && !blelink::connected()) indicators::chirp(3000, 40);
  LOGF("[rx] %s rssi %.0f snr %.1f fix=%d\n", trackers::at(idx).name, rssi, snr,
       (l.up.flags & pmlora::kUpHasFix) != 0);

  sendCommandIfPending(idx, rxMs);
  blelink::notifyFix(fixJson(idx));
}

// ── Serial console (bench / factory) ──────────────────────────────────────────
void handleSerial() {
  static String line;
  while (Serial.available()) {
    const char c = (char)Serial.read();
    if (c != '\n' && c != '\r') { if (line.length() < 200) line += c; continue; }
    String cmd = line;
    line = "";
    cmd.trim();
    if (!cmd.length()) continue;
    if (cmd == "status") {
      Serial.printf("fw=%s finder trackers=%u ble=%s radio=%d passkey=%06u\n", FW_VERSION,
                    (unsigned)trackers::count(), blelink::connected() ? "connected" : "advertising", radioOk,
                    (unsigned)passkey);
      for (size_t i = 0; i < trackers::count(); i++) {
        const TrackerLive& l = trackers::live(i);
        Serial.printf("  %s %-12s heard=%d ago=%lus rssi=%.0f bat=%u%% fix=%d\n",
                      deviceIdOf(trackers::at(i).nodeId).c_str(), trackers::at(i).name, l.heard,
                      l.heard ? (unsigned long)((millis() - l.heardMs) / 1000) : 0UL, l.rssi, l.up.batteryPct,
                      (l.up.flags & pmlora::kUpHasFix) != 0);
      }
    } else if (cmd.startsWith("add ")) {
      // add PML-0A1B2C3D <keyHex32> [name]
      char id[16] = {0}, key[40] = {0}, name[24] = {0};
      sscanf(cmd.c_str() + 4, "%15s %39s %23s", id, key, name);
      uint32_t nodeId;
      uint8_t k[pmlora::kKeyLen];
      const bool ok = parseDeviceId(id, nodeId) && parseKey(key, k) && trackers::add(nodeId, k, name);
      Serial.println(ok ? "OK added" : "ERR usage: add PML-XXXXXXXX <keyHex32> [name]");
    } else if (cmd.startsWith("remove ")) {
      uint32_t nodeId;
      Serial.println(parseDeviceId(cmd.substring(7).c_str(), nodeId) && trackers::remove(nodeId) ? "OK removed" : "ERR not found");
    } else if (cmd == "erase-all") {
      trackers::eraseAll();
      Serial.println("OK all trackers removed");
    } else if (cmd == "reboot") {
      ESP.restart();
    } else {
      Serial.println("commands: status | add PML-XXXXXXXX <keyHex32> [name] | remove PML-XXXXXXXX | erase-all | reboot");
    }
  }
}
}  // namespace

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_OFF);  // BLE + LoRa only
  esp_task_wdt_init(30, true);
  esp_task_wdt_add(nullptr);
  indicators::begin(PIN_LED, PIN_BUZZER);
  trackers::load();

  if (!pmlora::selfTest()) Serial.println("FATAL: crypto self-test failed");

  RadioPins rp;
  rp.nss = PIN_LORA_NSS; rp.rst = PIN_LORA_RST; rp.dio0 = PIN_LORA_DIO0; rp.dio1 = PIN_LORA_DIO1;
  rp.sck = PIN_LORA_SCK; rp.miso = PIN_LORA_MISO; rp.mosi = PIN_LORA_MOSI;
  radioOk = pmradio::begin(rp, LORA_TX_POWER_DBM);
  if (radioOk) pmradio::startReceive();
  else Serial.printf("Radio init failed (%d): check Ra-02 wiring/3.3 V supply\n", pmradio::lastError());

  const uint64_t mac = ESP.getEfuseMac();
  passkey = (uint32_t)(mac & 0xFFFFFF) % 1000000;
  char name[32];
  snprintf(name, sizeof(name), "%s%04X", BLE_NAME_PREFIX, (unsigned)((mac >> 32) & 0xFFFF));
  blelink::begin(name, passkey);

  Serial.printf("Pet Maya LoRa Finder fw %s — BLE '%s', pairing passkey %06u, %u tracker(s) paired\n",
                FW_VERSION, name, (unsigned)passkey, (unsigned)trackers::count());
}

void loop() {
  esp_task_wdt_reset();
  if (radioOk) pollRadio();

  String msg;
  while (blelink::popControl(msg)) handleControl(msg);

  handleSerial();
  indicators::update();
  static uint32_t lastLed = 0;
  if (millis() - lastLed > 1000) {
    lastLed = millis();
    indicators::setState(!radioOk                 ? LedState::LowBattery
                         : blelink::connected()   ? LedState::Online
                         : trackers::count() == 0 ? LedState::Provisioning
                                                  : LedState::NoWifi);  // advertising, no phone yet
  }
  delay(1);
}
