#pragma once
#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <pmlora.h>

// Uplink heard on air, handed from the radio task to the network task.
struct RxFrame {
  uint8_t data[pmlora::kMaxFrame];
  uint8_t len;
  float rssi;
  float snr;
  uint32_t rxMs;  // millis() at reception
  uint32_t ref;   // gateway-local sequence number, echoed by the cloud
};

// Downlink from the cloud for the radio task.
struct TxFrame {
  uint8_t data[pmlora::kMaxFrame];
  uint8_t len;
  uint32_t nodeId;
  uint32_t forRxMs;     // the uplink this answers (0 = none)
  uint32_t deadlineMs;  // must start TX before this, else cache for the node's next uplink
};

struct GatewayStats {
  volatile uint32_t rxOk = 0;
  volatile uint32_t rxBad = 0;      // CRC errors / unreadable
  volatile uint32_t rxForeign = 0;  // valid LoRa, not a Pet Maya frame
  volatile uint32_t txDown = 0;
  volatile uint32_t dropped = 0;    // queue/store-and-forward overflow
};

extern QueueHandle_t uplinkQueue;
extern QueueHandle_t downlinkQueue;
extern GatewayStats stats;
