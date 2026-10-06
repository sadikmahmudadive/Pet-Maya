// Pet Maya LoRa Finder — hardware map and tunables.
#pragma once
#include <Arduino.h>

// ── Ra-02 (VSPI) — same wiring as the tracker and gateway ─────────────────────
constexpr int PIN_LORA_NSS = 5;
constexpr int PIN_LORA_SCK = 18;
constexpr int PIN_LORA_MISO = 19;
constexpr int PIN_LORA_MOSI = 23;
constexpr int PIN_LORA_RST = 14;
constexpr int PIN_LORA_DIO0 = 26;
constexpr int PIN_LORA_DIO1 = -1;

constexpr int PIN_LED = 2;
constexpr int PIN_BUZZER = 25;   // optional: chirps when a paired tracker is heard (-1 to disable)

// Commands are tiny and rare; check your local power limit.
constexpr int8_t LORA_TX_POWER_DBM = 14;

constexpr size_t MAX_TRACKERS = 8;             // trackers this finder can decrypt
constexpr uint8_t COMMAND_MAX_ATTEMPTS = 6;    // re-send a command on this many uplinks until acknowledged
constexpr uint8_t DEFAULT_SEARCH_MINUTES = 30;
constexpr uint32_t BLE_MTU = 247;
#define BLE_NAME_PREFIX "PetMaya-Finder-"

#ifdef DEBUG_LOG
#define LOGF(...) Serial.printf(__VA_ARGS__)
#else
#define LOGF(...) \
  do {            \
  } while (0)
#endif
