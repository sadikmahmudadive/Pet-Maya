// BLE GATT link to the Pet Maya app. Mirrored in lib/core/services/lora_finder_service.dart.
//
// Service  7b1e0001-5a3c-4c8e-9f2d-504d4c4f5241
//   FIXES   7b1e0002-…  notify  {"t":"fix","id":"PML-…","lat":…,"lng":…,"alt":…,"spd":…,"hd":…,"sat":…,
//                                "bat":…,"f":<uplink flags>,"age":<fix age s>,"rssi":…,"snr":…,"ago":<s since heard>}
//   CONTROL 7b1e0003-…  write   {"op":"add","id":"PML-…","key":"<32 hex>","name":"Maya"} | {"op":"remove","id":…}
//                               {"op":"list"} | {"op":"dump"} | {"op":"info"}
//                               {"op":"ring","id":…} | {"op":"search","id":…,"min":30}
//   STATUS  7b1e0004-…  notify  {"t":"ack","op":…,"ok":true,"err":…} | {"t":"tracker",…} {"t":"listEnd"}
//                               {"t":"queued"|"sent"|"delivered"|"failed","id":…,"cmd":…} | {"t":"info",…}
//
// All characteristics require an encrypted, MITM-authenticated (passkey) bond.
#pragma once
#include <Arduino.h>

namespace blelink {
void begin(const String& deviceName, uint32_t passkey);
bool connected();
void notifyFix(const String& json);
void notifyStatus(const String& json);
bool popControl(String& out);  // next JSON written by the app (thread-safe queue)
}  // namespace blelink
