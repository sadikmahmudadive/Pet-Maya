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

--flash sends `provision ...` over serial (115200) to a connected, unprovisioned device.
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


def flash(port: str, command: str) -> None:
    try:
        import serial  # pip install pyserial
    except ImportError:
        sys.exit("pip install pyserial to use --flash")
    with serial.Serial(port, 115200, timeout=3) as s:
        time.sleep(0.5)
        s.reset_input_buffer()
        s.write((command + "\n").encode())
        deadline = time.time() + 5
        while time.time() < deadline:
            line = s.readline().decode(errors="replace").strip()
            if line.startswith(("OK", "ERR")):
                print("Device replied:", line)
                return
        print("No confirmation from the device — check the port and that it is in provisioning mode.")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="kind", required=True)

    w = sub.add_parser("wifi-collar", help="Wi-Fi collar (firmware/wifi-collar)")
    w.add_argument("device_id")
    w.add_argument("--flash", metavar="PORT")

    n = sub.add_parser("lora-node", help="LoRa tracker (firmware/lora-tracker)")
    g = n.add_mutually_exclusive_group(required=True)
    g.add_argument("--node-id", help="8 hex digits, e.g. 0A1B2C3D")
    g.add_argument("--random", action="store_true", help="pick a random node id")
    n.add_argument("--flash", metavar="PORT")

    gw = sub.add_parser("gateway", help="LoRa gateway (firmware/lora-gateway)")
    gw.add_argument("gateway_id")
    gw.add_argument("--flash", metavar="PORT")

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
        flash(args.flash, command)
    return 0


if __name__ == "__main__":
    sys.exit(main())
