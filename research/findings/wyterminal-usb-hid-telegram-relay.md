# WyTerminal — USB HID + Telegram Linux Terminal Relay

## Summary
WyTerminal is an ESP32-S3 AMOLED device (LilyGO T-Display S3) that acts as a USB HID keyboard AND a Telegram-controlled Linux terminal relay. Plug it into any machine, control it from Telegram.

## Architecture

### v1/v2 — WiFi Relay
- Board polls Telegram via WiFi
- Flask relay (`wyrelay.py`) runs on Pi at fixed IP
- SSH hop from relay to any registered target
- All shell commands routed through Pi relay

### v3 — USB NCM Composite
- Board presents as USB HID keyboard + USB CDC-NCM ethernet adapter simultaneously
- `/deploy` command types `curl install.sh | bash` via HID → installs relay on target
- Relay runs on the target machine itself (192.168.7.1:7799)
- Board connects via USB ethernet — no WiFi needed for shell

## Commands
- `/shell <cmd>` — run command on target, output to Telegram
- `/screenshot` — capture screen, send to Telegram + show on AMOLED
- `/target user@host` — register + switch SSH target
- `/targets` — list saved targets
- `/pass <password>` — store SSH password for current target (verified immediately)
- `/key ctrl+alt+t` — send key combo via HID
- `/run <cmd>` — type command + Enter via HID
- `/type <text>` — type text via HID (no Enter)
- `/deploy` — install relay on target via HID
- `/status` — board status (relay, WiFi, uptime)

## Security
- `ALLOWED_CHAT_ID` — first check in message handler, silently drops all non-owner messages
- Bot token secret in `secrets.h` (gitignored)
- Relay listens on LAN only (not internet-exposed)

## Hardware
- Board: LilyGO T-Display S3 AMOLED (ESP32-S3, 1.91" RM67162 AMOLED, 240x536)
- USB: TinyUSB composite — HID keyboard + CDC-NCM ethernet
- Display: QSPI interface, 8-colour terminal UI

## Key Findings
- ESP32-S3 TinyUSB supports composite HID + CDC-NCM simultaneously
- `CFG_TUD_NCM=1` compiled into ESP32 Arduino core 3.x
- lwIP stack available as IDF component — full TCP/IP on-chip
- Minimal DHCP server (~50 lines) gives host 192.168.7.1 automatically
- gnome-screenshot with DBUS_SESSION_BUS_ADDRESS works for Wayland screenshot
- `sshpass` enables password SSH auth from relay without interactive prompt
- OOM killer on Pi: use 115200 baud for esptool flash (460800 OOM-killed)

## Repo
https://github.com/toastmanAu/WyTerminal
