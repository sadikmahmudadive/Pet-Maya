#pragma once
#include <Arduino.h>
#include "types.h"

namespace cloud {

// True once the system clock is trustworthy (NTP, falling back to GPS time).
bool ensureTime();

// POST telemetry + buffered fixes to the Cloud Function and parse its directive.
// Requests are signed: X-Signature = HMAC-SHA256(deviceSecret, "<ts>.<body>").
bool sync(const Sample* samples, size_t count, const Telemetry& t, Directive& out, int& httpCode);

// Lower-case hex SHA-256 / HMAC helpers (also used by OTA verification).
String hmacSha256Hex(const String& key, const String& message);

}  // namespace cloud
