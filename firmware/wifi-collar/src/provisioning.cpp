#include "provisioning.h"
#include <WiFi.h>
#include <WiFiManager.h>
#include <esp_task_wdt.h>
#include <esp_wifi.h>
#include "battery.h"
#include "config.h"
#include "gps_tracker.h"
#include "indicators.h"
#include "settings.h"

namespace provisioning {

static String macHex() {
  char b[13];
  snprintf(b, sizeof(b), "%012llX", (unsigned long long)ESP.getEfuseMac());
  return String(b);
}

String apName() { return String(PORTAL_AP_PREFIX) + macHex().substring(8); }
String apPassword() { return macHex().substring(4); }

void beginWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.setSleep(true);  // modem sleep between beacons
  WiFi.begin();         // uses the credentials saved by the portal
}

bool hasSavedWifi() {
  WiFi.mode(WIFI_STA);
  wifi_config_t conf;
  return esp_wifi_get_config(WIFI_IF_STA, &conf) == ESP_OK && conf.sta.ssid[0] != 0;
}

void runPortal() {
  indicators::setState(LedState::Provisioning);
  WiFiManager wm;
  wm.setDebugOutput(false);
  wm.setConfigPortalBlocking(false);  // keep serving the serial console while the portal is up
  wm.setConfigPortalTimeout(PORTAL_TIMEOUT_S);
  wm.setTitle("Pet Maya Collar Setup");

  WiFiManagerParameter pId("devid", "Device ID (on the box)", settings.deviceId.c_str(), 40);
  WiFiManagerParameter pSecret("secret", "Device secret (on the box)", "", 72, "type='password'");
  wm.addParameter(&pId);
  wm.addParameter(&pSecret);
  wm.setSaveParamsCallback([&] {
    String id = pId.getValue();
    String sec = pSecret.getValue();
    id.trim();
    sec.trim();
    if (id.length() >= 6 && (sec.length() >= 16 || settings.deviceSecret.length() >= 16)) {
      settings.saveCredentials(id, sec.length() ? sec : settings.deviceSecret);
    }
  });
  wm.startConfigPortal(apName().c_str(), apPassword().c_str());

  while (!(settings.provisioned() && WiFi.status() == WL_CONNECTED)) {
    esp_task_wdt_reset();
    wm.process();
    handleSerial();
    indicators::update();
    if (!wm.getConfigPortalActive() && WiFi.status() != WL_CONNECTED) return;
    delay(5);
  }
  indicators::chirp(2600, 180);
  delay(500);
}

void handleSerial() {
  static String line;
  while (Serial.available()) {
    const char c = (char)Serial.read();
    if (c != '\n' && c != '\r') {
      if (line.length() < 200) line += c;
      continue;
    }
    if (line.length() == 0) continue;
    String cmd = line;
    line = "";
    cmd.trim();

    if (cmd.startsWith("provision ")) {
      const int sp = cmd.indexOf(' ', 10);
      if (sp > 10) {
        settings.saveCredentials(cmd.substring(10, sp), cmd.substring(sp + 1));
        Serial.println("OK credentials saved");
      } else {
        Serial.println("ERR usage: provision <deviceId> <secret>");
      }
    } else if (cmd.startsWith("wifi ")) {
      const int sp = cmd.indexOf(' ', 5);
      const String ssid = sp > 0 ? cmd.substring(5, sp) : cmd.substring(5);
      const String pass = sp > 0 ? cmd.substring(sp + 1) : "";
      WiFi.persistent(true);
      WiFi.mode(WIFI_STA);
      WiFi.begin(ssid.c_str(), pass.c_str());
      Serial.println("OK connecting");
    } else if (cmd == "status") {
      Serial.printf("fw=%s id=%s provisioned=%d wifi=%s rssi=%d gpsFix=%d sats=%u battery=%d%% (%dmV) interval=%us lost=%d\n",
                    FW_VERSION, settings.deviceId.c_str(), settings.provisioned(),
                    WiFi.status() == WL_CONNECTED ? WiFi.SSID().c_str() : "-", WiFi.RSSI(), gps::hasFix(),
                    gps::satellites(), battery::readPercent(), battery::readMv(),
                    (unsigned)settings.intervalSec, settings.lostMode);
    } else if (cmd == "factory-reset") {
      settings.factoryReset();
      Serial.println("OK reset, rebooting");
      delay(200);
      ESP.restart();
    } else if (cmd == "reboot") {
      ESP.restart();
    } else {
      Serial.println("commands: provision <id> <secret> | wifi <ssid> <pass> | status | factory-reset | reboot");
    }
  }
}

}  // namespace provisioning
