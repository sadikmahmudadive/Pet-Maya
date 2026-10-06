#!/usr/bin/env python3
"""Pet Maya factory provisioning tool.

Every credential is derived from DEVICE_MASTER_SECRET (the same Firebase secret the
Cloud Functions use), so nothing per-device has to be stored server-side:

  wifi-collar  secret = HMAC-SHA256(master, deviceId)                       (hex)
  lora-node    key    = HMAC-SHA256(master, "pm-lora:" + "PML-XXXXXXXX")[:16] (AES-128)
  gateway      secret = HMAC-SHA256(master, "gw:" + gatewayId)              (hex)

Usage:
  export DEVICE_MASTER_SECRET=...
  python provision.py lora-node --random --flash COM5
  python provision.py lora-node --node-id 0A1B2C3D
  python provision.py gateway GW-DHAKA-0001 --flash COM6
  python provision.py wifi-collar PM-A1B2C3D4 --flash COM7

--flash checks which firmware the board runs (refuses a mismatch or an already-provisioned
board unless --force), then sends `provision ...` over serial (115200).
Close any Serial Monitor first: only one program can use a COM port.
Keep DEVICE_MASTER_SECRET out of git and off shared machines.
"""
import argparse
import hashlib
import hmac
import os
import re
import secrets
import sys
import time

ID_RE = re.compile(r"[A-Za-z0-9_-]{6,40}")


def hmac_sha256(master: str, msg: str) -> bytes:
    return hmac.new(master.encode(), msg.encode(), hashlib.sha256).digest()


FIRMWARE_FOR = {"wifi-collar": "wifi-collar", "lora-node": "lora-tracker", "gateway": "lora-gateway"}


def list_ports() -> str:
    from serial.tools import list_ports as lp
    ports = [f"  {p.device:8} {p.description}" for p in lp.comports()]
    return "\n".join(ports) if ports else "  (no serial ports found — is the board plugged in?)"


def open_port(port: str):
    try:
        import serial  # pip install pyserial
    except ImportError:
        sys.exit("pip install pyserial to use --flash")
    s = serial.Serial()
    s.port, s.baudrate, s.timeout = port, 115200, 0.5
    s.dtr = s.rts = False  # don't pulse EN/IO0: avoids resetting the ESP32 on open
    try:
        s.open()
    except serial.SerialException as e:
        msg = str(e)
        if "Access is denied" in msg or "PermissionError" in msg or "busy" in msg.lower():
            sys.exit(f"{port} is in use by another program. Close the PlatformIO/Arduino Serial Monitor "
                     f"(or any other terminal on {port}) and run this again.")
        sys.exit(f"Could not open {port}: {msg}\nAvailable ports:\n{list_ports()}")
    time.sleep(2.0)  # in case the board reset anyway, let it finish booting
    s.reset_input_buffer()
    return s


def detect_firmware(s) -> tuple:
    """Ask the board for `status` and work out which Pet Maya firmware it runs."""
    s.write(b"status\n")
    deadline = time.time() + 4
    while time.time() < deadline:
        line = s.readline().decode(errors="replace").strip()
        if not line.startswith("fw="):
            continue
        if "device=PML-" in line:
            return "lora-tracker", line
        if "rxOk=" in line:
            return "lora-gateway", line
        if " id=" in line:
            return "wifi-collar", line
    return None, ""


def flash(port: str, kind: str, command: str, force: bool) -> None:
    with open_port(port) as s:
        found, status = detect_firmware(s)
        expected = FIRMWARE_FOR[kind]
        if found is None:
            sys.exit(f"No answer from {port}. Check that the {expected} firmware is uploaded and the board is "
                     f"running (a provisioned tracker may be asleep: press BOOT once, then retry).")
        print(f"Board on {port} runs: {found}\n  {status}")
        if found != expected and not force:
            sys.exit(f"Refusing: `{kind}` credentials belong on a {expected} board, but {port} runs {found}. "
                     f"Plug in the right board (or open firmware/{expected} and Upload first).")
        if "provisioned=1" in status and not force:
            sys.exit("This board is already provisioned. Re-run with --force to overwrite its identity.")
        s.write((command + "\n").encode())
        deadline = time.time() + 5
        while time.time() < deadline:
            line = s.readline().decode(errors="replace").strip()
            if line.startswith(("OK", "ERR")):
                print("Device replied:", line)
                return
        print("No confirmation from the device. Open the Serial Monitor and run `status` to check.")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="kind", required=True)

    w = sub.add_parser("wifi-collar", help="Wi-Fi collar (firmware/wifi-collar)")
    w.add_argument("device_id")
    w.add_argument("--flash", metavar="PORT")
    w.add_argument("--force", action="store_true", help="skip the firmware/already-provisioned checks")

    n = sub.add_parser("lora-node", help="LoRa tracker (firmware/lora-tracker)")
    g = n.add_mutually_exclusive_group(required=True)
    g.add_argument("--node-id", help="8 hex digits, e.g. 0A1B2C3D")
    g.add_argument("--random", action="store_true", help="pick a random node id")
    n.add_argument("--flash", metavar="PORT")
    n.add_argument("--force", action="store_true", help="skip the firmware/already-provisioned checks")

    gw = sub.add_parser("gateway", help="LoRa gateway (firmware/lora-gateway)")
    gw.add_argument("gateway_id")
    gw.add_argument("--flash", metavar="PORT")
    gw.add_argument("--force", action="store_true", help="skip the firmware/already-provisioned checks")

    args = ap.parse_args()
    master = os.environ.get("DEVICE_MASTER_SECRET")
    if not master:
        sys.exit("Set DEVICE_MASTER_SECRET in the environment.")

    if args.kind == "wifi-collar":
        if not ID_RE.fullmatch(args.device_id):
            sys.exit("device_id must be 6-40 chars of [A-Za-z0-9_-]")
        secret = hmac_sha256(master, args.device_id).hex()
        print(f"Device ID : {args.device_id}\nSecret    : {secret}")
        command = f"provision {args.device_id} {secret}"

    elif args.kind == "lora-node":
        node_hex = secrets.token_hex(4).upper() if args.random else args.node_id.upper()
        if not re.fullmatch(r"[0-9A-F]{8}", node_hex) or node_hex == "00000000":
            sys.exit("node id must be 8 hex digits (not all zero)")
        device_id = f"PML-{node_hex}"
        key = hmac_sha256(master, f"pm-lora:{device_id}")[:16].hex()
        print(f"Node ID   : {node_hex}\nDevice ID : {device_id}   (Firestore devices/{device_id})\nKey       : {key}")
        command = f"provision {node_hex} {key}"

    else:
        if not ID_RE.fullmatch(args.gateway_id):
            sys.exit("gateway_id must be 6-40 chars of [A-Za-z0-9_-]")
        secret = hmac_sha256(master, f"gw:{args.gateway_id}").hex()
        print(f"Gateway ID: {args.gateway_id}\nSecret    : {secret}")
        command = f"provision {args.gateway_id} {secret}"

    if args.flash:
        flash(args.flash, args.kind, command, args.force)
    return 0


if __name__ == "__main__":
    sys.exit(main())
