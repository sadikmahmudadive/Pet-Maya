#include "indicators.h"

namespace indicators {
namespace {
constexpr int kLedcChannel = 0;
int PIN_LED = 2;
int PIN_BUZZER = -1;
LedState state = LedState::Booting;
uint32_t ringUntil = 0;
bool ringActive = false;
uint32_t flashUntil = 0;

// Pattern = alternating on/off durations (ms), repeating.
struct Pattern { const uint16_t* steps; uint8_t len; };
const uint16_t kProvisioning[] = {80, 80, 80, 700};
const uint16_t kNoWifi[] = {500, 1500};
const uint16_t kNoFix[] = {120, 120, 120, 1600};
const uint16_t kOnline[] = {40, 2960};
const uint16_t kLost[] = {100, 100};
const uint16_t kLowBattery[] = {80, 120, 80, 120, 80, 1600};

Pattern patternFor(LedState s) {
  switch (s) {
    case LedState::Provisioning: return {kProvisioning, 4};
    case LedState::NoWifi: return {kNoWifi, 2};
    case LedState::NoFix: return {kNoFix, 4};
    case LedState::Online: return {kOnline, 2};
    case LedState::Lost: return {kLost, 2};
    case LedState::LowBattery: return {kLowBattery, 6};
    default: return {nullptr, 0};
  }
}
}  // namespace

void begin(int ledPin, int buzzerPin) {
  PIN_LED = ledPin;
  PIN_BUZZER = buzzerPin;
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, HIGH);
  if (PIN_BUZZER >= 0) {
    ledcSetup(kLedcChannel, 2000, 8);
    ledcAttachPin(PIN_BUZZER, kLedcChannel);
    ledcWriteTone(kLedcChannel, 0);
  }
}

void setState(LedState s) { state = s; }

void startRing(uint32_t durationMs) {
  ringActive = true;
  ringUntil = millis() + durationMs;
}

void stopRing() {
  ringActive = false;
  if (PIN_BUZZER >= 0) ledcWriteTone(kLedcChannel, 0);
}

bool ringing() { return ringActive; }

void flash(uint16_t ms) { flashUntil = millis() + ms; }

void chirp(uint16_t freq, uint16_t ms) {
  if (PIN_BUZZER < 0) { delay(ms); return; }
  ledcWriteTone(kLedcChannel, freq);
  delay(ms);
  ledcWriteTone(kLedcChannel, 0);
}

void update() {
  const uint32_t now = millis();

  // Buzzer: two-tone warble, 250 ms per tone, until the ring window ends.
  if (ringActive) {
    if ((int32_t)(now - ringUntil) >= 0) {
      stopRing();
    } else {
      if (PIN_BUZZER >= 0) ledcWriteTone(kLedcChannel, ((now / 250) % 2) ? 2700 : 3300);
    }
  }

  // LED
  if ((int32_t)(flashUntil - now) > 0) {
    digitalWrite(PIN_LED, HIGH);
    return;
  }
  const Pattern p = patternFor(state);
  if (!p.steps) {
    digitalWrite(PIN_LED, state == LedState::Booting ? HIGH : LOW);
    return;
  }
  uint32_t total = 0;
  for (uint8_t i = 0; i < p.len; i++) total += p.steps[i];
  uint32_t t = now % total;
  bool on = false;
  for (uint8_t i = 0; i < p.len; i++) {
    if (t < p.steps[i]) { on = (i % 2 == 0); break; }
    t -= p.steps[i];
  }
  digitalWrite(PIN_LED, on ? HIGH : LOW);
}

}  // namespace indicators
