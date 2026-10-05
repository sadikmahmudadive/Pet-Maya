#pragma once
#include <Arduino.h>

enum class LedState : uint8_t {
  Booting,       // solid
  Provisioning,  // fast double blink
  NoWifi,        // slow blink
  NoFix,         // blink + pause (searching for satellites)
  Online,        // short heartbeat
  Lost,          // rapid blink
  LowBattery,    // triple blink
};

// Non-blocking status LED and "find my pet" buzzer.
namespace indicators {
void begin(int ledPin, int buzzerPin = -1);
void setState(LedState s);
void startRing(uint32_t durationMs);
void stopRing();
bool ringing();
void update();  // call every loop()
void flash(uint16_t ms);  // brief LED pulse on top of the pattern (e.g. packet received)
void chirp(uint16_t freq, uint16_t ms);  // short blocking beep (boot / pairing feedback)
}  // namespace indicators
