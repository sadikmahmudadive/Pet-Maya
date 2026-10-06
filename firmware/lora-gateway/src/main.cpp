// Pet Maya LoRa gateway — radio side (Arduino loop, core 1).
//
// Listens continuously on the Pet Maya LoRa profile. Every uplink is queued for the
// network task (core 0) untouched — the gateway cannot read or forge tracker data.
// Downlinks are sent inside the tracker's 3 s receive window: immediately if the
// cloud answered in time, otherwise cached and sent right after that tracker's next uplink.

#include <Arduino.h>
#include <WiFi.h>
#include <esp_task_wdt.h>
#include <indicators.h>
#include <pmlora.h>
#include <pmradio.h>

#include "config.h"
#include "forwarder.h"
#include "gw_settings.h"
#include "shared_types.h"

QueueHandle_t uplinkQueue;
QueueHandle_t downlinkQueue;
GatewayStats stats;

namespace {
struct CacheSlot {
  bool used;
  uint32_t storedMs;
  TxFrame tx;
};
CacheSlot cache[DOWNLINK_CACHE_SLOTS];

// Next scheduled transmission (one at a time keeps the radio logic simple).
bool txPending = false;
uint32_t txAtMs = 0;
TxFrame txFrame;

// Uplinks we've already answered (per node), so we never send two downlinks into one window.
struct Answered { uint32_t nodeId; uint32_t rxMs; };
Answered answered[DOWNLINK_CACHE_SLOTS];

void markAnswered(uint32_t nodeId, uint32_t rxMs) {
  size_t slot = 0;
  for (size_t i = 0; i < DOWNLINK_CACHE_SLOTS; i++) {
    if (answered[i].nodeId == nodeId || answered[i].nodeId == 0) { slot = i; break; }
    if (answered[i].rxMs < answered[slot].rxMs) slot = i;
  }
  answered[slot] = {nodeId, rxMs};
}

bool alreadyAnswered(uint32_t nodeId, uint32_t rxMs) {
  for (auto& a : answered) if (a.nodeId == nodeId && a.rxMs == rxMs) return true;
  return false;
}

void cachePut(const TxFrame& tx) {
  size_t slot = DOWNLINK_CACHE_SLOTS;
  for (size_t i = 0; i < DOWNLINK_CACHE_SLOTS; i++) {
    if (cache[i].used && cache[i].tx.nodeId == tx.nodeId) { slot = i; break; }  // newer replaces older
  }
  if (slot == DOWNLINK_CACHE_SLOTS) {
    uint32_t oldest = UINT32_MAX;
    for (size_t i = 0; i < DOWNLINK_CACHE_SLOTS; i++) {
      if (!cache[i].used) { slot = i; break; }
      if (cache[i].storedMs < oldest) { oldest = cache[i].storedMs; slot = i; }
    }
  }
  cache[slot] = {true, millis(), tx};
}

bool cacheTake(uint32_t nodeId, TxFrame& out) {
  for (auto& c : cache) {
    if (!c.used || c.tx.nodeId != nodeId) continue;
    c.used = false;
    if (millis() - c.storedMs > DOWNLINK_CACHE_TTL_MS) return false;
    out = c.tx;
    return true;
  }
  return false;
}

void schedule(const TxFrame& tx, uint32_t atMs) {
  txFrame = tx;
  txAtMs = atMs;
  txPending = true;
}

void handleUplinkHeard(const RxFrame& f) {
  // Hand to the network task; if it's backed up, drop the oldest queued frame.
  if (xQueueSend(uplinkQueue, &f, 0) != pdTRUE) {
    RxFrame old;
    xQueueReceive(uplinkQueue, &old, 0);
    xQueueSend(uplinkQueue, &f, 0);
    stats.dropped++;
  }
  // Cached downlink for this tracker? Answer inside its receive window right now.
  pmlora::Header h;
  pmlora::parseHeader(f.data, f.len, h);
  TxFrame tx;
  if (!txPending && cacheTake(h.nodeId, tx)) {
    tx.forRxMs = f.rxMs;
    schedule(tx, f.rxMs + pmlora::kDownlinkTurnaroundMs);
    markAnswered(h.nodeId, f.rxMs);
  }
}

void pollRadio() {
  if (!pmradio::packetReady()) return;
  RxFrame f{};
  const int len = pmradio::read(f.data, sizeof(f.data), f.rssi, f.snr);
  f.rxMs = millis();
  pmradio::startReceive();
  if (len < 0) { stats.rxBad++; return; }

  pmlora::Header h;
  if (!pmlora::parseHeader(f.data, len, h) || h.type != pmlora::kTypeUplink) {
    stats.rxForeign++;  // other LoRa users on the band, or our own downlinks from a neighbour gateway
    return;
  }
  f.len = (uint8_t)len;
  stats.rxOk++;
  indicators::flash(60);
  LOGF("[rx] node %08X #%u rssi %.0f snr %.1f\n", (unsigned)h.nodeId, (unsigned)h.counter, f.rssi, f.snr);
  handleUplinkHeard(f);
}

void pollDownlinks() {
  TxFrame tx;
  while (xQueueReceive(downlinkQueue, &tx, 0) == pdTRUE) {
    const uint32_t now = millis();
    const bool inWindow = tx.forRxMs && (int32_t)(tx.deadlineMs - now) > 0;
    if (inWindow && !txPending && !alreadyAnswered(tx.nodeId, tx.forRxMs)) {
      const uint32_t earliest = tx.forRxMs + pmlora::kDownlinkTurnaroundMs;
      schedule(tx, (int32_t)(earliest - now) > 0 ? earliest : now);
      markAnswered(tx.nodeId, tx.forRxMs);
    } else {
      cachePut(tx);  // deliver after this tracker's next uplink
    }
  }
}

void pollTx() {
  if (!txPending || (int32_t)(millis() - txAtMs) < 0) return;
  txPending = false;
  if (pmradio::transmit(txFrame.data, txFrame.len)) {
    stats.txDown++;
    indicators::flash(150);
  }
  pmradio::startReceive();
}

void checkFactoryReset() {
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  if (digitalRead(PIN_BUTTON) != LOW) return;
  const uint32_t t0 = millis();
  while (digitalRead(PIN_BUTTON) == LOW) {
    esp_task_wdt_reset();
    if (millis() - t0 > FACTORY_RESET_HOLD_MS) {
      gw.factoryReset();
      ESP.restart();
    }
    delay(10);
  }
}
}  // namespace

void setup() {
  Serial.begin(115200);
  esp_task_wdt_init(WATCHDOG_S, true);
  esp_task_wdt_add(nullptr);
  indicators::begin(PIN_LED);
  gw.load();
  checkFactoryReset();

  if (!gw.provisioned() || !gwsetup::hasSavedWifi()) {
    Serial.printf("Setup needed (identity: %s, Wi-Fi: %s).\n", gw.provisioned() ? "ok" : "missing",
                  gwsetup::hasSavedWifi() ? "ok" : "missing");
    Serial.printf("  Phone/laptop: join Wi-Fi '%s' (password %s), open 192.168.4.1\n",
                  gwsetup::apName().c_str(), gwsetup::apPassword().c_str());
    Serial.println("  or serial:    provision <gatewayId> <secret>   and   wifi <ssid> <password>");
    esp_task_wdt_delete(nullptr);  // setup can take minutes
    gwsetup::runPortal();
    ESP.restart();
  }

  RadioPins rp;
  rp.nss = PIN_LORA_NSS; rp.rst = PIN_LORA_RST; rp.dio0 = PIN_LORA_DIO0; rp.dio1 = PIN_LORA_DIO1;
  rp.sck = PIN_LORA_SCK; rp.miso = PIN_LORA_MISO; rp.mosi = PIN_LORA_MOSI;
  if (!pmradio::begin(rp, LORA_TX_POWER_DBM)) {
    Serial.printf("Radio init failed (%d): check Ra-02 wiring/3.3 V supply. Rebooting in 10 s\n",
                  pmradio::lastError());
    delay(10000);
    ESP.restart();
  }

  uplinkQueue = xQueueCreate(UPLINK_QUEUE_LEN, sizeof(RxFrame));
  downlinkQueue = xQueueCreate(DOWNLINK_QUEUE_LEN, sizeof(TxFrame));
  forwarder::start();
  pmradio::startReceive();
  Serial.printf("Pet Maya LoRa gateway fw %s, id %s — listening on %.3f MHz SF%d\n", FW_VERSION,
                gw.gatewayId.c_str(), pmlora::kFreqMHz, pmlora::kSpreadingFactor);
}

void loop() {
  esp_task_wdt_reset();
  pollRadio();
  pollTx();
  pollDownlinks();
  pollTx();
  indicators::update();
  gwsetup::handleSerial();

  static uint32_t lastLed = 0;
  if (millis() - lastLed > 1000) {
    lastLed = millis();
    indicators::setState(WiFi.status() != WL_CONNECTED ? LedState::NoWifi
                         : forwarder::online()          ? LedState::Online
                                                        : LedState::NoFix);  // Wi-Fi up, cloud unreachable
  }
  delay(1);
}
