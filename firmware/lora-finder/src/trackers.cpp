#include "trackers.h"
#include <Preferences.h>
#include "config.h"

namespace trackers {
namespace {
PairedTracker list[MAX_TRACKERS];
TrackerLive state[MAX_TRACKERS];
size_t n = 0;
const char* NS = "pmfinder";

void persist() {
  Preferences p;
  p.begin(NS, false);
  p.putUChar("n", (uint8_t)n);
  if (n) p.putBytes("list", list, sizeof(PairedTracker) * n);
  else p.remove("list");
  p.end();
}
}  // namespace

void load() {
  Preferences p;
  p.begin(NS, false);
  n = min<size_t>(p.getUChar("n", 0), MAX_TRACKERS);
  if (n && p.getBytes("list", list, sizeof(PairedTracker) * n) != sizeof(PairedTracker) * n) n = 0;
  p.end();
}

size_t count() { return n; }
PairedTracker& at(size_t i) { return list[i]; }
TrackerLive& live(size_t i) { return state[i]; }

int indexOf(uint32_t nodeId) {
  for (size_t i = 0; i < n; i++) if (list[i].nodeId == nodeId) return (int)i;
  return -1;
}

bool add(uint32_t nodeId, const uint8_t key[pmlora::kKeyLen], const char* name) {
  int i = indexOf(nodeId);
  if (i < 0) {
    if (n >= MAX_TRACKERS) return false;
    i = (int)n++;
    state[i] = TrackerLive();
  }
  list[i].nodeId = nodeId;
  memcpy(list[i].key, key, pmlora::kKeyLen);
  strlcpy(list[i].name, name ? name : "", sizeof(list[i].name));
  persist();
  return true;
}

bool remove(uint32_t nodeId) {
  const int i = indexOf(nodeId);
  if (i < 0) return false;
  for (size_t j = i; j + 1 < n; j++) {
    list[j] = list[j + 1];
    state[j] = state[j + 1];
  }
  n--;
  persist();
  return true;
}

void eraseAll() {
  n = 0;
  persist();
}

}  // namespace trackers
