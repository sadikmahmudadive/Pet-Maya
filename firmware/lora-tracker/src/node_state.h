#pragma once
#include <Arduino.h>
#include <gps_tracker.h>
#include <petlogic.h>
#include <pmlora.h>

// Long-lived configuration (NVS) + per-wake state (RTC memory, survives deep sleep).
struct NodeState {
  // NVS
  uint32_t nodeId = 0;
  uint8_t key[pmlora::kKeyLen] = {0};
  bool hasKey = false;
  uint32_t intervalS = 120;
  bool lostMode = false;
  petlogic::SafeZone zone;
  uint32_t lastDownCounter = 0;

  bool provisioned() const { return nodeId != 0 && hasKey; }

  void load();
  void saveCredentials(uint32_t id, const uint8_t k[pmlora::kKeyLen]);
  void saveConfig();          // interval, lost mode, zone, last downlink counter
  uint32_t nextUpCounter();   // monotonic across reboots (persisted in blocks)
  void factoryReset();  // settings only — keeps id, key, counters
  void eraseAll();      // everything (factory/RMA)
};

// RTC-resident runtime state.
struct RtcState {
  uint32_t magic;
  uint32_t upCounter;
  uint32_t counterPersistedAt;
  uint32_t uplinks;          // since power-on
  uint8_t missedAcks;
  bool insideZone;
  bool haveFix;
  bool coldBootPending;
  uint32_t searchUntilS;  // time(nullptr) deadline for finder search mode (RTC clock survives deep sleep)
  Sample lastFix;
};

extern NodeState node;
extern RtcState rtc;
