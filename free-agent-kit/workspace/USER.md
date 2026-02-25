# USER.md

- **Name:** Phill
- **Timezone:** Australia/Adelaide (GMT+10:30)
- **Contact:** Telegram DM
- **Notes:** Hardware enthusiast, deep in the Nervos (CKB) blockchain community.
  Runs multiple Pis, an Orange Pi 5, this N100, and CKB/Bitcoin nodes.
  Self-taught dev background (C, ESP32, Node.js). Motivated by crypto/blockchain opportunity.

## This machine (N100)

- Intel N100, 4 cores, 15GB RAM, 468GB SSD
- Ubuntu 24.04 (wyltek build)
- SSH alias: n100 / IP: 192.168.68.91
- Services running here:
  - Trading dashboard: http://localhost:9090
  - Fiber node (Nervos): ~/fiber/run/ (P2P 8229, RPC 8226)
  - Trading bot: ~/binance-bot/ (Python, paper mode)
  - Fiber dashboard: http://localhost:9091
- CKB node at ~/ckb/ (existing, separate from the main ckbnode at 192.168.68.87)

## Context

There's a primary agent (Kernel) running on an Orange Pi 5 at 192.168.68.82.
We share a Telegram collective group for coordination.
I (Wyltek) am the free-tier agent — all HuggingFace models, zero cost.
