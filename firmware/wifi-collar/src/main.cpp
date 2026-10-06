// Pet Maya ProTrack collar — main application.
//
// Two operating modes, chosen from the reporting interval the server sends:
//  • Continuous  (interval < 300 s, or lost mode): GPS stays on, CPU idles in modem sleep.
//  • Duty-cycled (interval ≥ 300 s, GPS power-gated): wake → fix → upload → deep sleep.
// Fixes are buffered in RTC memory, so nothing is lost while Wi-Fi is away or across sleeps.

#include <Arduino.h>
#include <WiFi.h>
#include <driver/gpio.h>
#include <esp_sleep.h>
#include <esp_task_wdt.h>

#include "battery.h"
#include "cloud_client.h"
#include "config.h"
#include "gps_tracker.h"
#include "indicators.h"
#include "ota.h"
#include "provisioning.h"
#include "settings.h"

// ── RTC-resident state (survives deep sleep, cleared on power loss) ───────────
RTC_DATA_ATTR static Sample rtcBuf[SAMPLE_BUFFER];
RTC_DATA_ATTR static uint8_t rtcCount = 0;
RTC_DATA_ATTR static uint32_t rtcDropped = 0;
RTC_DATA_ATTR static bool rtcSafe = true;
RTC_DATA_ATTR static uint32_t rtcLastOtaTry = 0;

static uint32_t lastCycleMs = 0;
static uint32_t lastWifiAttemptMs = 0;
static bool wokeFromTimer = false;

// ── Sample buffer ─────────────────────────────────────────────────────────────
static void bufferPush(const Sample& s) {
  if (rtcCount == SAMPLE_BUFFER) {  // drop the oldest
    memmove(&rtcBuf[0], &rtcBuf[1], sizeof(Sample) * (SAMPLE_BUFFER - 1));
    rtcCount--;
    rtcDropped++;
  }
  rtcBuf[rtcCount++] = s;
}

static void bufferConsume(size_t n) {
  if (n >= rtcCount) { rtcCount = 0; return; }
  memmove(&rtcBuf[0], &rtcBuf[n], sizeof(Sample) * (rtcCount - n));
  rtcCount -= n;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
static bool dutyCycled() {
  return PIN_GPS_EN >= 0 && !settings.lostMode && settings.intervalSec >= DEEP_SLEEP_MIN_INTERVAL_S;
}

[[noreturn]] static void deepSleepFor(uint32_t seconds) {
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  gps::power(false);
  digitalWrite(PIN_LED, LOW);
  if (PIN_GPS_EN >= 0) {  // keep the GPS load switch off while sleeping
    gpio_hold_en((gpio_num_t)PIN_GPS_EN);
    gpio_deep_sleep_hold_en();
  }
  esp_sleep_enable_timer_wakeup((uint64_t)seconds * 1000000ULL);
  esp_sleep_enable_ext0_wakeup((gpio_num_t)PIN_BUTTON, 0);  // button wakes the collar early
  esp_deep_sleep_start();
  while (true) {}
}

static void ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  const uint32_t now = millis();
  if (now - lastWifiAttemptMs < WIFI_RETRY_MS && lastWifiAttemptMs != 0) return;
  lastWifiAttemptMs = now;
  WiFi.disconnect();
  WiFi.begin();
}

static bool waitForWifi(uint32_t timeoutMs) {
  const uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < timeoutMs) {
    esp_task_wdt_reset();
    gps::poll();
    indicators::update();
    delay(20);
  }
  return WiFi.status() == WL_CONNECTED;
}

static void captureSample() {
  Sample s;
  if (!gps::read(s)) return;
  bufferPush(s);
  if (settings.zone.valid) {
    rtcSafe = petlogic::isInsideSafeZone(settings.zone, s.lat, s.lng, rtcSafe);
  } else {
    rtcSafe = true;
  }
}

static void applyDirective(const Directive& d, int batteryPct) {
  bool changed = false;
  if (d.intervalSec) {
    const uint32_t iv = constrain(d.intervalSec, MIN_INTERVAL_S, MAX_INTERVAL_S);
    if (iv != settings.intervalSec) { settings.intervalSec = iv; changed = true; }
  }
  if (d.lostMode != settings.lostMode) { settings.lostMode = d.lostMode; changed = true; }
  if (d.hasZone) {
    const auto& z = d.zone;
    if (z.valid != settings.zone.valid || z.lat != settings.zone.lat || z.lng != settings.zone.lng ||
        z.radiusM != settings.zone.radiusM) {
      settings.zone = z;
      changed = true;
    }
  } else if (settings.zone.valid) {
    settings.zone = petlogic::SafeZone();
    changed = true;
  }
  if (changed) settings.saveRuntime();

  if (d.ring) indicators::startRing(RING_DURATION_MS);

  // Staged OTA: only on a healthy battery, at most once an hour per attempt.
  if (d.hasOta && d.otaVersion != FW_VERSION && batteryPct >= OTA_MIN_BATTERY_PCT) {
    const uint32_t nowS = (uint32_t)(esp_timer_get_time() / 1000000ULL);
    if (rtcLastOtaTry == 0 || nowS - rtcLastOtaTry > 3600) {
      rtcLastOtaTry = nowS ? nowS : 1;
      LOGF("[ota] updating %s -> %s\n", FW_VERSION, d.otaVersion.c_str());
      ota::apply(d.otaUrl, d.otaSha256);  // reboots on success
    }
  }
}

// Capture (if possible) and upload everything buffered. Returns true on a successful sync.
static bool runSync() {
  captureSample();

  if (WiFi.status() != WL_CONNECTED) { ensureWifi(); return false; }
  if (!cloud::ensureTime()) return false;

  const int mv = battery::readMv();
  Telemetry t;
  t.batteryMv = mv;
  t.batteryPct = petlogic::batteryPercentFromMv(mv);
  t.rssi = WiFi.RSSI();
  t.isSafe = rtcSafe;
  t.lostMode = settings.lostMode;
  t.uptimeS = millis() / 1000;
  t.freeHeap = ESP.getFreeHeap();
  t.droppedSamples = rtcDropped;

  const size_t n = min((size_t)rtcCount, MAX_SAMPLES_PER_POST);
  Directive d;
  int code = 0;
  if (!cloud::sync(rtcBuf, n, t, d, code)) {
    LOGF("[sync] failed (%d), %u samples kept\n", code, rtcCount);
    // 401/403: bad or revoked credentials — retrying faster won't help.
    return false;
  }
  bufferConsume(n);
  rtcDropped = 0;
  applyDirective(d, t.batteryPct);
  return true;
}

static void updateLed() {
  const int pct = battery::readPercent();
  if (pct <= 10 && battery::readMv() > 2500) indicators::setState(LedState::LowBattery);
  else if (settings.lostMode) indicators::setState(LedState::Lost);
  else if (WiFi.status() != WL_CONNECTED) indicators::setState(LedState::NoWifi);
  else if (!gps::hasFix()) indicators::setState(LedState::NoFix);
  else indicators::setState(LedState::Online);
}

// Protect the cell: below the critical level with a real battery attached, stop everything.
static void guardBattery() {
  const int mv = battery::readMv();
  if (mv > 2500 && petlogic::batteryPercentFromMv(mv) <= BATTERY_CRITICAL_PCT) {
    deepSleepFor(3600);
  }
}

static void checkFactoryReset() {
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  if (digitalRead(PIN_BUTTON) != LOW) return;
  const uint32_t t0 = millis();
  while (digitalRead(PIN_BUTTON) == LOW) {
    indicators::setState(LedState::Provisioning);
    indicators::update();
    if (millis() - t0 > FACTORY_RESET_HOLD_MS) {
      settings.factoryReset();
      indicators::chirp(1800, 300);
      ESP.restart();
    }
    delay(10);
  }
}

// ── Duty-cycled wake: one fix → one upload → back to sleep ────────────────────
static void runDutyCycle() {
  gpio_hold_dis((gpio_num_t)PIN_GPS_EN);
  gps::power(true);
  provisioning::beginWifi();

  const uint32_t t0 = millis();
  while (!gps::hasFix() && millis() - t0 < GPS_FIX_TIMEOUT_MS) {
    esp_task_wdt_reset();
    gps::poll();
    delay(10);
  }
  waitForWifi(WIFI_CONNECT_TIMEOUT_MS);
  runSync();

  // If the server flipped us into a faster mode, stay awake in continuous mode.
  if (dutyCycled()) deepSleepFor(settings.intervalSec);
  lastCycleMs = millis();
}

// ── Arduino entry points ──────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  esp_task_wdt_init(WATCHDOG_S, true);
  esp_task_wdt_add(nullptr);

  indicators::begin(PIN_LED, PIN_BUZZER);
  battery::begin(PIN_BATTERY_ADC, BATTERY_DIVIDER_RATIO);
  settings.load();

  wokeFromTimer = esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_TIMER;
  if (!wokeFromTimer) {
    checkFactoryReset();
    rtcCount = 0;
    rtcDropped = 0;
    rtcSafe = true;
    rtcLastOtaTry = 0;
  }

  guardBattery();
  GpsConfig gcfg;
  gcfg.rxPin = PIN_GPS_RX;
  gcfg.txPin = PIN_GPS_TX;
  gcfg.enablePin = PIN_GPS_EN;
  gcfg.baud = GPS_BAUD;
  gcfg.minSatellites = GPS_MIN_SATELLITES;
  gcfg.maxHdop = GPS_MAX_HDOP;
  gps::begin(gcfg);
  gps::configureUblox();

  if (!settings.provisioned() || !provisioning::hasSavedWifi()) {
    Serial.printf("Setup needed (identity: %s, Wi-Fi: %s).\n", settings.provisioned() ? "ok" : "missing",
                  provisioning::hasSavedWifi() ? "ok" : "missing");
    Serial.printf("  Phone/laptop: join Wi-Fi '%s' (password %s), open 192.168.4.1\n",
                  provisioning::apName().c_str(), provisioning::apPassword().c_str());
    Serial.println("  or serial:    provision <deviceId> <secret>   and   wifi <ssid> <password>");
    provisioning::runPortal();
    ESP.restart();  // clean start with the new credentials
  }

  indicators::setState(LedState::Booting);
  Serial.printf("Pet Maya collar fw %s, id %s\n", FW_VERSION, settings.deviceId.c_str());

  if (wokeFromTimer && dutyCycled()) {
    runDutyCycle();
  } else {
    provisioning::beginWifi();
    lastCycleMs = millis() - settings.intervalSec * 1000UL + 3000;  // first report ~3 s after boot
  }
}

void loop() {
  esp_task_wdt_reset();
  gps::poll();
  indicators::update();
  provisioning::handleSerial();

  static uint32_t lastLedCheck = 0;
  if (millis() - lastLedCheck > 2000) {
    lastLedCheck = millis();
    updateLed();
    guardBattery();
    if (WiFi.status() != WL_CONNECTED) ensureWifi();
  }

  if (millis() - lastCycleMs >= settings.intervalSec * 1000UL) {
    lastCycleMs = millis();
    runSync();
    // Switched to a slow interval: go power-saving once buffered data is out.
    if (dutyCycled() && rtcCount == 0 && !indicators::ringing()) deepSleepFor(settings.intervalSec);
  }

  delay(5);  // yields to the Wi-Fi stack; modem sleep handles idle current
}
