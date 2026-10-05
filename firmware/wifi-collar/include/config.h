// Hardware map and tunables for the Pet Maya ProTrack collar (ESP32-WROOM-32 DevKit).
#pragma once
#include <Arduino.h>

// ── Pins (ADC1 only: ADC2 is unusable while Wi-Fi is on) ──────────────────────
constexpr int PIN_GPS_RX = 16;       // ESP32 RX2  ← GPS module TX
constexpr int PIN_GPS_TX = 17;       // ESP32 TX2  → GPS module RX
constexpr int PIN_GPS_EN = 4;        // HIGH = GPS powered (load switch). Set -1 if GPS is hard-wired on.
constexpr int PIN_BATTERY_ADC = 34;  // ADC1_CH6, input-only; LiPo through a 100k/100k divider
constexpr int PIN_BUZZER = 25;       // piezo (via transistor) — "find my pet" sound
constexpr int PIN_LED = 2;           // DevKit on-board LED
constexpr int PIN_BUTTON = 0;        // BOOT button: hold 5 s at power-up to factory reset

// ── Sensors ───────────────────────────────────────────────────────────────────
constexpr uint32_t GPS_BAUD = 9600;             // NEO-6M / NEO-M8N default
constexpr float BATTERY_DIVIDER_RATIO = 2.0f;   // (R1+R2)/R2
constexpr int GPS_MIN_SATELLITES = 4;
constexpr float GPS_MAX_HDOP = 5.0f;
constexpr uint32_t GPS_FIX_TIMEOUT_MS = 60000;  // duty-cycled mode: wait this long for a fix

// ── Reporting ─────────────────────────────────────────────────────────────────
constexpr uint32_t DEFAULT_INTERVAL_S = 60;            // until the server says otherwise
constexpr uint32_t MIN_INTERVAL_S = 5;                 // lost mode
constexpr uint32_t MAX_INTERVAL_S = 3600;
constexpr uint32_t DEEP_SLEEP_MIN_INTERVAL_S = 300;    // ≥ this → power-gate GPS and deep-sleep between fixes
constexpr size_t SAMPLE_BUFFER = 24;                   // fixes kept while offline (survives deep sleep)
constexpr size_t MAX_SAMPLES_PER_POST = 24;
constexpr uint32_t HTTP_TIMEOUT_MS = 12000;
constexpr uint32_t WIFI_RETRY_MS = 30000;
constexpr uint32_t WIFI_CONNECT_TIMEOUT_MS = 20000;

// ── Safety ────────────────────────────────────────────────────────────────────
constexpr int BATTERY_CRITICAL_PCT = 5;     // below this: stop radios, sleep to protect the cell
constexpr int OTA_MIN_BATTERY_PCT = 40;     // never flash on a weak battery
constexpr uint32_t WATCHDOG_S = 60;
constexpr uint32_t RING_DURATION_MS = 30000;
constexpr uint32_t FACTORY_RESET_HOLD_MS = 5000;

// ── Provisioning ──────────────────────────────────────────────────────────────
constexpr uint32_t PORTAL_TIMEOUT_S = 300;
#define PORTAL_AP_PREFIX "PetMaya-"           // + last 4 hex of MAC

#ifdef DEBUG_LOG
#define LOGF(...) Serial.printf(__VA_ARGS__)
#else
#define LOGF(...) \
  do {            \
  } while (0)
#endif
