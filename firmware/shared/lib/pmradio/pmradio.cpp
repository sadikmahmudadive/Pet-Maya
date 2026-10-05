#include "pmradio.h"
#include <RadioLib.h>
#include <SPI.h>
#include <pmlora.h>

namespace pmradio {
namespace {
#ifdef RADIO_SX1279
using Chip = SX1279;
#else
using Chip = SX1278;  // Ai-Thinker Ra-02
#endif

Module* mod = nullptr;
Chip* radio = nullptr;
volatile bool rxFlag = false;
int16_t err = RADIOLIB_ERR_NONE;

void IRAM_ATTR onPacket() { rxFlag = true; }
}  // namespace

bool begin(const RadioPins& p, int8_t txPowerDbm) {
  SPI.begin(p.sck, p.miso, p.mosi, p.nss);
  mod = new Module(p.nss, p.dio0, p.rst, p.dio1 >= 0 ? p.dio1 : RADIOLIB_NC);
  radio = new Chip(mod);
  err = radio->begin(pmlora::kFreqMHz, pmlora::kBandwidthKHz, pmlora::kSpreadingFactor,
                     pmlora::kCodingRate, pmlora::kSyncWord, txPowerDbm, pmlora::kPreambleLen);
  if (err != RADIOLIB_ERR_NONE) return false;
  radio->setCRC(true);
  radio->setCurrentLimit(120);  // mA; enough for +17 dBm on PA_BOOST
  radio->setPacketReceivedAction(onPacket);
  return true;
}

int16_t lastError() { return err; }

bool transmit(const uint8_t* data, size_t len) {
  err = radio->transmit(const_cast<uint8_t*>(data), len);
  rxFlag = false;  // TX-done also pulses DIO0; it's not a received packet
  return err == RADIOLIB_ERR_NONE;
}

void startReceive() {
  rxFlag = false;
  err = radio->startReceive();
}

bool packetReady() { return rxFlag; }

int read(uint8_t* buf, size_t maxLen, float& rssi, float& snr) {
  if (!rxFlag) return -1;
  rxFlag = false;
  const size_t len = radio->getPacketLength();
  if (len == 0 || len > maxLen) {
    radio->readData(buf, 0);  // clear the FIFO / IRQ
    return -1;
  }
  err = radio->readData(buf, len);
  rssi = radio->getRSSI();
  snr = radio->getSNR();
  return err == RADIOLIB_ERR_NONE ? (int)len : -1;
}

void standby() { radio->standby(); }

void sleep() { radio->sleep(); }

uint32_t timeOnAirMs(size_t len) { return (uint32_t)((radio->getTimeOnAir(len) + 999) / 1000); }

}  // namespace pmradio
