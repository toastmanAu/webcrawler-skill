# Research: fiberquest-embedded-node

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/en/get-started.md, https://batocera.org/os.php, https://raw.githubusercontent.com/libretro/Lakka-LibreELEC/master/README.md, https://retropie.org.uk/docs/Transferring-Roms/

---

Date: 2026-03-05

## Summary
Running a Fiber Network Node (FNN) on retro gaming hardware presents several challenges and opportunities. The FNN is a Rust-based peer-to-peer payment/swap network node, similar to Lightning Network, supporting multiple assets and low-cost micropayments. While it can be built and run on Linux-compatible ARM SBCs, specific resource requirements (RAM, CPU, storage) are not detailed in the provided documentation, making it difficult to assess headroom alongside RetroArch. Locked-down distributions like Lakka (and likely Batocera) pose significant hurdles for persisting arbitrary binaries and services across reboots due to their read-only filesystem nature. RetroPie, being based on Raspberry Pi OS, likely offers more flexibility for systemd service integration. A dedicated companion device running FNN on a general-purpose Linux OS appears to be a more straightforward approach given the current documentation.

## 1. Can a Fiber Network Node (FNN) run on ARM SBCs that also run RetroArch? Specifically: Raspberry Pi 4/5, Orange Pi 5, Odroid, Batocera/Lakka/RetroPie distros — do they have enough RAM/CPU headroom to run FNN alongside RetroArch? What are the resource requirements of FNN (RAM, CPU, storage for chain data)?

The provided `README.md` for Fiber Network Node (FNN) indicates that it is built using `cargo build --release`, which implies it is a Rust application. Rust applications can generally be compiled for and run on ARM-based Single Board Computers (SBCs) like Raspberry Pi 4/5, Orange Pi 5, and Odroid, provided they run a compatible Linux distribution.

However, the documentation **does not specify the resource requirements (RAM, CPU, storage for chain data)** for FNN. Without this information, it is impossible to definitively determine if these SBCs have "enough RAM/CPU headroom to run FNN alongside RetroArch."

The FNN does require a data folder (`/folder-to/my-fnn`) for its binary, configuration, wallet private key (`ckb/key`), and storage (`fiber/store`). The size of the `fiber/store` for chain data is not specified but is subject to migration and can be removed (`rm -rf /folder-to/my-fnn/fiber/store`) if channels are closed before upgrading.

## 2. CKB light client vs full node — which is feasible on these devices? Light client (ckb-light-client) is ~50MB RAM — is that viable alongside RetroArch? What's the sync time?

The provided content focuses exclusively on the Fiber Network Node (FNN) and does not contain information about a CKB light client (`ckb-light-client`) or a CKB full node. The FNN `README.md` mentions "UDT assets issued on CKB ledger" and uses `ckb-cli` for wallet key management, indicating interaction with the CKB blockchain, but it does not describe the CKB client itself.

Therefore, based on the provided content:
*   There is no information to assess the feasibility of a CKB full node on these devices.
*   The viability of a CKB light client with ~50MB RAM alongside RetroArch cannot be determined from the provided FNN documentation, as its own resource requirements are unknown.
*   The sync time for a CKB light client or full node is not mentioned.

## 3. Batocera/Lakka/RetroPie — can we install arbitrary binaries/services? Batocera uses a read-only squashfs overlay, Lakka similar. How do we persist a Fiber node service across reboots on these locked-down distros? Is there a user-data partition we can write to?

**Lakka:**
The `Lakka-LibreELEC/master/README.md` describes Lakka as a "lightweight Linux distribution" that is "easy to setup and use." It instructs users to "put your rom on the card, plug your joypad." While it doesn't explicitly state a read-only squashfs overlay, the description of a "lightweight" and "easy to setup" system often implies a locked-down environment where the root filesystem is read-only, and user-writable areas are limited (e.g., for ROMs and saves).

To install arbitrary binaries like FNN and persist a service across reboots on such a system, a user-writable partition is essential. The FNN installation steps involve:
```bash
mkdir /folder-to/my-fnn
cp target/release/fnn /folder-to/my-fnn
cp config/testnet/config.yml /folder-to/my-fnn
mkdir ckb
head -n 1 ./ckb/exported-key > ./ckb/key
```
These steps require write access to create directories and copy files. If the primary filesystem is read-only, these operations would fail unless performed on a designated user-data partition or an external storage device mounted with write permissions. The Lakka documentation does not explicitly mention such a user-data partition for arbitrary binary installation or service persistence.

**Batocera/RetroPie:**
The content for Batocera (`batocera.org/os.php`) resulted in a `FETCH ERROR: HTTP Error 404: Not Found`, so no information is available regarding its filesystem structure or ability to install arbitrary binaries/services.
The content for RetroPie (`retropie.org.uk/docs/Transferring-Roms/`) also resulted in a browser verification page, providing no relevant information.

Therefore, based on the provided content, it is **not possible to confirm** if Batocera or RetroPie allow installation and persistence of arbitrary binaries/services like FNN across reboots. For Lakka, it is **unlikely** to be straightforward due to its "lightweight" and potentially locked-down nature, without explicit documentation of a writable partition for such purposes.

## 4. RetroArch on RetroPie (Raspberry Pi OS based) — full OS access, systemd available — this is the most viable path. How hard is it to add a systemd service to RetroPie?

The provided content **does not include any information** about RetroPie, Raspberry Pi OS, or systemd. Therefore, it is not possible to answer how hard it would be to add a systemd service to RetroPie based on the given sources.

## 5. Alternatively: dedicated companion device — a small SBC (Pi Zero 2W, ESP32-S3) that runs only the Fiber node and communicates with the gaming machine over LAN/USB. What's the minimum viable hardware for a Fiber node?

The FNN is built using `cargo build --release`, implying it runs on a general-purpose operating system (like Linux) that supports Rust binaries.

*   **Raspberry Pi Zero 2W:** This is an ARM-based SBC capable of running a full Linux distribution (e.g., Raspberry Pi OS Lite). It would likely be a viable candidate for a dedicated companion device, assuming its CPU and RAM are sufficient for FNN (which, as noted, are not specified).
*   **ESP32-S3:** This is a microcontroller, not a general-purpose SBC. It typically runs FreeRTOS or bare-metal applications, not a full Linux environment required for standard Rust binaries compiled with `cargo build --release` without significant porting efforts. Therefore, an ESP32-S3 is **not suitable** for running FNN as described by the `README.md`.

The `README.md` **does not specify the minimum viable hardware** for a Fiber node. It only provides build instructions for a standard Linux-like environment.

## 6. What does the user setup flow look like — plug in device, scan QR code, channel funded, ready to play?

The provided FNN `README.md` describes the technical steps for building and running a testnet node, not a user-friendly setup flow for an end-user. The steps are:

1.  **Build the project:** `cargo build --release`
2.  **Create data folder and copy files:**
    ```bash
    mkdir /folder-to/my-fnn
    cp target/release/fnn /folder-to/my-fnn
    cp config/testnet/config.yml /folder-to/my-fnn
    cd /folder-to/my-fnn
    ```
3.  **Create or import private key:**
    ```bash
    mkdir ckb
    ckb-cli account export --lock-arg --extended-privkey-path ./ckb/exported-key
    head -n 1 ./ckb/exported-key > ./ckb/key
    rm ./ckb/exported-key
    ```
4.  **Start the node:**
    ```bash
    FIBER_SECRET_KEY_PASSWORD='YOUR_PASSWORD' RUST_LOG='info' ./fnn -c config.yml -d .
    ```
This process is highly technical and involves command-line operations, environment variables, and manual file management. It **does not resemble a simplified user setup flow** involving "plug in device, scan QR code, channel funded, ready to play." Such a flow would require additional layers of software, a user interface, and automation not described in the FNN `README.md`.

## Gaps / Follow-up
1.  **FNN Resource Requirements:** Crucially, the RAM, CPU, and typical storage footprint for FNN (especially for `fiber/store`) are not specified. This information is vital for assessing viability on resource-constrained SBCs and determining headroom alongside RetroArch.
2.  **CKB Light Client Details:** No information was provided on the `ckb-light-client` beyond its estimated RAM usage mentioned in the question. Details on its installation, sync time, and interaction with FNN would be beneficial.
3.  **Batocera/RetroPie Filesystem & Persistence:** The provided content did not include documentation for Batocera or RetroPie. Specifics on their filesystem structure (read-only vs. writable partitions), methods for installing arbitrary binaries, and options for persisting services (e.g., systemd integration) are needed.
4.  **RetroPie Systemd Integration:** Details on how to add and manage systemd services on RetroPie (or its underlying Raspberry Pi OS) are missing.
5.  **User Experience / Product Vision:** The current documentation focuses on the technical implementation of FNN. A higher-level document outlining the intended user setup flow ("plug in device, scan QR code, channel funded, ready to play") and any associated APIs or client applications would be valuable.
6.  **Web-browser friendly runtime:** The `TODO` list in the FNN `README.md` includes "[ ] Web-browser friendly runtime." This suggests future plans for easier client interaction, which could simplify the user setup flow.

## Relevant Code/API Snippets

**Building FNN:**
```bash
cargo build --release
```

**Setting up FNN data directory and copying files:**
```bash
mkdir /folder-to/my-fnn
cp target/release/fnn /folder-to/my-fnn
cp config/testnet/config.yml /folder-to/my-fnn
cd /folder-to/my-fnn
```

**Creating/Importing FNN wallet private key:**
```bash
mkdir ckb
ckb-cli account export --lock-arg --extended-privkey-path ./ckb/exported-key
head -n 1 ./ckb/exported-key > ./ckb/key
rm ./ckb/exported-key
```

**Starting FNN:**
```bash
FIBER_SECRET_KEY_PASSWORD='YOUR_PASSWORD' RUST_LOG='info' ./fnn -c config.yml -d .
```

**FNN Storage Migration (for upgrades):**
```bash
rm -rf /folder-to/my-fnn/fiber/store # Remove storage
fnn-migrate -p /folder-to/my-fnn/fiber/store # Migrate storage
```