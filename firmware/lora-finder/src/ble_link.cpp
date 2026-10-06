#include "ble_link.h"
#include <NimBLEDevice.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include "config.h"

namespace blelink {
namespace {
const char* SERVICE_UUID = "7b1e0001-5a3c-4c8e-9f2d-504d4c4f5241";
const char* FIXES_UUID = "7b1e0002-5a3c-4c8e-9f2d-504d4c4f5241";
const char* CONTROL_UUID = "7b1e0003-5a3c-4c8e-9f2d-504d4c4f5241";
const char* STATUS_UUID = "7b1e0004-5a3c-4c8e-9f2d-504d4c4f5241";

constexpr size_t kMsgMax = 240;
struct Msg { char data[kMsgMax]; };

NimBLECharacteristic* fixesChr = nullptr;
NimBLECharacteristic* statusChr = nullptr;
QueueHandle_t controlQueue = nullptr;
volatile int connections = 0;
uint32_t pin = 0;

class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer*, ble_gap_conn_desc*) override { connections++; }
  void onDisconnect(NimBLEServer*, ble_gap_conn_desc*) override {
    if (connections > 0) connections--;
    NimBLEDevice::startAdvertising();
  }
  uint32_t onPassKeyRequest() override { return pin; }
  void onAuthenticationComplete(ble_gap_conn_desc* desc) override {
    if (!desc->sec_state.encrypted || !desc->sec_state.authenticated) {
      NimBLEDevice::getServer()->disconnect(desc->conn_handle);  // wrong passkey / no MITM
    }
  }
};

class ControlCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* c) override {
    const std::string v = c->getValue();
    if (v.empty() || v.size() >= kMsgMax) return;
    Msg m;
    memcpy(m.data, v.data(), v.size());
    m.data[v.size()] = 0;
    xQueueSend(controlQueue, &m, 0);
  }
};

void notify(NimBLECharacteristic* chr, const String& json) {
  if (!chr || connections == 0) return;
  chr->setValue((const uint8_t*)json.c_str(), json.length());
  chr->notify();
}
}  // namespace

void begin(const String& deviceName, uint32_t passkey) {
  pin = passkey;
  controlQueue = xQueueCreate(8, sizeof(Msg));

  NimBLEDevice::init(deviceName.c_str());
  NimBLEDevice::setMTU(BLE_MTU);
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);
  // Bonded, MITM-protected LE Secure Connections with a static passkey (printed on the label).
  NimBLEDevice::setSecurityAuth(true, true, true);
  NimBLEDevice::setSecurityPasskey(passkey);
  NimBLEDevice::setSecurityIOCap(BLE_HS_IO_DISPLAY_ONLY);

  NimBLEServer* server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());
  NimBLEService* svc = server->createService(SERVICE_UUID);
  const uint32_t secureRead = NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::READ_ENC | NIMBLE_PROPERTY::READ_AUTHEN;
  fixesChr = svc->createCharacteristic(FIXES_UUID, secureRead | NIMBLE_PROPERTY::NOTIFY);
  statusChr = svc->createCharacteristic(STATUS_UUID, secureRead | NIMBLE_PROPERTY::NOTIFY);
  NimBLECharacteristic* ctrl = svc->createCharacteristic(
      CONTROL_UUID, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_ENC | NIMBLE_PROPERTY::WRITE_AUTHEN);
  ctrl->setCallbacks(new ControlCallbacks());
  svc->start();

  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->setScanResponse(true);
  adv->start();
}

bool connected() { return connections > 0; }
void notifyFix(const String& json) { notify(fixesChr, json); }
void notifyStatus(const String& json) { notify(statusChr, json); }

bool popControl(String& out) {
  Msg m;
  if (!controlQueue || xQueueReceive(controlQueue, &m, 0) != pdTRUE) return false;
  out = m.data;
  return true;
}

}  // namespace blelink
