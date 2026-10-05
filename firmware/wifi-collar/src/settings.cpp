#include "settings.h"
#include <Preferences.h>
#include <WiFi.h>
#include "config.h"

Settings settings;
static const char* NS = "petmaya";

void Settings::load() {
  Preferences p;
  p.begin(NS, true);
  deviceId = p.getString("id", "");
  deviceSecret = p.getString("secret", "");
  intervalSec = constrain(p.getUInt("interval", DEFAULT_INTERVAL_S), MIN_INTERVAL_S, MAX_INTERVAL_S);
  zone.valid = p.getBool("zone_ok", false);
  zone.lat = p.getDouble("zone_lat", 0);
  zone.lng = p.getDouble("zone_lng", 0);
  zone.radiusM = p.getFloat("zone_r", 0);
  lostMode = p.getBool("lost", false);
  p.end();
}

void Settings::saveCredentials(const String& id, const String& secret) {
  Preferences p;
  p.begin(NS, false);
  p.putString("id", id);
  p.putString("secret", secret);
  p.end();
  deviceId = id;
  deviceSecret = secret;
}

void Settings::saveRuntime() {
  Preferences p;
  p.begin(NS, false);
  // putX only writes when the value changed, which spares flash wear.
  p.putUInt("interval", intervalSec);
  p.putBool("zone_ok", zone.valid);
  p.putDouble("zone_lat", zone.lat);
  p.putDouble("zone_lng", zone.lng);
  p.putFloat("zone_r", zone.radiusM);
  p.putBool("lost", lostMode);
  p.end();
}

void Settings::factoryReset() {
  Preferences p;
  p.begin(NS, false);
  p.clear();
  p.end();
  WiFi.disconnect(true, true);  // also erases the stored Wi-Fi credentials
  *this = Settings();
}
