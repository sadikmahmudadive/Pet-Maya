#pragma once
#include <Arduino.h>

namespace battery {
// pin must be an ADC1 channel (ADC2 is unusable while Wi-Fi is on).
// dividerRatio = (R1+R2)/R2 of the cell voltage divider.
void begin(int pin, float dividerRatio);
int readMv();       // averaged, divider-compensated cell voltage
int readPercent();  // 0–100 from the LiPo curve
bool present();     // false when no cell is attached (USB-powered bench setup)
}  // namespace battery
