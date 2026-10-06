#include "node_state.h"
#include <Preferences.h>
#include "config.h"

NodeState node;
RTC_DATA_ATTR RtcState rtc;

static const char* NS = "pmlora";
static constexpr uint32_t kRtcMagic = 0x504D4C31;  // "PML1"

void NodeState::load() {
  Preferences p;
  p.begin(NS, false);  // read-write: creates the namespace on first boot
  nodeId = p.getUInt("node", 0);
  hasKey = p.getBytes("key", key, sizeof(key)) == sizeof(key);
  intervalS = constrain(p.getUInt("interval", DEFAULT_INTERVAL_S), 5u, MAX_INTERVAL_S);
  lostMode = p.getBool("lost", false);
  zone.valid = p.getBool("zone_ok", false);
  zone.lat = p.getDouble("zone_lat", 0);
  zone.lng = p.getDouble("zone_lng", 0);
  zone.radiusM = p.getFloat("zone_r", 0);
  lastDownCounter = p.getUInt("dcnt", 0);
  const uint32_t persisted = p.getUInt("ucnt", 0);
  p.end();

  if (rtc.magic != kRtcMagic) {
    // Power-on (RTC memory lost): skip past any counter values that may have been
    // used since the last persist, so the cloud never sees a reused counter.
    memset(&rtc, 0, sizeof(rtc));
    rtc.magic = kRtcMagic;
    rtc.upCounter = persisted + COUNTER_PERSIST_EVERY;
    rtc.counterPersistedAt = 0;  // force a persist on first use
    rtc.insideZone = true;
    rtc.coldBootPending = true;
  }
}

void NodeState::saveCredentials(uint32_t id, const uint8_t k[pmlora::kKeyLen]) {
  Preferences p;
  p.begin(NS, false);
  p.putUInt("node", id);
  p.putBytes("key", k, pmlora::kKeyLen);
  p.putUInt("ucnt", 0);
  p.putUInt("dcnt", 0);
  p.end();
  nodeId = id;
  memcpy(key, k, pmlora::kKeyLen);
  hasKey = true;
  lastDownCounter = 0;
  rtc.magic = 0;  // re-init counters on next load
}

void NodeState::saveConfig() {
  Preferences p;
  p.begin(NS, false);
  p.putUInt("interval", intervalS);
  p.putBool("lost", lostMode);
  p.putBool("zone_ok", zone.valid);
  p.putDouble("zone_lat", zone.lat);
  p.putDouble("zone_lng", zone.lng);
  p.putFloat("zone_r", zone.radiusM);
  p.putUInt("dcnt", lastDownCounter);
  p.end();
}

uint32_t NodeState::nextUpCounter() {
  const uint32_t c = ++rtc.upCounter;
  if (rtc.counterPersistedAt == 0 || c - rtc.counterPersistedAt >= COUNTER_PERSIST_EVERY) {
    Preferences p;
    p.begin(NS, false);
    p.putUInt("ucnt", c);
    p.end();
    rtc.counterPersistedAt = c;
  }
  return c;
}

void NodeState::factoryReset() {
  // User-level reset: forget settings pushed by the cloud, but keep identity, key and
  // frame counters (losing those would make the cloud reject the tracker as a replay).
  intervalS = DEFAULT_INTERVAL_S;
  lostMode = false;
  zone = petlogic::SafeZone();
  Preferences p;
  p.begin(NS, false);
  p.remove("interval");
  p.remove("lost");
  p.remove("zone_ok");
  p.remove("zone_lat");
  p.remove("zone_lng");
  p.remove("zone_r");
  p.end();
}

void NodeState::eraseAll() {
  // Factory/RMA only. A tracker re-provisioned with the same node id must also have
  // `upCounter` and `downCounter` cleared on its Firestore devices/PML-… document.
  Preferences p;
  p.begin(NS, false);
  p.clear();
  p.end();
  rtc.magic = 0;
  *this = NodeState();
}
