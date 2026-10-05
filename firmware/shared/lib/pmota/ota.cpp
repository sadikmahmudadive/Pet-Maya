#include "ota.h"
#include <HTTPClient.h>
#include <Update.h>
#include <WiFiClientSecure.h>
#include <esp_task_wdt.h>
#include <mbedtls/sha256.h>

extern const uint8_t rootca_crt_bundle_start[] asm("_binary_x509_crt_bundle_start");

namespace ota {

static constexpr uint32_t HTTP_TIMEOUT_MS = 15000;

bool apply(const String& url, const String& expectedSha256Hex) {
  if (!url.startsWith("https://") || expectedSha256Hex.length() != 64) return false;

  WiFiClientSecure client;
  client.setCACertBundle(rootca_crt_bundle_start);
  HTTPClient http;
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.setConnectTimeout(HTTP_TIMEOUT_MS);
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(client, url)) return false;

  const int code = http.GET();
  const int len = http.getSize();
  if (code != 200 || len <= 0) {
    log_w("[ota] GET failed: %d len=%d", code, len);
    http.end();
    return false;
  }
  if (!Update.begin(len)) {
    log_w("[ota] not enough space");
    http.end();
    return false;
  }

  mbedtls_sha256_context sha;
  mbedtls_sha256_init(&sha);
  mbedtls_sha256_starts(&sha, 0);

  WiFiClient* stream = http.getStreamPtr();
  uint8_t buf[1024];
  int remaining = len;
  uint32_t lastData = millis();
  bool ok = true;
  while (remaining > 0) {
    esp_task_wdt_reset();
    const int avail = stream->available();
    if (avail <= 0) {
      if (!http.connected() || millis() - lastData > HTTP_TIMEOUT_MS) { ok = false; break; }
      delay(5);
      continue;
    }
    const int n = stream->readBytes(buf, min((int)sizeof(buf), min(avail, remaining)));
    if (n <= 0) continue;
    lastData = millis();
    mbedtls_sha256_update(&sha, buf, n);
    if (Update.write(buf, n) != (size_t)n) { ok = false; break; }
    remaining -= n;
  }

  uint8_t digest[32];
  mbedtls_sha256_finish(&sha, digest);
  mbedtls_sha256_free(&sha);
  http.end();

  if (ok) {
    static const char* hex = "0123456789abcdef";
    String got;
    for (int i = 0; i < 32; i++) { got += hex[digest[i] >> 4]; got += hex[digest[i] & 15]; }
    String want = expectedSha256Hex;
    want.toLowerCase();
    if (got != want) {
      log_w("[ota] checksum mismatch");
      ok = false;
    }
  }

  if (!ok || !Update.end(true)) {  // end(true) also validates the image header
    Update.abort();
    return false;
  }
  log_i("[ota] success, rebooting");
  delay(200);
  ESP.restart();
  return true;
}

}  // namespace ota
