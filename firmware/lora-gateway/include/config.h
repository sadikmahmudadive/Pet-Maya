// Pet Maya LoRa gateway — hardware map and tunables.
#pragma once
#include <Arduino.h>

// ── Ra-02 (VSPI) — same wiring as the tracker ─────────────────────────────────
constexpr int PIN_LORA_NSS = 5;
constexpr int PIN_LORA_SCK = 18;
constexpr int PIN_LORA_MISO = 19;
constexpr int PIN_LORA_MOSI = 23;
constexpr int PIN_LORA_RST = 14;
constexpr int PIN_LORA_DIO0 = 26;
constexpr int PIN_LORA_DIO1 = -1;

constexpr int PIN_LED = 2;
constexpr int PIN_BUTTON = 0;  // hold 5 s at power-up = factory reset

// Downlinks are rare and short; check your local power limit.
constexpr int8_t LORA_TX_POWER_DBM = 14;

// ── Forwarding ────────────────────────────────────────────────────────────────
constexpr size_t UPLINK_QUEUE_LEN = 32;     // radio → network task
constexpr size_t DOWNLINK_QUEUE_LEN = 16;   // network → radio task
constexpr size_t STORE_FORWARD_MAX = 64;    // frames kept while the internet is down
constexpr uint32_t STORE_FORWARD_MAX_AGE_MS = 60UL * 60 * 1000;
constexpr size_t MAX_FRAMES_PER_POST = 16;
constexpr uint32_t HEARTBEAT_MS = 60000;
constexpr uint32_t HTTP_TIMEOUT_MS = 8000;
constexpr uint32_t DOWNLINK_TX_MARGIN_MS = 400;  // airtime + turnaround safety inside the RX window
constexpr size_t DOWNLINK_CACHE_SLOTS = 32;
constexpr uint32_t DOWNLINK_CACHE_TTL_MS = 2UL * 60 * 60 * 1000;

constexpr uint32_t PORTAL_TIMEOUT_S = 300;
constexpr uint32_t WATCHDOG_S = 60;
constexpr uint32_t FACTORY_RESET_HOLD_MS = 5000;
#define PORTAL_AP_PREFIX "PetMaya-GW-"

#ifdef DEBUG_LOG
#define LOGF(...) Serial.printf(__VA_ARGS__)
#else
#define LOGF(...) \
  do {            \
  } while (0)
#endif
