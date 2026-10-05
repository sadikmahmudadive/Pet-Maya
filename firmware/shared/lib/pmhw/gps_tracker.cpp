#include "gps_tracker.h"
#include <TinyGPSPlus.h>
#include <sys/time.h>
#include <time.h>

namespace gps {
namespace {
TinyGPSPlus parser;
HardwareSerial gpsSerial(2);
GpsConfig cfg;
bool powered = false;

// Days-from-civil (Howard Hinnant) — avoids mktime/timezone surprises.
int64_t daysFromCivil(int y, unsigned m, unsigned d) {
  y -= m <= 2;
  const int era = (y >= 0 ? y : y - 399) / 400;
  const unsigned yoe = (unsigned)(y - era * 400);
  const unsigned doy = (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1;
  const unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
  return (int64_t)era * 146097 + (int64_t)doe - 719468;
}

bool gpsTimeValid() {
  return parser.date.isValid() && parser.time.isValid() && parser.date.year() >= 2024 &&
         parser.time.age() < 3000;
}

uint32_t gpsEpoch() {
  const int64_t days = daysFromCivil(parser.date.year(), parser.date.month(), parser.date.day());
  return (uint32_t)(days * 86400 + parser.time.hour() * 3600 + parser.time.minute() * 60 +
                    parser.time.second());
}

void sendUbx(uint8_t cls, uint8_t id, const uint8_t* payload, uint16_t len) {
  uint8_t ckA = 0, ckB = 0;
  auto ck = [&](uint8_t b) { ckA += b; ckB += ckA; };
  const uint8_t hdr[] = {cls, id, (uint8_t)(len & 0xFF), (uint8_t)(len >> 8)};
  gpsSerial.write(0xB5);
  gpsSerial.write(0x62);
  for (uint8_t b : hdr) { ck(b); gpsSerial.write(b); }
  for (uint16_t i = 0; i < len; i++) { ck(payload[i]); gpsSerial.write(payload[i]); }
  gpsSerial.write(ckA);
  gpsSerial.write(ckB);
  gpsSerial.flush();
}
}  // namespace

void begin(const GpsConfig& c) {
  cfg = c;
  if (cfg.enablePin >= 0) pinMode(cfg.enablePin, OUTPUT);
  gpsSerial.begin(cfg.baud, SERIAL_8N1, cfg.rxPin, cfg.txPin);
  powered = false;
  power(true);
}

void power(bool on) {
  if (cfg.enablePin >= 0) {
    digitalWrite(cfg.enablePin, on ? HIGH : LOW);
  } else if (!on) {
    // No load switch: put the receiver into u-blox backup mode (UBX-RXM-PMREQ,
    // duration 0 = until woken). Ephemeris is kept, so the next fix is a hot start.
    const uint8_t pmreq[8] = {0, 0, 0, 0, 0x02, 0, 0, 0};
    sendUbx(0x02, 0x41, pmreq, sizeof(pmreq));
  } else if (!powered) {
    // Any UART activity wakes it from backup mode.
    for (int i = 0; i < 8; i++) gpsSerial.write(0xFF);
    gpsSerial.flush();
    delay(100);
  }
  powered = on;
}

bool isPowered() { return powered; }

void poll() {
  while (gpsSerial.available()) parser.encode((char)gpsSerial.read());
}

uint8_t satellites() { return parser.satellites.isValid() ? (uint8_t)parser.satellites.value() : 0; }

bool hasFix() {
  return powered && parser.location.isValid() && parser.location.age() < 3000 &&
         satellites() >= cfg.minSatellites &&
         (!parser.hdop.isValid() || parser.hdop.hdop() <= cfg.maxHdop);
}

bool read(Sample& out) {
  if (!hasFix() || !gpsTimeValid()) return false;
  out.ts = gpsEpoch();
  out.lat = parser.location.lat();
  out.lng = parser.location.lng();
  out.speedKmh = parser.speed.isValid() ? (float)parser.speed.kmph() : 0;
  out.hdop = parser.hdop.isValid() ? (float)parser.hdop.hdop() : 99.f;
  out.altM = parser.altitude.isValid() ? (float)parser.altitude.meters() : 0;
  out.sats = satellites();
  return true;
}

bool syncClockFromGps() {
  if (!gpsTimeValid()) return false;
  timeval tv = {(time_t)gpsEpoch(), 0};
  settimeofday(&tv, nullptr);
  return true;
}

void configureUblox() {
  // UBX-CFG-MSG (0x06 0x01): set NMEA rate per message class/id. F0 = NMEA std.
  const uint8_t off[][2] = {{0xF0, 0x01} /*GLL*/, {0xF0, 0x02} /*GSA*/, {0xF0, 0x03} /*GSV*/,
                            {0xF0, 0x05} /*VTG*/};
  for (auto& m : off) {
    const uint8_t p[] = {m[0], m[1], 0};
    sendUbx(0x06, 0x01, p, sizeof(p));
    delay(10);
  }
  // UBX-CFG-NAV5 (0x06 0x24): mask=dyn model only, dynModel=0 (portable).
  uint8_t nav5[36] = {0};
  nav5[0] = 0x01;  // mask: apply dynModel
  nav5[2] = 0x00;  // portable
  sendUbx(0x06, 0x24, nav5, sizeof(nav5));
}

}  // namespace gps
