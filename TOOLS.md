# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Ollama (Local Inference)
- N100 endpoint: http://192.168.68.91:11434
- Model: llama3.2:3b (CPU only, ~5-8 tok/s on N100)
- LAN accessible from all machines
- Use as fallback when HuggingFace is rate-limited

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## driveThree (192.168.68.88)
- Hostname: driveThree · user: phill · SSH alias: needs adding
- i7-14700K, 64GB RAM, RTX 3060 Ti (8GB VRAM), Ubuntu 22.04 x86_64
- Ollama installed: qwen2.5:14b loaded and working (~GPU inference)
- API: http://192.168.68.88:11434
- Auto-suspend disabled (GNOME + logind)
- No OpenClaw installed (inference node only for now)

## CKB Testnet Light Client (N100)
- Running at: http://192.168.68.91:9001
- Chain: testnet (genesis 0x10639e...)
- Binary: ~/ckb-light-testnet/ckb-light-client
- Start: bash ~/ckb-light-testnet/start.sh
- Stop: bash ~/ckb-light-testnet/stop.sh

## Tailscale Network
| Machine | LAN IP | Tailscale IP | Notes |
|---------|--------|-------------|-------|
| Pi 5 (Kernel) | 192.168.68.x | 100.115.197.42 | Primary agent |
| OPi5+ (Shannon) | 192.168.68.89 | 100.81.155.8 | Research crawler |
| ckbnode | 192.168.68.105 | 100.119.144.2 | CKB node (orangepi user) |
| btcnode | 192.168.68.106 | 100.96.111.54 | Bitcoin node (orangepi user) |
| fiberquest | 192.168.68.84 | 100.99.68.27 | Fiber testnet node (phill user) |

## NucBox K8 Plus (Ryzen — Primary Inference Node)
- Hostname: phill-NucBox-K8-Plus · IP: 192.168.68.79 · user: phill
- SSH: ssh phill@192.168.68.79 (NOPASSWD sudo)
- Ryzen 7 8845HS · Radeon 780M iGPU · 32GB RAM · always on
- Ollama: http://192.168.68.79:11434 (LAN accessible)
- Key models: minicpm-v (vision), qwen2.5:14b, deepseek-r1:14b, gemma3:12b, qwen2.5-coder:14b, llama3.1:8b
- OpenClaw provider: "ryzen" → imageModel = ryzen/minicpm-v:latest
- Auto-suspend permanently masked

## EliteDesk Build Box
- HP EliteDesk 800 G1 DM, i5-4670 @ 3.40GHz, 16GB RAM, 229GB NVMe (115GB free)
- Ubuntu 22.04 x86_64 (dual-boot Windows/Linux — keep in Linux for build tasks)
- SSH alias: `elitedesk` · IP: 192.168.68.97 · user: phill · passwordless ✅
- Role: dedicated build node — Docker, arm64 cross-compile, orangepi-build
- Ollama: phi3:mini (CPU-only) — build queries only (compile errors, CMake, linker issues)
- No OpenClaw installed
