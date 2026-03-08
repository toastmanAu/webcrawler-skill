# WyRelay — USB HID Keyboard Relay via Telegram

## Summary
Minimal ESP32-S3 USB HID keyboard relay. Connect it to any machine via USB — then type any text or key combo on that machine remotely through Telegram.

## What It Does
- Presents as a USB HID keyboard to the host machine
- Connects to Telegram bot on WiFi
- `/type <text>` — types the text on the host
- `/key <combo>` — sends key combos (ctrl+alt+t, ctrl+c, etc.)
- `/run <cmd>` — types command + Enter

## Design
Stripped-down WyTerminal — no display, no relay server, no SSH. Just pure HID keyboard control via Telegram. 

Use case: unlock a locked machine, type a command on a headless server, control a kiosk, automate keyboard input on any OS.

## Hardware
- Any ESP32-S3 board with USB
- Tested on LilyGO T-Display S3

## Key Findings
- ESP32-S3 Arduino core has TinyUSB HID class built in
- `USB.addDevice(&keyboard)` registers HID keyboard descriptor
- `keyboard.print()` / `keyboard.press()` / `keyboard.releaseAll()` for input
- No host driver install needed — HID keyboard is plug-and-play on all OSes
- WiFi + USB HID run simultaneously on ESP32-S3

## Repo
https://github.com/toastmanAu/WyRelay
