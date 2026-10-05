#include "console.h"
#include <battery.h>
#include <gps_tracker.h>
#include "config.h"
#include "node_state.h"

namespace console {

static bool parseHex(const String& s, uint8_t* out, size_t n) {
  if (s.length() != n * 2) return false;
  for (size_t i = 0; i < n; i++) {
    char b[3] = {s[2 * i], s[2 * i + 1], 0};
    char* end = nullptr;
    out[i] = (uint8_t)strtoul(b, &end, 16);
    if (*end) return false;
  }
  return true;
}

bool poll() {
  static String line;
  bool sendNow = false;
  while (Serial.available()) {
    const char c = (char)Serial.read();
    if (c != '\n' && c != '\r') {
      if (line.length() < 160) line += c;
      continue;
    }
    String cmd = line;
    line = "";
    cmd.trim();
    if (!cmd.length()) continue;

    if (cmd.startsWith("provision ")) {
      const int sp = cmd.indexOf(' ', 10);
      const String idHex = sp > 0 ? cmd.substring(10, sp) : "";
      const String keyHex = sp > 0 ? cmd.substring(sp + 1) : "";
      char* end = nullptr;
      const uint32_t id = strtoul(idHex.c_str(), &end, 16);
      uint8_t key[pmlora::kKeyLen];
      if (idHex.length() == 8 && !*end && id != 0 && parseHex(keyHex, key, sizeof(key))) {
        node.saveCredentials(id, key);
        Serial.println("OK provisioned, rebooting");
        delay(200);
        ESP.restart();
      } else {
        Serial.println("ERR usage: provision <nodeIdHex8> <keyHex32>");
      }
    } else if (cmd == "status") {
      char devId[13];
      pmlora::deviceIdFor(node.nodeId, devId);
      Serial.printf("fw=%d.%d device=%s provisioned=%d upCounter=%u downCounter=%u interval=%us lost=%d "
                    "zone=%d gpsFix=%d sats=%u battery=%d%% (%dmV) link=%s\n",
                    FW_MAJOR, FW_MINOR, devId, node.provisioned(), (unsigned)rtc.upCounter,
                    (unsigned)node.lastDownCounter, (unsigned)node.intervalS, node.lostMode, node.zone.valid,
                    gps::hasFix(), gps::satellites(), battery::readPercent(), battery::readMv(),
                    rtc.missedAcks >= LINK_LOST_AFTER_MISSED_ACKS ? "lost" : "ok");
    } else if (cmd == "send") {
      sendNow = true;
    } else if (cmd == "factory-reset") {
      node.factoryReset();
      Serial.println("OK settings reset, rebooting");
      delay(200);
      ESP.restart();
    } else if (cmd == "erase-all") {
      node.eraseAll();
      Serial.println("OK credentials erased, rebooting");
      delay(200);
      ESP.restart();
    } else if (cmd == "reboot") {
      ESP.restart();
    } else {
      Serial.println("commands: provision <nodeIdHex8> <keyHex32> | status | send | factory-reset | erase-all | reboot");
    }
  }
  return sendNow;
}

}  // namespace console
