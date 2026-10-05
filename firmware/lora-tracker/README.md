# Pet Maya LoRa tracker

ESP32-WROOM-32 + u-blox NEO-6M + Ai-Thinker Ra-02 (SX1278, 433 MHz). No SIM and no Wi-Fi: the radios
used are GPS and LoRa only. See [../README.md](../README.md) for how the network works.

## Wiring

| Ra-02 | ESP32 |  | NEO-6M | ESP32 |
|---|---|---|---|---|
| 3.3V | 3V3 (≥ 150 mA spare for TX peaks) | | VCC | 3V3 (or the load switch output) |
| GND | GND | | GND | GND |
| NSS | GPIO5 | | TX | GPIO16 |
| SCK | GPIO18 | | RX | GPIO17 |
| MISO | GPIO19 | | | |
| MOSI | GPIO23 | | **Other** | |
| RESET | GPIO14 | | LiPo + (via 100k/100k divider) | GPIO34 |
| DIO0 | GPIO26 | | Buzzer (via NPN) | GPIO25 |
| | | | Status LED | GPIO2 (on-board) |

- **Never transmit without an antenna on the Ra-02**, or the PA can be damaged. Use a 433 MHz antenna.
  A ¼-wave wire (~17 cm) is fine for bench work; a tuned helical or flexible PCB antenna suits a collar.
- Keep the NEO-6M's backup cell or supercap (V_BAT). It gives 1–5 s hot starts instead of 30 s+ cold starts.
- Change any pin in [include/config.h](include/config.h).

## Behaviour

| Situation | What the tracker does |
|---|---|
| Normal (app: Real-Time / Balanced / Battery Saver) | Reports every 20 s / 5 min / 30 min. At ≥ 60 s it puts the GPS into backup mode and the ESP32 into deep sleep between reports. |
| Lost mode (from the app) | Reports at the fastest allowed rate (20 s, set by the duty-cycle limit); fast-blinking LED |
| Leaves the safe zone | Speeds up to 30 s **on its own**, without waiting for the cloud. The owner gets a push alert. |
| "Ring" pressed in the app | Buzzer sounds for 30 s on the next report (retried until acknowledged) |
| No gateway heard for 3 acknowledgement checks | "No link" LED pattern; keeps trying, with an ack request on every uplink |
| Battery ≤ 15 % / ≤ 5 % | Low-battery alert / shuts down and re-checks hourly to protect the cell |
| BOOT button | Press while sleeping = report now; hold 5 s at power-up = reset settings (keeps its identity) |

## Provisioning

```bash
export DEVICE_MASTER_SECRET=...                       # same as the Firebase secret
python ../tools/provision.py lora-node --random --flash COM5
```

Or type it into the serial monitor (115200): `provision <nodeIdHex8> <keyHex32>`. Other commands:
`status`, `send`, `factory-reset` (settings only), `erase-all` (factory use: also removes the key), `reboot`.
Re-provisioning a node id that was used before? Also delete `upCounter`/`downCounter` on its Firestore
document, otherwise the cloud rejects the restarted counters as replays. `--random` avoids this. The tracker appears as Firestore `devices/PML-<nodeId>`.

## Battery life — what actually matters

The firmware sleeps properly, but **an ESP32 DevKit board can't reach low sleep current.** Its USB-serial
chip and AMS1117 regulator draw several mA all the time. For the collar itself, use:

1. A **bare ESP32-WROOM-32 module on your own PCB** with a low-quiescent LDO (e.g. MCP1700 / HT7333 /
   RT9080, a few µA). The firmware is unchanged.
2. A **load switch on the GPS** (P-MOSFET or TPS22916 on `PIN_GPS_EN`). NEO-6M breakout boards keep
   drawing current through their LED and regulator even in backup mode.
3. Optional and highly recommended: an accelerometer (e.g. LIS3DH) to skip GPS fixes while the pet is
   resting. This is the single biggest battery gain left; it isn't implemented yet.

Rough estimate with 1 and 2 done, a 2-minute interval and a 1000 mAh cell: about 0.13 mAh per report
(GPS hot fix ~5 s, ESP32 awake ~8 s at 80 MHz, 185 ms TX, 3 s RX), so **roughly 9–10 days**, and
**weeks** in Battery Saver mode. These are estimates; measure your build with a power profiler.

## Build

```bash
pio run -e tracker            # production
pio run -e tracker-debug      # serial logs
pio run -e tracker-sx1279     # SX1279-based modules
pio test -e native            # wire-format tests
```
