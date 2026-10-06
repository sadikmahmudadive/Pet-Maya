# Pet Maya device firmware

| Project | What it is | Link to the cloud |
|---|---|---|
| [lora-tracker/](lora-tracker/) | GPS tracker: ESP32-WROOM + NEO-6M + Ra-02 (SX1278 433 MHz) | LoRa → any Pet Maya gateway |
| [lora-gateway/](lora-gateway/) | LoRa gateway: ESP32-WROOM + Ra-02 on Wi-Fi, mains powered | Wi-Fi → `lora_ingest` |
| [lora-finder/](lora-finder/) | Handheld offline receiver: ESP32-WROOM + Ra-02 + Bluetooth | BLE → Pet Maya app (no internet) |
| [wifi-collar/](wifi-collar/) | Wi-Fi-only collar (for use around home Wi-Fi) | Wi-Fi → `device_ingest` |
| [shared/lib/](shared/lib/) | `pmlora` protocol, `pmradio` Ra-02 driver, `pmhw` GPS/battery, `pmui` LED/buzzer, `pmota`, `petlogic` | — |
| [tools/provision.py](tools/provision.py) | Factory tool: derives and flashes device/gateway credentials | — |

All of them write the same Firestore `devices/{id}` fields (`latitude`, `longitude`, `batteryLevel`,
`isOnline`, `isSafeZone`, `lastSyncAt`, …) that the Pet Maya app and website already read, and obey the
same controls (tracking mode, lost mode, safe zone, "ring").

---

## Why LoRa instead of GSM

- **No SIM, no monthly fee, no dependence on mobile coverage.** Trackers talk to gateways you (and other
  Pet Maya users, clinics, shelters) own.
- **Long range on little power.** At SF9/125 kHz a 41-byte uplink takes ~185 ms of airtime. Typical range
  is 1–3 km in dense city, 5–15 km with line of sight to a rooftop gateway.
- **A network that grows with users.** Gateways are dumb relays with no keys. Any Pet Maya gateway carries
  any Pet Maya tracker, so every gateway installed improves coverage for everyone (the model LoRaWAN and
  community networks use).

**Offline option:** every LoRa uplink is a broadcast, so a [LoRa Finder](lora-finder/) in your hand can hear
the same report as the gateways, decrypt it locally and show it in the app over Bluetooth, with no
internet at all. It can also ring the collar or switch it to fast search mode.

**Trade-off:** without a finder, a tracker is only "live" while it's within reach of some gateway. Outside coverage it keeps
running and the next uplink a gateway hears updates the map. Plan gateways around where pets actually go:
home, the local park, the clinic.

## How it fits together

```
 Tracker ──LoRa 433 MHz──▶ Gateway ──HTTPS (Wi-Fi)──▶ lora_ingest (Cloud Function) ──▶ Firestore devices/PML-xxxxxxxx
   ▲   encrypted 41-byte uplink     (relays bytes,        verifies + decrypts, de-dups,       ▲
   │                                 holds no keys)       geofence, alerts, history          │ app / website
   └──────── encrypted downlink in the tracker's 3 s receive window ◀────────────────────────┘ (lost mode, ring, …)
```

### Protocol (`shared/lib/pmlora/pmlora.h`, mirrored in `functions/src/lora_codec.ts`)
- **Frame:** 9-byte header (version/type, node id, frame counter) + AES-128-CCM payload + 8-byte tag.
  Uplink payload is 23 bytes (position, altitude, speed, HDOP, satellites, battery, flags, fix age,
  firmware, last downlink acknowledged).
- **Security:** each tracker has its own AES key, derived from `DEVICE_MASTER_SECRET`. Frames are
  authenticated, encrypted and replay-protected by monotonic counters, which survive reboots. A gateway
  can't read, alter or forge tracker data.
- **De-duplication:** if several gateways hear the same frame, the counter makes the cloud accept it once
  and answer through one gateway only.
- **Downlinks (class-A style):** the tracker listens for 3 s after each uplink. The gateway sends the
  cloud's answer immediately if it arrives in time, otherwise it caches it and sends it right after that
  tracker's next uplink. The tracker echoes the newest downlink counter it applied, and the cloud keeps
  re-sending commands until they're acknowledged. This is how "ring" reliably gets through.
- **Same bytes everywhere:** golden test vectors (made independently with Python `cryptography`) are
  checked in three places: the C++ host tests, the TypeScript tests (`cd functions && npm test`) and
  `pmlora::selfTest()`, which runs on the ESP32 at every boot.

## Setup checklist

1. **Secret.** `firebase functions:secrets:set DEVICE_MASTER_SECRET` with a long random value. Keep a
   copy for the factory tool. Then run `firebase deploy --only functions,firestore:rules`.
2. **Gateway.** Flash `lora-gateway`, then run
   `python tools/provision.py gateway GW-HOME-0001 --flash COMx`. Join its `PetMaya-GW-XXXX` Wi-Fi to
   connect it to the internet (details in the [gateway README](lora-gateway/README.md)).
3. **Tracker.** Flash `lora-tracker`, then run `python tools/provision.py lora-node --random --flash COMy`.
   It shows up as `devices/PML-XXXXXXXX`. Link it to a pet by setting `petId`, `petName` and `ownerId`
   on that document.
4. Optional: a Firestore TTL policy on collection group `history`, field `expireAt` (30-day track history).

## Radio regulations — read before deploying

The 433 MHz band rules (allowed frequencies, power, duty cycle, licensing) differ by country, and the
Ra-02 can transmit more than is allowed in many places. The defaults are conservative: 433.175 MHz,
+14 dBm, a 1 % airtime cap enforced in firmware, and a 20 s minimum interval. **Check with your national
regulator (e.g. BTRC in Bangladesh) before you sell or deploy devices**, and adjust `kFreqMHz` /
`LORA_TX_POWER_DBM` to match. If you later want to use public LoRaWAN networks (TTN, Helium), you'll need
regional-band modules (e.g. AS923 in much of Asia) rather than the 433 MHz Ra-02.

## Build and test

```bash
cd firmware/lora-tracker && pio run && pio test -e native
cd firmware/lora-gateway && pio run
cd firmware/lora-finder  && pio run
cd firmware/wifi-collar  && pio run && pio test -e native
cd functions && npm test
```

Each project also has a `*-debug` environment (verbose serial logs) and an `*-sx1279` environment for
SX1279-based boards.
