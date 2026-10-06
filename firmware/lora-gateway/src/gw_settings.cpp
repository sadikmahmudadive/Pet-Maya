#include "gw_settings.h"
#include <Preferences.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <esp_wifi.h>
#include <indicators.h>
#include "config.h"
#include "shared_types.h"

GatewaySettings gw;
static const char* NS = "pmgw";

void GatewaySettings::load() {
  Preferences p;
  p.begin(NS, false);  // read-write: creates the namespace on first boot
  gatewayId = p.getString("id", "");
  secret = p.getString("secret", "");
  p.end();
}

void GatewaySettings::save(const String& id, const String& sec) {
  Preferences p;
  p.begin(NS, false);
  p.putString("id", id);
  p.putString("secret", sec);
  p.end();
  gatewayId = id;
  secret = sec;
}

void GatewaySettings::factoryReset() {
  Preferences p;
  p.begin(NS, false);
  p.clear();
  p.end();
  WiFi.disconnect(true, true);
  *this = GatewaySettings();
}

namespace gwsetup {

static String macHex() {
  char b[13];
  snprintf(b, sizeof(b), "%012llX", (unsigned long long)ESP.getEfuseMac());
  return String(b);
}

String apName() { return String(PORTAL_AP_PREFIX) + macHex().substring(8); }
String apPassword() { return macHex().substring(4); }

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
  wm.setTitle("Pet Maya Gateway Setup");

  WiFiManagerParameter pId("gwid", "Gateway ID (on the box)", gw.gatewayId.c_str(), 40);
  WiFiManagerParameter pSecret("secret", "Gateway secret (on the box)", "", 72, "type='password'");
  wm.addParameter(&pId);
  wm.addParameter(&pSecret);
  wm.setSaveParamsCallback([&] {
    String id = pId.getValue();
    String sec = pSecret.getValue();
    id.trim();
    sec.trim();
    if (id.length() >= 6 && (sec.length() >= 16 || gw.secret.length() >= 16)) {
      gw.save(id, sec.length() ? sec : gw.secret);
    }
  });
  wm.startConfigPortal(apName().c_str(), apPassword().c_str());

  // Done when we have an identity (portal or `provision`) and a working Wi-Fi
  // (portal or `wifi <ssid> <pass>`); give up on the portal timeout.
  while (!(gw.provisioned() && WiFi.status() == WL_CONNECTED)) {
    wm.process();
    handleSerial();
    indicators::update();
    if (!wm.getConfigPortalActive() && WiFi.status() != WL_CONNECTED) return;
    delay(5);
  }
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
    String cmd = line;
    line = "";
    cmd.trim();
    if (!cmd.length()) continue;

    if (cmd.startsWith("provision ")) {
      const int sp = cmd.indexOf(' ', 10);
      if (sp > 10) {
        gw.save(cmd.substring(10, sp), cmd.substring(sp + 1));
        Serial.println("OK saved, rebooting");
        delay(200);
        ESP.restart();
      } else {
        Serial.println("ERR usage: provision <gatewayId> <secret>");
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
      Serial.printf("fw=%s id=%s provisioned=%d wifi=%s rssi=%d rxOk=%u rxBad=%u foreign=%u txDown=%u dropped=%u heap=%u\n",
                    FW_VERSION, gw.gatewayId.c_str(), gw.provisioned(),
                    WiFi.status() == WL_CONNECTED ? WiFi.SSID().c_str() : "-", WiFi.RSSI(),
                    (unsigned)stats.rxOk, (unsigned)stats.rxBad, (unsigned)stats.rxForeign,
                    (unsigned)stats.txDown, (unsigned)stats.dropped, (unsigned)ESP.getFreeHeap());
    } else if (cmd == "factory-reset") {
      gw.factoryReset();
      Serial.println("OK reset, rebooting");
      delay(200);
      ESP.restart();
    } else if (cmd == "reboot") {
      ESP.restart();
    } else {
      Serial.println("commands: provision <gatewayId> <secret> | wifi <ssid> <pass> | status | factory-reset | reboot");
    }
  }
}

}  // namespace gwsetup
