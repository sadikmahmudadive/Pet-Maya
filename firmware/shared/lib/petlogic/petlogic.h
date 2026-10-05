// Pure, hardware-independent logic (unit-tested on the host with `pio test -e native`).
#pragma once
#include <math.h>
#include <stdint.h>

namespace petlogic {

constexpr double kEarthRadiusM = 6371000.0;

inline double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
  const double rad = M_PI / 180.0;
  const double dLat = (lat2 - lat1) * rad;
  const double dLon = (lon2 - lon1) * rad;
  const double a = sin(dLat / 2) * sin(dLat / 2) +
                   cos(lat1 * rad) * cos(lat2 * rad) * sin(dLon / 2) * sin(dLon / 2);
  return 2 * kEarthRadiusM * atan2(sqrt(a), sqrt(1 - a));
}

struct SafeZone {
  bool valid = false;
  double lat = 0;
  double lng = 0;
  float radiusM = 0;
};

// Hysteresis stops GPS jitter on the boundary from flapping the state:
// leaving needs `margin` metres past the edge, re-entering needs the edge itself.
inline bool isInsideSafeZone(const SafeZone& z, double lat, double lng, bool wasInside,
                             double marginM = 15.0) {
  if (!z.valid) return true;  // no zone configured → nothing to violate
  const double d = haversineMeters(z.lat, z.lng, lat, lng);
  return wasInside ? d <= z.radiusM + marginM : d <= z.radiusM;
}

// Single-cell LiPo/Li-ion resting-voltage curve → percent.
inline int batteryPercentFromMv(int mv) {
  static const int kMv[] = {3300, 3500, 3600, 3700, 3750, 3800, 3850, 3900, 3950, 4050, 4150};
  static const int kPct[] = {0, 5, 10, 20, 30, 40, 50, 60, 75, 90, 100};
  constexpr int n = sizeof(kMv) / sizeof(kMv[0]);
  if (mv <= kMv[0]) return 0;
  if (mv >= kMv[n - 1]) return 100;
  for (int i = 1; i < n; i++) {
    if (mv <= kMv[i]) {
      const int span = kMv[i] - kMv[i - 1];
      return kPct[i - 1] + (kPct[i] - kPct[i - 1]) * (mv - kMv[i - 1]) / span;
    }
  }
  return 100;
}

// 1–4 bars, matching the app's `signalStrength`.
inline int rssiToBars(int rssi) {
  if (rssi >= -55) return 4;
  if (rssi >= -67) return 3;
  if (rssi >= -78) return 2;
  return 1;
}

}  // namespace petlogic
