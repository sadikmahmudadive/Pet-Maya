// Host tests for the LoRa wire format. The hex vectors are shared with
// functions/src/lora.test.ts and pmlora::selfTest() so all three ends agree.
#include <unity.h>
#include <pmlora.h>
#include <petlogic.h>

using namespace pmlora;

void setUp() {}
void tearDown() {}

static void assertHex(const char* hex, const uint8_t* bytes, size_t n) {
  char buf[128] = {0};
  for (size_t i = 0; i < n; i++) snprintf(buf + 2 * i, 3, "%02x", bytes[i]);
  TEST_ASSERT_EQUAL_STRING(hex, buf);
}

void test_uplink_golden_bytes() {
  Uplink u;
  u.latE7 = 237808875; u.lngE7 = 904125000; u.altM = 12; u.speedKmh = 3; u.hdopX10 = 12;
  u.sats = 8; u.batteryPct = 87; u.flags = kUpHasFix | kUpInsideZone; u.fixAgeS = 2;
  u.fwMajor = 1; u.fwMinor = 0; u.lastDownCounter = 5;
  uint8_t b[kUplinkLen];
  encodeUplink(u, b);
  assertHex("ebac2c0e48dae3350c00030c0857030200010005000000", b, kUplinkLen);

  Uplink back;
  decodeUplink(b, back);
  TEST_ASSERT_EQUAL_INT32(237808875, back.latE7);
  TEST_ASSERT_EQUAL_INT32(904125000, back.lngE7);
  TEST_ASSERT_EQUAL_UINT32(5, back.lastDownCounter);
}

void test_negative_coordinates_roundtrip() {
  Uplink u;
  u.latE7 = -338688000; u.lngE7 = -1512093000; u.altM = -20;
  uint8_t b[kUplinkLen];
  encodeUplink(u, b);
  Uplink back;
  decodeUplink(b, back);
  TEST_ASSERT_EQUAL_INT32(-338688000, back.latE7);
  TEST_ASSERT_EQUAL_INT32(-1512093000, back.lngE7);
  TEST_ASSERT_EQUAL_INT16(-20, back.altM);
}

void test_header_and_downlink_golden_bytes() {
  Header h;
  h.type = kTypeUplink; h.nodeId = 0x0A1B2C3D; h.counter = 42;
  uint8_t hb[kHeaderLen];
  encodeHeader(h, hb);
  assertHex("113d2c1b0a2a000000", hb, kHeaderLen);

  Downlink d;
  d.intervalS = 300; d.flags = kDownRing | kDownZoneValid;
  d.zoneLatE7 = 237800000; d.zoneLngE7 = 904100000; d.zoneRadiusM = 350;
  uint8_t db[kDownlinkLen];
  encodeDownlink(d, db);
  assertHex("2c0105408a2c0ea078e3355e01", db, kDownlinkLen);
}

void test_parse_header_rejects_bad_frames() {
  uint8_t frame[kMaxFrame] = {0x11, 0x3d, 0x2c, 0x1b, 0x0a, 0x2a, 0, 0, 0};
  Header h;
  TEST_ASSERT_TRUE(parseHeader(frame, kMaxFrame, h));
  TEST_ASSERT_EQUAL_HEX32(0x0A1B2C3D, h.nodeId);
  TEST_ASSERT_EQUAL_UINT32(42, h.counter);
  TEST_ASSERT_FALSE(parseHeader(frame, kMaxFrame - 1, h));  // wrong length for type
  frame[0] = 0x21;                                            // version 2
  TEST_ASSERT_FALSE(parseHeader(frame, kMaxFrame, h));
  frame[0] = 0x13;                                            // unknown type
  TEST_ASSERT_FALSE(parseHeader(frame, kMaxFrame, h));
}

void test_device_id_format() {
  char id[13];
  deviceIdFor(0x0A1B2C3D, id);
  TEST_ASSERT_EQUAL_STRING("PML-0A1B2C3D", id);
}

int main() {
  UNITY_BEGIN();
  RUN_TEST(test_uplink_golden_bytes);
  RUN_TEST(test_negative_coordinates_roundtrip);
  RUN_TEST(test_header_and_downlink_golden_bytes);
  RUN_TEST(test_parse_header_rejects_bad_frames);
  RUN_TEST(test_device_id_format);
  return UNITY_END();
}
