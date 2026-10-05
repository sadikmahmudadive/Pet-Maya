# Pet Maya LoRa gateway

ESP32-WROOM-32 + Ai-Thinker Ra-02 (SX1278, 433 MHz) on Wi-Fi, powered from a USB adapter. It listens
continuously, forwards every Pet Maya tracker frame it hears to the cloud (`lora_ingest`) and transmits
the replies. It holds **no tracker keys**: it relays opaque encrypted bytes, so anyone can host one
safely, and every gateway serves every Pet Maya tracker in range.

## Wiring

Same Ra-02 wiring as the tracker: NSS→5, SCK→18, MISO→19, MOSI→23, RST→14, DIO0→26, 3V3, GND.
No GPS or battery is needed. A DevKit board is fine here because it is mains powered.

## Placement and antenna (this decides your coverage)

- Use the **best 433 MHz antenna you can**: an outdoor ground-plane or collinear antenna on the roof, on
  low-loss coax. Height matters more than transmit power.
- Indoors behind concrete you might cover a few hundred metres; on a rooftop, several kilometres.
- Put the gateway where pets go: home, a shelter, a vet clinic, a park kiosk. More gateways means
  fewer blind spots.

## Setup

```bash
pio run -t upload                                         # flash
export DEVICE_MASTER_SECRET=...
python ../tools/provision.py gateway GW-HOME-0001 --flash COM6
```

Then connect it to the internet: join Wi-Fi **`PetMaya-GW-XXXX`** (password = last 8 hex digits of the MAC,
printed at boot) and choose your network at `192.168.4.1`. You can also enter the Gateway ID and secret
there instead of using `--flash`. Serial console: `status`, `wifi <ssid> <pass>`, `factory-reset`, `reboot`.

LED: slow blink = no Wi-Fi; triple blink = Wi-Fi but the cloud is unreachable; short heartbeat = online;
flash = a packet was heard or sent.

## What it does

- **Core 1 (radio):** continuous receive. Uplinks are queued untouched. A downlink is transmitted in the
  tracker's 3 s receive window, either straight from the cloud's reply or from a cache filled by an
  earlier reply.
- **Core 0 (network):** batches up to 16 frames per signed HTTPS POST. Requests are signed with the
  gateway secret, and TLS is verified against the built-in CA bundle. It keeps up to 64 frames (1 hour)
  while the internet is down and sends a heartbeat every 60 s.
- **Monitoring:** Firestore `gateways/{id}` holds last seen, firmware, Wi-Fi RSSI and counters (frames
  received, bad CRC, foreign packets, downlinks sent, dropped). Gateways are marked offline after
  5 minutes of silence. Set `revoked: true` to block one.
- **OTA:** set `firmware/lora-gateway` = `{version, url, sha256, enabled: true}` and gateways update
  themselves. The image is SHA-256 checked and installed into a separate slot.

## Limits

- Single channel and single spreading factor. That is fine because every Pet Maya tracker uses the same
  profile, but it is not a general LoRaWAN gateway.
- Half-duplex: while it transmits a downlink (~185 ms) it can't hear other trackers.
- Wi-Fi only. For sites without Wi-Fi, an Ethernet (W5500) or cellular-backhaul variant would need a
  different network layer.
