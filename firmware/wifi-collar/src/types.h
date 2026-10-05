#pragma once
#include <Arduino.h>
#include <petlogic.h>
#include "gps_tracker.h"  // Sample

// What the server tells the collar to do after each sync.
struct Directive {
  bool ok = false;
  uint32_t intervalSec = 0;  // 0 = keep current
  bool ring = false;
  bool lostMode = false;
  petlogic::SafeZone zone;
  bool hasZone = false;
  bool hasOta = false;
  String otaUrl;
  String otaSha256;
  String otaVersion;
};

// Live telemetry attached to every upload.
struct Telemetry {
  int batteryPct;
  int batteryMv;
  int rssi;
  bool isSafe;
  bool lostMode;
  uint32_t uptimeS;
  uint32_t freeHeap;
  uint32_t droppedSamples;
};
