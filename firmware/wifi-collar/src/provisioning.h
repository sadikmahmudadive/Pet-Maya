#pragma once
#include <Arduino.h>

namespace provisioning {
String apName();      // "PetMaya-XXXX"
String apPassword();  // last 8 hex of the MAC (printed on the device label)

// Blocking captive portal: user picks Wi-Fi and enters the Device ID + Secret
// from the box. Saves to NVS. Returns true when credentials were stored.
bool runPortal();

// Join the stored Wi-Fi network (non-blocking: returns immediately).
void beginWifi();

// Tiny serial console for factory/bench use:
//   provision <deviceId> <secret> | status | wifi <ssid> <pass> | factory-reset | reboot
void handleSerial();
}  // namespace provisioning
