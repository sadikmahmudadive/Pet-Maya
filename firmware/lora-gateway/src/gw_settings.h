#pragma once
#include <Arduino.h>

struct GatewaySettings {
  String gatewayId;
  String secret;
  bool provisioned() const { return gatewayId.length() >= 6 && secret.length() >= 16; }
  void load();
  void save(const String& id, const String& sec);
  void factoryReset();
};

extern GatewaySettings gw;

namespace gwsetup {
String apName();
String apPassword();
bool hasSavedWifi();
// Captive portal for Wi-Fi + Gateway ID/secret. Serial commands keep working while it runs.
// Returns when fully set up or when the portal times out.
void runPortal();
void handleSerial(); // provision <id> <secret> | wifi <ssid> <pass> | status | factory-reset | reboot
}  // namespace gwsetup
