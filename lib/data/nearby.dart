// Helpers for the "Nearby" specialists filter.

/// Radius choices (km) offered next to the Nearby chip.
const nearbyRadiiKm = <double>[2, 5, 10, 25];

/// What happened when we asked for the phone's location.
enum LocateResult { ok, serviceOff, denied, deniedForever, failed }

/// "850 m" under a kilometre, otherwise "3.4 km".
String formatDistance(double meters) =>
    meters < 1000 ? '${meters.toStringAsFixed(0)} m' : '${(meters / 1000).toStringAsFixed(1)} km';

/// True when a distance is known and within [km]. An unknown distance never counts as nearby.
bool isWithinKm(double? meters, double km) => meters != null && meters <= km * 1000;

/// The next larger radius after [km], or null when [km] is already the biggest.
double? widerRadius(double km) {
  for (final r in nearbyRadiiKm) {
    if (r > km) return r;
  }
  return null;
}
