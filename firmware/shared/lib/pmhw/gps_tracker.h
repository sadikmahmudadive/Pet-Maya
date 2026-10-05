// u-blox NEO-6M / NEO-M8N driver (TinyGPS++ on UART2) shared by all Pet Maya trackers.
#pragma once
#include <Arduino.h>

// One GPS fix. Plain-old-data so a ring of them can live in RTC memory across deep sleep.
struct Sample {
  uint32_t ts;  // unix seconds (UTC)
  double lat;
  double lng;
  float speedKmh;
  float hdop;
  float altM;
  uint8_t sats;
};

struct GpsConfig {
  int rxPin;            // ESP32 RX ← GPS TX
  int txPin;            // ESP32 TX → GPS RX
  int enablePin = -1;   // load switch (HIGH = on); -1 if the GPS is always powered
  uint32_t baud = 9600;
  uint8_t minSatellites = 4;
  float maxHdop = 5.0f;
};

namespace gps {
void begin(const GpsConfig& cfg);
// Off = load switch off, or u-blox backup mode when there is no switch.
void power(bool on);
bool isPowered();
void poll();              // feed NMEA bytes; call often
bool hasFix();            // fresh, enough satellites, acceptable HDOP
bool read(Sample& out);   // current fix (false if no fix / no valid time)
bool syncClockFromGps();  // set the system clock from GPS time
uint8_t satellites();

// Trim the NMEA stream to GGA + RMC (all TinyGPS++ needs) and select the
// "portable" dynamic model. Saves UART/CPU wake-ups; harmless if the module
// ignores it. Call after power-up.
void configureUblox();
}  // namespace gps
