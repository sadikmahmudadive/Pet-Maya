#include <unity.h>
#include "petlogic.h"

using namespace petlogic;

void setUp() {}
void tearDown() {}

void test_haversine_known_distance() {
  // ~111.2 km per degree of latitude
  TEST_ASSERT_FLOAT_WITHIN(200.0, 111195.0, haversineMeters(0, 0, 1, 0));
  TEST_ASSERT_FLOAT_WITHIN(0.01, 0.0, haversineMeters(23.78, 90.41, 23.78, 90.41));
}

void test_safe_zone_hysteresis() {
  SafeZone z;
  z.valid = true; z.lat = 23.7800; z.lng = 90.4100; z.radiusM = 100;
  // ~0.00095° lat ≈ 105 m north: outside the strict edge, inside the 15 m margin
  const double lat = 23.78095;
  TEST_ASSERT_TRUE(isInsideSafeZone(z, lat, z.lng, /*wasInside=*/true));
  TEST_ASSERT_FALSE(isInsideSafeZone(z, lat, z.lng, /*wasInside=*/false));
  TEST_ASSERT_FALSE(isInsideSafeZone(z, 23.7820, z.lng, true));  // ~220 m: clearly out
  TEST_ASSERT_TRUE(isInsideSafeZone(SafeZone{}, 1, 1, false));   // no zone → safe
}

void test_battery_curve() {
  TEST_ASSERT_EQUAL(0, batteryPercentFromMv(3000));
  TEST_ASSERT_EQUAL(100, batteryPercentFromMv(4300));
  TEST_ASSERT_EQUAL(20, batteryPercentFromMv(3700));
  const int mid = batteryPercentFromMv(3775);
  TEST_ASSERT_TRUE(mid > 30 && mid < 40);
}

void test_rssi_bars() {
  TEST_ASSERT_EQUAL(4, rssiToBars(-40));
  TEST_ASSERT_EQUAL(3, rssiToBars(-60));
  TEST_ASSERT_EQUAL(2, rssiToBars(-70));
  TEST_ASSERT_EQUAL(1, rssiToBars(-90));
}

int main() {
  UNITY_BEGIN();
  RUN_TEST(test_haversine_known_distance);
  RUN_TEST(test_safe_zone_hysteresis);
  RUN_TEST(test_battery_curve);
  RUN_TEST(test_rssi_bars);
  return UNITY_END();
}
