#pragma once
#include <Arduino.h>

// Serial console (115200) for factory provisioning and bench work:
//   provision <nodeIdHex8> <keyHex32>   status   send   factory-reset   erase-all   reboot
namespace console {
// Returns true when the user asked for an immediate uplink ("send").
bool poll();
}
