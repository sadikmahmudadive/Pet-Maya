// Ai-Thinker Ra-02 (SX1278) / SX1279 driver configured with the Pet Maya LoRa profile.
#pragma once
#include <Arduino.h>

struct RadioPins {
  int nss = 5;
  int rst = 14;
  int dio0 = 26;
  int dio1 = -1;  // optional
  int sck = 18;
  int miso = 19;
  int mosi = 23;
};

namespace pmradio {
// Configure frequency, SF, BW, CR, sync word, CRC from pmlora.h. Returns false if the
// module doesn't answer (wiring / power / wrong chip).
bool begin(const RadioPins& pins, int8_t txPowerDbm);
int16_t lastError();

bool transmit(const uint8_t* data, size_t len);  // blocking until TX done
void startReceive();                              // continuous RX, DIO0 interrupt
bool packetReady();
// Read the pending packet. Returns its length, or -1 (CRC error / nothing pending).
int read(uint8_t* buf, size_t maxLen, float& rssi, float& snr);
void standby();
void sleep();                                     // ~1 µA; call before deep sleep
uint32_t timeOnAirMs(size_t len);
}  // namespace pmradio
