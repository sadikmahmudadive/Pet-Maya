#pragma once
#include <Arduino.h>
#include "types.h"

// Persistent configuration in NVS (survives power loss and OTA updates).
struct Settings {
  String deviceId;
  String deviceSecret;
  uint32_t intervalSec = 60;
  petlogic::SafeZone zone;
  bool lostMode = false;

  bool provisioned() const { return deviceId.length() >= 6 && deviceSecret.length() >= 16; }

  void load();
  void saveCredentials(const String& id, const String& secret);
  void saveRuntime();  // interval, zone, lost mode
  void factoryReset();
};

extern Settings settings;
