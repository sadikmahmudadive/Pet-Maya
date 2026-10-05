#include "battery.h"
#include <petlogic.h>

namespace battery {
namespace {
int adcPin = -1;
float ratio = 2.0f;
}  // namespace

void begin(int pin, float dividerRatio) {
  adcPin = pin;
  ratio = dividerRatio;
  analogSetPinAttenuation(adcPin, ADC_11db);  // ~0–3.1 V at the pin
  pinMode(adcPin, INPUT);
}

int readMv() {
  if (adcPin < 0) return 0;
  // analogReadMilliVolts applies the chip's factory ADC calibration.
  uint32_t sum = 0;
  constexpr int kSamples = 16;
  for (int i = 0; i < kSamples; i++) {
    sum += analogReadMilliVolts(adcPin);
    delayMicroseconds(200);
  }
  return (int)((sum / kSamples) * ratio);
}

int readPercent() { return petlogic::batteryPercentFromMv(readMv()); }

bool present() { return readMv() > 2500; }

}  // namespace battery
