// Pet Maya LoRa tracker — main application.
//
// Every cycle: get a GPS fix → send one encrypted 41-byte uplink → listen 3 s for a
// downlink (commands) → sleep. Wi-Fi and Bluetooth are never powered.
//
//  • interval ≥ 60 s (and not lost/escaped/ringing): GPS to backup/off + ESP32 deep sleep
//  • shorter intervals: GPS stays on, CPU idles between uplinks
//
// The interval comes from the cloud (app's tracking mode / lost mode) and is clamped to
// the airtime budget (DUTY_CYCLE_PERMILLE). Outside the safe zone the tracker speeds
// up on its own, without waiting for the cloud.

#include <Arduino.h>
#include <WiFi.h>
#include <driver/gpio.h>
#include <esp_bt.h>
#include <esp_sleep.h>
#include <esp_task_wdt.h>
#include <time.h>

#include <battery.h>
#include <gps_tracker.h>
#include <indicators.h>
#include <petlogic.h>
#include <pmlora.h>
#include <pmradio.h>

#include "config.h"
#include "console.h"
#include "node_state.h"

static uint32_t minIntervalS = 20;  // recomputed from time-on-air at boot
static uint32_t lastCycleMs = 0;
static bool radioOk = false;

// ── Helpers ───────────────────────────────────────────────────────────────────
static bool searchActive() { return rtc.searchUntilS && (uint32_t)time(nullptr) < rtc.searchUntilS; }

static uint32_t effectiveInterval() {
  if (searchActive()) return minIntervalS;  // a finder is looking for us right now
  uint32_t iv = node.intervalS;
  if (node.zone.valid && !rtc.insideZone) iv = min(iv, ESCAPE_INTERVAL_S);
  return max(iv, minIntervalS);
}

static bool useDeepSleep() {
  return !node.lostMode && !searchActive() && !indicators::ringing() && effectiveInterval() >= DEEP_SLEEP_MIN_INTERVAL_S;
}

static void feed() {
  esp_task_wdt_reset();
  gps::poll();
  indicators::update();
}

[[noreturn]] static void deepSleepFor(uint32_t seconds) {
  if (radioOk) pmradio::sleep();
  gps::power(false);
  digitalWrite(PIN_LED, LOW);
  // Keep the radio deselected and the GPS switch off while the pins float in sleep.
  gpio_hold_en((gpio_num_t)PIN_LORA_NSS);
  if (PIN_GPS_EN >= 0) gpio_hold_en((gpio_num_t)PIN_GPS_EN);
  gpio_deep_sleep_hold_en();
  esp_sleep_enable_timer_wakeup((uint64_t)max(seconds, 1u) * 1000000ULL);
  esp_sleep_enable_ext0_wakeup((gpio_num_t)PIN_BUTTON, 0);  // button = report now
  esp_deep_sleep_start();
  while (true) {}
}

static void updateLed() {
  if (!node.provisioned()) indicators::setState(LedState::Provisioning);
  else if (battery::present() && battery::readPercent() <= LOW_BATTERY_PCT) indicators::setState(LedState::LowBattery);
  else if (node.lostMode) indicators::setState(LedState::Lost);
  else if (rtc.missedAcks >= LINK_LOST_AFTER_MISSED_ACKS) indicators::setState(LedState::NoWifi);  // no gateway
  else if (!gps::hasFix()) indicators::setState(LedState::NoFix);
  else indicators::setState(LedState::Online);
}

// ── GPS ───────────────────────────────────────────────────────────────────────
static void acquireFix() {
  if (!gps::isPowered()) {
    gps::power(true);
    gps::configureUblox();
  }
  const uint32_t timeoutS = rtc.haveFix ? GPS_FIX_TIMEOUT_S : GPS_COLD_FIX_TIMEOUT_S;
  const uint32_t t0 = millis();
  // Give the receiver a moment to produce a fresh solution even if the parser has one.
  while (millis() - t0 < 1500) { feed(); delay(10); }
  while (!gps::hasFix() && millis() - t0 < timeoutS * 1000) { feed(); delay(10); }

  Sample s;
  if (gps::read(s)) {
    gps::syncClockFromGps();
    rtc.lastFix = s;
    rtc.haveFix = true;
    if (node.zone.valid) rtc.insideZone = petlogic::isInsideSafeZone(node.zone, s.lat, s.lng, rtc.insideZone);
    else rtc.insideZone = true;
  }
}

// ── Downlink handling ─────────────────────────────────────────────────────────
static void applyDownlink(const pmlora::Downlink& d, uint32_t counter) {
  node.lastDownCounter = counter;
  if (d.intervalS) node.intervalS = constrain((uint32_t)d.intervalS, 5u, MAX_INTERVAL_S);
  node.lostMode = d.flags & pmlora::kDownLostMode;
  if (d.flags & pmlora::kDownZoneValid) {
    node.zone.valid = d.zoneRadiusM >= 10;
    node.zone.lat = d.zoneLatE7 / 1e7;
    node.zone.lng = d.zoneLngE7 / 1e7;
    node.zone.radiusM = d.zoneRadiusM;
  } else {
    node.zone = petlogic::SafeZone();
  }
  node.saveConfig();  // NVS only writes changed keys
  if (d.flags & pmlora::kDownRing) indicators::startRing(RING_DURATION_MS);
  LOGF("[dl] #%u interval=%u lost=%d zone=%d ring=%d\n", (unsigned)counter, d.intervalS,
       node.lostMode, node.zone.valid, (d.flags & pmlora::kDownRing) != 0);
}

static void applyCommand(const pmlora::Command& c, uint32_t counter) {
  node.lastDownCounter = counter;
  node.saveConfig();
  if (c.flags & pmlora::kCmdRing) indicators::startRing(RING_DURATION_MS);
  if (c.flags & pmlora::kCmdSearch) {
    rtc.searchUntilS = c.searchMinutes ? (uint32_t)time(nullptr) + c.searchMinutes * 60u : 0;
  }
  LOGF("[cmd] #%u ring=%d search=%umin\n", (unsigned)counter, (c.flags & pmlora::kCmdRing) != 0, c.searchMinutes);
}

static bool receiveWindow() {
  pmradio::startReceive();
  const uint32_t t0 = millis();
  while (millis() - t0 < pmlora::kRxWindowMs) {
    feed();
    if (!pmradio::packetReady()) { delay(2); continue; }
    uint8_t buf[pmlora::kMaxFrame];
    float rssi, snr;
    const int len = pmradio::read(buf, sizeof(buf), rssi, snr);
    pmlora::Header h;
    uint8_t plain[pmlora::kDownlinkLen];
    size_t plainLen = 0;
    if (len > 0 && pmlora::parseHeader(buf, len, h) &&
        (h.type == pmlora::kTypeDownlink || h.type == pmlora::kTypeCommand) && h.nodeId == node.nodeId &&
        h.counter > node.lastDownCounter && pmlora::open(node.key, buf, len, pmlora::kDirDown, h, plain, plainLen)) {
      if (h.type == pmlora::kTypeDownlink) {
        pmlora::Downlink d;
        pmlora::decodeDownlink(plain, d);
        applyDownlink(d, h.counter);
      } else {
        pmlora::Command c;
        pmlora::decodeCommand(plain, c);
        applyCommand(c, h.counter);
      }
      return true;
    }
    pmradio::startReceive();  // someone else's packet — keep listening
  }
  return false;
}

// ── One reporting cycle ───────────────────────────────────────────────────────
static void runCycle() {
  acquireFix();

  const int mv = battery::readMv();
  const int pct = petlogic::batteryPercentFromMv(mv);
  const bool freshFix = gps::hasFix();

  pmlora::Uplink u;
  if (rtc.haveFix) {
    const Sample& s = rtc.lastFix;
    u.latE7 = (int32_t)lround(s.lat * 1e7);
    u.lngE7 = (int32_t)lround(s.lng * 1e7);
    u.altM = (int16_t)constrain(lround(s.altM), -32768L, 32767L);
    u.speedKmh = (uint8_t)min(lround(s.speedKmh), 255L);
    u.hdopX10 = (uint8_t)min(lround(s.hdop * 10), 255L);
    u.sats = s.sats;
    const time_t now = time(nullptr);
    u.fixAgeS = (uint16_t)constrain((long)(now - (time_t)s.ts), 0L, 65535L);
  }
  u.batteryPct = battery::present() ? (uint8_t)pct : 100;
  u.flags = (rtc.haveFix && freshFix ? pmlora::kUpHasFix : 0) |
            (rtc.insideZone ? pmlora::kUpInsideZone : 0) | (node.lostMode ? pmlora::kUpLostMode : 0) |
            (battery::present() && pct <= LOW_BATTERY_PCT ? pmlora::kUpLowBattery : 0) |
            (rtc.coldBootPending ? pmlora::kUpColdBoot : 0) |
            (indicators::ringing() ? pmlora::kUpRinging : 0) | (searchActive() ? pmlora::kUpSearchMode : 0);
  const bool wantAck = rtc.coldBootPending || rtc.uplinks % ACK_EVERY_N_UPLINKS == 0 ||
                       rtc.missedAcks >= LINK_LOST_AFTER_MISSED_ACKS;
  if (wantAck) u.flags |= pmlora::kUpAckRequest;
  u.fwMajor = FW_MAJOR;
  u.fwMinor = FW_MINOR;
  u.lastDownCounter = node.lastDownCounter;

  uint8_t plain[pmlora::kUplinkLen];
  pmlora::encodeUplink(u, plain);
  pmlora::Header h;
  h.type = pmlora::kTypeUplink;
  h.nodeId = node.nodeId;
  h.counter = node.nextUpCounter();
  uint8_t frame[pmlora::kMaxFrame];
  size_t frameLen = 0;
  if (!pmlora::seal(node.key, h, pmlora::kDirUp, plain, sizeof(plain), frame, frameLen)) return;

  indicators::flash(80);
  if (!pmradio::transmit(frame, frameLen)) {
    LOGF("[tx] failed %d\n", pmradio::lastError());
    return;
  }
  rtc.uplinks++;
  rtc.coldBootPending = false;
  LOGF("[tx] #%u fix=%d sats=%u batt=%d%% ack=%d\n", (unsigned)h.counter, freshFix, u.sats, pct, wantAck);

  const bool gotDownlink = receiveWindow();
  if (gotDownlink) rtc.missedAcks = 0;
  else if (wantAck && rtc.missedAcks < 255) rtc.missedAcks++;
  pmradio::sleep();
}

static void checkFactoryReset() {
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  if (digitalRead(PIN_BUTTON) != LOW) return;
  const uint32_t t0 = millis();
  while (digitalRead(PIN_BUTTON) == LOW) {
    esp_task_wdt_reset();
    indicators::setState(LedState::Provisioning);
    indicators::update();
    if (millis() - t0 > FACTORY_RESET_HOLD_MS) {
      node.factoryReset();
      indicators::chirp(1800, 300);
      ESP.restart();
    }
    delay(10);
  }
}

// ── Arduino entry points ──────────────────────────────────────────────────────
void setup() {
  // No Wi-Fi / BT on this device at all.
  WiFi.mode(WIFI_OFF);
  btStop();
  setCpuFrequencyMhz(80);

  Serial.begin(115200);
  esp_task_wdt_init(WATCHDOG_S, true);
  esp_task_wdt_add(nullptr);

  gpio_hold_dis((gpio_num_t)PIN_LORA_NSS);
  if (PIN_GPS_EN >= 0) gpio_hold_dis((gpio_num_t)PIN_GPS_EN);
  gpio_deep_sleep_hold_dis();

  indicators::begin(PIN_LED, PIN_BUZZER);
  battery::begin(PIN_BATTERY_ADC, BATTERY_DIVIDER_RATIO);
  node.load();

  const esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
  if (cause != ESP_SLEEP_WAKEUP_TIMER && cause != ESP_SLEEP_WAKEUP_EXT0) checkFactoryReset();

  if (!pmlora::selfTest()) {
    Serial.println("FATAL: crypto self-test failed");
    indicators::setState(LedState::LowBattery);
  }

  // Protect the cell.
  if (battery::present() && battery::readPercent() <= BATTERY_CRITICAL_PCT) deepSleepFor(3600);

  GpsConfig g;
  g.rxPin = PIN_GPS_RX;
  g.txPin = PIN_GPS_TX;
  g.enablePin = PIN_GPS_EN;
  g.baud = GPS_BAUD;
  g.minSatellites = GPS_MIN_SATELLITES;
  g.maxHdop = GPS_MAX_HDOP;
  gps::begin(g);
  gps::configureUblox();

  RadioPins rp;
  rp.nss = PIN_LORA_NSS; rp.rst = PIN_LORA_RST; rp.dio0 = PIN_LORA_DIO0; rp.dio1 = PIN_LORA_DIO1;
  rp.sck = PIN_LORA_SCK; rp.miso = PIN_LORA_MISO; rp.mosi = PIN_LORA_MOSI;
  radioOk = pmradio::begin(rp, LORA_TX_POWER_DBM);
  if (radioOk) {
    const uint32_t toa = pmradio::timeOnAirMs(pmlora::kMaxFrame);
    minIntervalS = (toa * 1000 / DUTY_CYCLE_PERMILLE + 999) / 1000 + 1;
  } else {
    Serial.printf("Radio init failed (%d): check Ra-02 wiring/3.3 V supply\n", pmradio::lastError());
  }

  if (!node.provisioned()) {
    Serial.println("Not provisioned. Use: provision <nodeIdHex8> <keyHex32>  (tools/provision.py lora-node)");
    while (true) {
      esp_task_wdt_reset();
      indicators::setState(LedState::Provisioning);
      indicators::update();
      console::poll();
      delay(10);
    }
  }

  char devId[13];
  pmlora::deviceIdFor(node.nodeId, devId);
  Serial.printf("Pet Maya LoRa tracker fw %d.%d, %s, min interval %us\n", FW_MAJOR, FW_MINOR, devId,
                (unsigned)minIntervalS);

  if (radioOk) runCycle();
  lastCycleMs = millis();
  if (radioOk && useDeepSleep()) deepSleepFor(effectiveInterval());
}

void loop() {
  feed();
  const bool sendNow = console::poll();

  static uint32_t lastLed = 0;
  if (millis() - lastLed > 2000) {
    lastLed = millis();
    updateLed();
    if (battery::present() && battery::readPercent() <= BATTERY_CRITICAL_PCT) deepSleepFor(3600);
  }

  if (radioOk && (sendNow || millis() - lastCycleMs >= effectiveInterval() * 1000UL)) {
    lastCycleMs = millis();
    runCycle();
  }

  // Back to deep sleep once nothing needs the CPU awake (ring finished, slow interval).
  if (radioOk && useDeepSleep()) {
    const uint32_t elapsed = (millis() - lastCycleMs) / 1000;
    const uint32_t iv = effectiveInterval();
    deepSleepFor(iv > elapsed ? iv - elapsed : 1);
  }
  delay(5);
}
