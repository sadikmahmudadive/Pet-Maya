#pragma once
#include <Arduino.h>

namespace ota {
// Download `url` over verified HTTPS into the inactive slot, check its SHA-256,
// then switch slots and reboot. Returns false (and keeps running the current
// firmware) on any failure — the running image is never touched.
bool apply(const String& url, const String& expectedSha256Hex);
}  // namespace ota
