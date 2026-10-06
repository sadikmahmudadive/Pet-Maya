// AES-128-CCM (8-byte tag) via mbedTLS — must stay byte-compatible with Node's
// crypto 'aes-128-ccm' in functions/src/lora.ts.
#if defined(ESP_PLATFORM)
#include <mbedtls/ccm.h>
#include "pmlora.h"

namespace pmlora {

bool seal(const uint8_t key[kKeyLen], const Header& h, uint8_t dir, const uint8_t* plain,
          size_t plainLen, uint8_t* frameOut, size_t& frameLen) {
  uint8_t nonce[kNonceLen];
  encodeHeader(h, frameOut);
  buildNonce(h.nodeId, h.counter, dir, nonce);

  mbedtls_ccm_context ctx;
  mbedtls_ccm_init(&ctx);
  bool ok = mbedtls_ccm_setkey(&ctx, MBEDTLS_CIPHER_ID_AES, key, 128) == 0 &&
            mbedtls_ccm_encrypt_and_tag(&ctx, plainLen, nonce, kNonceLen, frameOut, kHeaderLen, plain,
                                        frameOut + kHeaderLen, frameOut + kHeaderLen + plainLen,
                                        kTagLen) == 0;
  mbedtls_ccm_free(&ctx);
  frameLen = ok ? kHeaderLen + plainLen + kTagLen : 0;
  return ok;
}

bool open(const uint8_t key[kKeyLen], const uint8_t* frame, size_t frameLen, uint8_t dir, Header& h,
          uint8_t* plainOut, size_t& plainLen) {
  if (!parseHeader(frame, frameLen, h)) return false;
  plainLen = frameLen - kHeaderLen - kTagLen;
  uint8_t nonce[kNonceLen];
  buildNonce(h.nodeId, h.counter, dir, nonce);

  mbedtls_ccm_context ctx;
  mbedtls_ccm_init(&ctx);
  bool ok = mbedtls_ccm_setkey(&ctx, MBEDTLS_CIPHER_ID_AES, key, 128) == 0 &&
            mbedtls_ccm_auth_decrypt(&ctx, plainLen, nonce, kNonceLen, frame, kHeaderLen,
                                     frame + kHeaderLen, plainOut, frame + kHeaderLen + plainLen,
                                     kTagLen) == 0;
  mbedtls_ccm_free(&ctx);
  return ok;
}

bool selfTest() {
  // Golden vector shared with functions/src/lora.test.ts (generated with Python `cryptography`).
  static const uint8_t key[kKeyLen] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15};
  static const uint8_t plain[kUplinkLen] = {0xeb, 0xac, 0x2c, 0x0e, 0x48, 0xda, 0xe3, 0x35, 0x0c, 0x00, 0x03, 0x0c,
                                            0x08, 0x57, 0x03, 0x02, 0x00, 0x01, 0x00, 0x05, 0x00, 0x00, 0x00};
  static const uint8_t expected[kMaxFrame] = {
      0x11, 0x3d, 0x2c, 0x1b, 0x0a, 0x2a, 0x00, 0x00, 0x00, 0xc9, 0xb6, 0x70, 0xef, 0x5d, 0x0f, 0x24, 0x32, 0xd0, 0x05, 0x53,
      0xf3, 0x67, 0xb6, 0x13, 0x23, 0x59, 0xbd, 0x89, 0xd4, 0xdc, 0x2d, 0x3f, 0xd7, 0x88, 0xf7, 0x97, 0x73, 0xd6, 0x43, 0x9b};
  Header h;
  h.type = kTypeUplink;
  h.nodeId = 0x0A1B2C3D;
  h.counter = 42;
  uint8_t frame[kMaxFrame];
  size_t len = 0;
  if (!seal(key, h, kDirUp, plain, kUplinkLen, frame, len) || len != kMaxFrame) return false;
  if (memcmp(frame, expected, kMaxFrame) != 0) return false;
  uint8_t back[kUplinkLen];
  size_t backLen = 0;
  Header h2;
  if (!open(key, frame, len, kDirUp, h2, back, backLen) || memcmp(back, plain, kUplinkLen) != 0) return false;
  frame[12] ^= 0x01;  // tampering must be rejected
  if (open(key, frame, len, kDirUp, h2, back, backLen)) return false;

  // Command frame (finder → tracker, direction down): ring + search 30 min, counter 8.
  static const uint8_t cmdExpected[kHeaderLen + kCommandLen + kTagLen] = {
      0x13, 0x3d, 0x2c, 0x1b, 0x0a, 0x08, 0x00, 0x00, 0x00, 0xd7,
      0x7a, 0x98, 0x0d, 0xb5, 0x3f, 0x28, 0x7b, 0xb1, 0xfd};
  const uint8_t cmdPlain[kCommandLen] = {kCmdRing | kCmdSearch, 30};
  Header ch;
  ch.type = kTypeCommand;
  ch.nodeId = 0x0A1B2C3D;
  ch.counter = 8;
  if (!seal(key, ch, kDirDown, cmdPlain, kCommandLen, frame, len)) return false;
  return len == sizeof(cmdExpected) && memcmp(frame, cmdExpected, len) == 0;
}

}  // namespace pmlora
#endif
