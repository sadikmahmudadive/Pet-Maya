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
bool runPortal();    // Wi-Fi + Gateway ID/secret captive portal (blocking)
void handleSerial(); // provision <id> <secret> | wifi <ssid> <pass> | status | factory-reset | reboot
}  // namespace gwsetup
