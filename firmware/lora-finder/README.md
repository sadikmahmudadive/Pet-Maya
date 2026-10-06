# Pet Maya LoRa Finder (offline)

A small receiver you carry: **ESP32-WROOM-32 + Ai-Thinker Ra-02 (SX1278, 433 MHz)**. It hears your
trackers directly over LoRa and shows them in the Pet Maya app over **Bluetooth**. It needs **no gateway,
no SIM and no internet**.

```
🐕 Tracker ──LoRa (one broadcast)──┬──▶ 🖐️ Finder ──BLE──▶ 📱 App: map, distance, direction, Ring, Search
                                   └──▶ 🏠 Gateway (if any in range) ──▶ ☁️ cloud as usual
```

Trackers don't need any change: every LoRa packet is a broadcast, so gateways and finders can hear the
same report at the same time.

## Hardware

Same Ra-02 wiring as the tracker and gateway: NSS→5, SCK→18, MISO→19, MOSI→23, RST→14, DIO0→26, 3V3,
GND, **plus a 433 MHz antenna before powering it**. Optional: a buzzer on GPIO25 (chirps when it hears
your pet while no phone is connected). Power it from a power bank or a LiPo with a charger board.

## Setup

1. Open `firmware/lora-finder` in VS Code and click **Upload**.
2. The Serial Monitor shows its Bluetooth name and **6-digit pairing passkey**:
   `Pet Maya LoRa Finder fw 1.0.0 — BLE 'PetMaya-Finder-1A2B', pairing passkey 482913`.
   Write the passkey on the case: the phone asks for it the first time.
3. In the app go to **My Devices → 📡 (LoRa Finder) → Scan → tap your finder** and enter the passkey.
4. Tap **Pair my LoRa trackers**. This step **needs internet once**: the app fetches your own trackers'
   keys from the cloud (`get_tracker_key`, owner-only) and stores them in the finder. The finder holds
   up to 8 trackers.
5. From now on it works **offline**. Open the screen and wait for the next report.

## What the app shows and does

- **Map** with your pets and your own position. Tiles need internet or an area cached earlier.
- **Distance and direction** from your phone's GPS (e.g. *"850 m, North-East"*). This works with no
  internet at all.
- **Ring:** the collar buzzes for 30 s.
- **Search 30 min:** the collar reports as fast as allowed (about every 20 s) for 30 minutes.
- Last heard, GPS fix age, battery, signal, and lost-mode / outside-safe-zone / searching / ringing badges.

Commands reach the collar **right after its next report**, because that's when it listens (3 s window).
In normal mode that can take up to its reporting interval; once search mode is on, ~20 s. The finder
keeps re-sending until the collar confirms (up to 6 reports), and the app shows *queued → sent →
delivered*.

## Security

- The finder only decrypts trackers whose keys you paired. Anyone else's trackers are ignored.
- Commands are encrypted, authenticated frames using the tracker's own key and replay-protected counter,
  the same protection as cloud downlinks. Nobody else can ring or track your pet.
- Bluetooth needs a **bonded, passkey-authenticated (LE Secure Connections)** link before the app can
  read positions or send commands.

## Serial console (115200)

`status` · `add PML-XXXXXXXX <keyHex32> [name]` · `remove PML-XXXXXXXX` · `erase-all` · `reboot`

For bench tests without the app: `python ../tools/provision.py lora-node --node-id XXXXXXXX` prints a
tracker's key, which you can then `add` here.

## Range

The same physics as gateways, but the finder is at hand height: expect a few hundred metres in a city
and 1–3 km in open country. Walk towards the arrow and keep the antenna vertical. Higher ground helps a lot.
