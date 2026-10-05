// Pet Maya LoRa tracker — hardware map and tunables.
// ESP32-WROOM-32 DevKit + NEO-6M GPS + Ai-Thinker Ra-02 (SX1278 433 MHz).
#pragma once
#include <Arduino.h>

// ── Ra-02 (VSPI) ──────────────────────────────────────────────────────────────
constexpr int PIN_LORA_NSS = 5;
constexpr int PIN_LORA_SCK = 18;
constexpr int PIN_LORA_MISO = 19;
constexpr int PIN_LORA_MOSI = 23;
constexpr int PIN_LORA_RST = 14;
constexpr int PIN_LORA_DIO0 = 26;  // RX/TX-done interrupt (required)
constexpr int PIN_LORA_DIO1 = -1;  // not needed

// ── NEO-6M ────────────────────────────────────────────────────────────────────
constexpr int PIN_GPS_RX = 16;     // ESP32 RX2 ← GPS TX
constexpr int PIN_GPS_TX = 17;     // ESP32 TX2 → GPS RX (needed for power-save commands)
constexpr int PIN_GPS_EN = -1;     // load-switch gate (HIGH = on), or -1 to use u-blox backup mode
constexpr uint32_t GPS_BAUD = 9600;

// ── Other I/O ─────────────────────────────────────────────────────────────────
constexpr int PIN_BATTERY_ADC = 34;  // ADC1; LiPo through 100k/100k
constexpr float BATTERY_DIVIDER_RATIO = 2.0f;
constexpr int PIN_BUZZER = 25;
constexpr int PIN_LED = 2;
constexpr int PIN_BUTTON = 0;        // BOOT: hold 5 s at power-up = factory reset; press = send now

// ── Radio / airtime ───────────────────────────────────────────────────────────
// Keep within your local limits (e.g. EU 433 MHz SRD: 10 mW ERP). Ra-02 maxes at +20 dBm.
constexpr int8_t LORA_TX_POWER_DBM = 14;
constexpr uint16_t DUTY_CYCLE_PERMILLE = 10;  // 1 % airtime cap, enforced as a minimum interval

// ── Behaviour ─────────────────────────────────────────────────────────────────
constexpr uint32_t DEFAULT_INTERVAL_S = 120;
constexpr uint32_t MAX_INTERVAL_S = 3600;
constexpr uint32_t ESCAPE_INTERVAL_S = 30;      // auto speed-up while outside the safe zone
constexpr uint32_t DEEP_SLEEP_MIN_INTERVAL_S = 60;
constexpr uint32_t GPS_FIX_TIMEOUT_S = 45;      // per wake-up; hot start is ~1–5 s with V_BAT backup
constexpr uint32_t GPS_COLD_FIX_TIMEOUT_S = 180;  // first fix after power-on
constexpr uint8_t GPS_MIN_SATELLITES = 4;
constexpr float GPS_MAX_HDOP = 5.0f;
constexpr uint8_t ACK_EVERY_N_UPLINKS = 10;     // link check + config resync
constexpr uint8_t LINK_LOST_AFTER_MISSED_ACKS = 3;
constexpr uint32_t COUNTER_PERSIST_EVERY = 64;  // NVS write cadence for the frame counter
constexpr int LOW_BATTERY_PCT = 15;
constexpr int BATTERY_CRITICAL_PCT = 5;
constexpr uint32_t RING_DURATION_MS = 30000;
constexpr uint32_t WATCHDOG_S = 240;            // must exceed the cold-start fix timeout
constexpr uint32_t FACTORY_RESET_HOLD_MS = 5000;

#ifdef DEBUG_LOG
#define LOGF(...) Serial.printf(__VA_ARGS__)
#else
#define LOGF(...) \
  do {            \
  } while (0)
#endif
