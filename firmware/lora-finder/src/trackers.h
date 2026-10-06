#pragma once
#include <Arduino.h>
#include <pmlora.h>

// A tracker this finder may decrypt (key delivered once by the app at pairing time).
struct PairedTracker {
  uint32_t nodeId;
  uint8_t key[pmlora::kKeyLen];
  char name[24];
};

// What we last heard from it, plus any command queued for it by the app.
struct TrackerLive {
  bool heard = false;
  uint32_t heardMs = 0;
  uint32_t upCounter = 0;
  pmlora::Uplink up;
  float rssi = 0;
  float snr = 0;
  // pending command
  bool cmdPending = false;
  uint8_t cmdFlags = 0;
  uint8_t cmdSearchMinutes = 0;
  uint32_t cmdCounter = 0;  // counter used for the last attempt (0 = not sent yet)
  uint8_t cmdAttempts = 0;
};

namespace trackers {
void load();
size_t count();
PairedTracker& at(size_t i);
TrackerLive& live(size_t i);
int indexOf(uint32_t nodeId);
bool add(uint32_t nodeId, const uint8_t key[pmlora::kKeyLen], const char* name);  // replaces if present
bool remove(uint32_t nodeId);
void eraseAll();
}  // namespace trackers
