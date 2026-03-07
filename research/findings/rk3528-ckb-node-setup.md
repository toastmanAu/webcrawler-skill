# Research: rk3528-ckb-node-setup

**Date:** 2026-03-07  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb/develop/README.md, https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/get-ckb.md, https://docs-old.nervos.org/docs/basics/guides/run-ckb-with-docker, https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md

---

Date: 2026-03-07

## Research Note: rk3528-ckb-node-setup

### Summary
This research outlines the procedure for setting up a CKB full node on RK3528 Armbian, focusing on binary availability, data directory configuration, systemd service, RPC exposure, and storage management. Based on the provided content, specific `aarch64` binary releases, detailed RAM requirements for CKB and Fiber nodes, systemd configurations, and pruning options are not explicitly documented. However, the content confirms that CKB full nodes and Fiber nodes can co-exist on the same machine, as demonstrated by Wyltek's `ckbnode` infrastructure. The CKB Docker guide provides insight into data directory mounting, which can be adapted for external storage.

### Questions to Answer

1.  **What aarch64 CKB binary is available — does nervosnetwork/ckb publish arm64 releases?**
    The provided content does not explicitly state whether `nervosnetwork/ckb` publishes `aarch64` (arm64) specific binary releases. The `nervosnetwork/ckb` `README.md` refers to "[latest release](https://github.com/nervosnetwork/ckb/releases/latest)" and "[How to Download or Build CKB Binary](https://docs.nervos.org/docs/basics/guides/get-ckb)". The latter link resulted in a `FETCH ERROR: HTTP Error 404: Not Found`. While Docker images (`nervos/ckb:latest`) are mentioned, their underlying architecture support for `aarch64` is not specified in the provided text. Therefore, it cannot be confirmed from the provided content if `aarch64` binaries are directly available for download.

2.  **How do you configure CKB data directory to point at an external USB SSD on Linux?**
    The provided content does not explicitly detail how to configure the CKB data directory for a bare-metal Linux installation to point to an external USB SSD. The `nervosnetwork/ckb` `README.md` links to a "[Configure CKB](docs/configure.md)" document, which was not provided.
    However, the Docker guide (`docs-old.nervos.org/docs/basics/guides/run-ckb-with-docker`) shows the use of a volume mount for the data directory:
    ```bash
    docker run --rm -it \
      -v ckb-mainnet:/var/lib/ckb \
      nervos/ckb:latest init --chain mainnet --force
    ```
    This implies that `/var/lib/ckb` is the default data directory within the Docker container. For a bare-metal Linux installation, CKB typically uses a default data directory (e.g., `~/.ckb` or `./data`) which can usually be overridden via a command-line flag (e.g., `--data-dir`) or a configuration file setting. Without the `docs/configure.md` content, the exact flag or config parameter for a bare-metal setup is not available. To use an external USB SSD, one would typically mount the SSD to a specific path (e.g., `/mnt/ckb_data`) and then configure CKB to use that path for its data directory.

3.  **What are the RAM requirements for CKB full node at current chain height — is 4GB sufficient?**
    The provided content does not specify the RAM requirements for a CKB full node at the current chain height. Therefore, it cannot be determined from the provided information if 4GB of RAM is sufficient.

4.  **Can CKB full node + Fiber node run simultaneously on 4GB RAM / RK3528?**
    The provided content does not specify the RAM requirements for either a CKB full node or a Fiber node. Therefore, it cannot be definitively determined from the provided information if both can run simultaneously on 4GB RAM on an RK3528.
    However, the "Our Infrastructure" section states:
    - "ckbnode (192.168.68.87): CKB mainnet full node + Fiber node (funded, running)"
    - "N100 (192.168.68.91): CKB + testnet light clients, Fiber node (needs funding)"
    This confirms that Wyltek Industries already runs CKB full nodes and Fiber nodes simultaneously on existing infrastructure, indicating technical feasibility. The specific RAM usage for these setups is not provided, so the question regarding 4GB RAM on RK3528 remains unanswered based on the provided text.

5.  **What systemd service config is recommended for CKB on Armbian?**
    The provided content does not include any recommended `systemd` service configuration for running CKB on Armbian or any other Linux distribution.

6.  **How to expose CKB RPC only to LAN (not public) for the signing remote to consume?**
    The provided content does not explicitly detail the configuration parameter within CKB to expose its RPC interface only to the LAN. The `nervosnetwork/ckb` `README.md` links to a "[Configure CKB](docs/configure.md)" document, which was not provided.
    Typically, RPC services are configured via a `listen_address` or similar parameter in their configuration file. To expose only to LAN, this parameter would be set to the specific IP address of the RK3528 on the local network (e.g., `192.168.68.X:8114` if 8114 is the RPC port) rather than `0.0.0.0` (all interfaces) or `127.0.0.1` (localhost only). Without the `docs/configure.md` content, the exact configuration key is unknown.

7.  **Pruning/storage options — can we limit chain storage growth on a budget SSD?**
    The provided content does not mention any pruning or storage limiting options for the CKB full node. Therefore, it cannot be determined from the provided information if chain storage growth can be limited on a budget SSD using CKB's native features.

### Gaps / Follow-up
1.  **`aarch64` Binary Availability:** Explicit confirmation from `nervosnetwork/ckb` releases page or documentation regarding official `aarch64` binary builds.
2.  **CKB Configuration Documentation:** Access to `nervosnetwork/ckb/docs/configure.md` is crucial for understanding data directory configuration, RPC binding, and other node settings.
3.  **RAM Requirements:** Official or community-sourced documentation on CKB full node and Fiber node RAM requirements for various chain heights and operational modes.
4.  **Systemd Service Example:** A recommended `systemd` unit file for CKB node operation on Linux.
5.  **Pruning/Storage Management:** Information on CKB's capabilities for limiting chain data size, such as pruning old blocks or states, to manage storage on budget SSDs.

### Relevant Code/API Snippets
*   **CKB Docker Data Volume Mount (Illustrative of data directory concept):**
    ```bash
    docker run --rm -it \
      -v ckb-mainnet:/var/lib/ckb \
      nervos/ckb:latest init --chain mainnet --force
    ```
    This snippet from `docs-old.nervos.org/docs/basics/guides/run-ckb-with-docker` shows `/var/lib/ckb` as the data directory within the container, which would be mapped to a host path for external storage.

*   **Fiber Node Startup (Illustrative of data directory and environment variables):**
    ```bash
    FIBER_SECRET_KEY_PASSWORD='YOUR_PASSWORD' RUST_LOG='info' ./fnn -c config.yml -d .
    ```
    This snippet from `nervosnetwork/fiber/main/README.md` shows the Fiber node binary (`fnn`) being started with a configuration file (`-c config.yml`) and a data directory (`-d .`). This indicates that the Fiber node's data directory can be specified.