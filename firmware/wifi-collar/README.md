# Pet Maya Wi-Fi collar firmware

> For tracking away from home Wi-Fi, use the SIM-free LoRa tracker in [../lora-tracker](../lora-tracker) instead. Overview: [../README.md](../README.md).

PlatformIO / Arduino firmware for the GPS smart collar, running on an **ESP32-WROOM-32 DevKit** (`esp32dev`).
It reports location, battery and signal to the same Firestore `devices/{id}` documents the Pet Maya
mobile and web apps already read, and obeys commands from them (find-my-pet buzzer, lost mode,
tracking mode, safe zone).

## Hardware (assumed reference build)

The WROOM module has Wi-Fi and BLE but **no GPS and no cellular**, so the collar needs these parts:

| Part | Connection |
|---|---|
| u-blox NEO-6M / NEO-M8N GPS | GPS TX → GPIO16, GPS RX → GPIO17, 3V3, GND |
| GPS power switch (optional, enables deep sleep) | load switch / P-MOSFET gate ← GPIO4 (HIGH = on). Set `PIN_GPS_EN = -1` if GPS is hard-wired on |
| Single-cell LiPo + charger (e.g. TP4056 w/ protection) | cell+ → 100 kΩ/100 kΩ divider → GPIO34 (ADC1) |
| Piezo buzzer (via NPN transistor) | GPIO25 |
| Status LED | GPIO2 (on-board) |
| BOOT button | GPIO0 (hold 5 s at power-up = factory reset) |

Different pins or divider ratio? Edit [include/config.h](include/config.h) only.

Connectivity is **Wi-Fi only** (the collar reports while it's within range of a known network, and buffers
up to 24 fixes — including across deep sleep — until it is back). A cellular version needs a different
modem and is not covered here.

## Build, flash, test

```bash
pip install platformio            # or use the PlatformIO IDE extension
cd firmware/wifi-collar
pio run                           # production build (esp32dev)
pio run -e esp32dev-debug -t upload && pio device monitor   # bench build with logging
pio test -e native                # host unit tests (geofence, battery curve, ...)
```

Before shipping, set the real endpoint in `platformio.ini` (`INGEST_URL`) if your Firebase project or
region differs from `us-central1-pet-maya`.

## Provisioning a collar

Each collar has a **Device ID** (e.g. `PM-A1B2C3D4`) and a **secret derived from it**:

```bash
export DEVICE_MASTER_SECRET=...   # same value as the Firebase secret below
python ../tools/provision.py wifi-collar PM-A1B2C3D4 --flash COM5   # prints the secret and writes it to the collar
```

Wi-Fi for the customer: a collar with no credentials (or after factory reset) opens the access point
**`PetMaya-XXXX`** (password = the last 8 hex digits of its MAC, printed on the label). The portal at
`192.168.4.1` takes the Wi-Fi network and, if not pre-flashed, the Device ID and secret.

Serial console (115200): `status`, `provision <id> <secret>`, `wifi <ssid> <pass>`, `factory-reset`, `reboot`.

## Backend setup (one time)

```bash
firebase functions:secrets:set DEVICE_MASTER_SECRET     # long random string; also used by the tool above
firebase deploy --only functions                        # deploys device_ingest + mark_offline_devices
```

Optional Firestore setup: a TTL policy on collection group `history`, field `expireAt` (track history is
kept 30 days by default); a document `firmware/esp32dev` for OTA (below).

## How it talks to the cloud

`POST {INGEST_URL}` every *interval* seconds with JSON `{fw, battery, rssi, isSafe, samples:[{ts,lat,lng,spd,hdop,alt,sats}], ...}`.

Headers: `X-Device-Id`, `X-Timestamp` (unix s), `X-Signature` = hex `HMAC-SHA256(deviceSecret, "<ts>.<raw body>")`.
The function rejects bad signatures, clock skew > 5 min, replays and `revoked: true` devices, and TLS is
verified with the ESP32 Mozilla CA bundle.

The response drives the collar:

| Field | Source in `devices/{id}` | Effect |
|---|---|---|
| `intervalSec` | `trackingMode` ("Real-Time (10s)" → 10, "Balanced (5m)" → 300, "Battery Saver (30m)" → 1800) / `lostMode` → 5 | reporting rate; ≥ 300 s switches to deep-sleep duty cycle |
| `ring` | `ringRequestedAt` (one-shot) | buzzer for 30 s |
| `lostMode` | `lostMode` | fast LED, 5 s reporting |
| `safeZone` | `homeLat`, `homeLng`, `safeZoneRadius` | on-device geofence (15 m hysteresis) → `isSafeZone` |
| `ota` | `firmware/esp32dev` | see below |

The function writes back `latitude`, `longitude`, `batteryLevel`, `signalStrength` (1–4), `isOnline`,
`isSafeZone`, `firmwareVersion`, `lastSync` (ISO) and `lastSyncAt` (ms), appends fixes to
`devices/{id}/history`, and notifies the owner (`ownerId`/`userId` on the device doc) when the collar
leaves the safe zone or the battery drops to 15 %. A device that has never been seen gets an unclaimed
`devices/{id}` document; link it to a pet/owner by setting `petId`, `petName` and `ownerId`.

## Power behaviour

| Interval | Mode | GPS | Wi-Fi/CPU |
|---|---|---|---|
| < 300 s or lost mode | continuous | on | modem sleep |
| ≥ 300 s (needs `PIN_GPS_EN`) | duty-cycled | off between fixes | deep sleep (~10 µA for the ESP32) |

Below 5 % battery (when a cell is attached) the collar powers everything down and re-checks hourly.

## OTA updates

Slots: two 1.9 MB app partitions ([partitions.csv](partitions.csv)); a failed download never touches the running image.

1. Build: `pio run`, take `.pio/build/esp32dev/firmware.bin`, upload it somewhere HTTPS-reachable (Cloud Storage with a signed or public URL).
2. `sha256sum firmware.bin`
3. Set Firestore `firmware/esp32dev` = `{ version: "1.0.1", url: "https://…/firmware.bin", sha256: "<hex>", enabled: true }` and bump `FW_VERSION` in `platformio.ini` for that build.

Collars update on their next sync if battery ≥ 40 %, verify the SHA-256, then reboot. Set `otaDisabled: true` on a device to pin it.

## Known limits / next steps

- No cellular fallback; location only updates while a known Wi-Fi network is reachable.
- Rollback relies on the dual-slot layout; automatic rollback-on-boot-failure is not enabled in the Arduino core build.
- BLE pairing flow shown in the app's "Pair device" sheet is not implemented; pairing is by Device ID.
- Firestore `devices` rules are currently open (`allow read, write: if true`); tighten them before launch so only the owner can change `lostMode`, `trackingMode`, `ringRequestedAt`.
