# Research: gameboy-hardware-wallet

**Date:** 2026-03-04  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/batocera-linux/batocera.linux/master/README.md, https://wiki.batocera.org/add_games_bios, https://raw.githubusercontent.com/libretro/RetroArch/master/README.md, https://raw.githubusercontent.com/RetroAchievements/RAIntegration/master/README.md, https://raw.githubusercontent.com/toastmanAu/CKB-ESP32/main/README.md

---

## Research Note: gameboy-hardware-wallet Feasibility

**Date:** 2026-03-04

**Summary:**
Batocera Linux provides an open-source retro-gaming distribution built on a Linux base, utilizing EmulationStation as a frontend and RetroArch for running emulators via libretro cores. Custom applications could potentially be integrated as libretro cores or standalone scripts launched from EmulationStation. The CKB-ESP32 project demonstrates a full CKB light client and signer in C/C++, which could theoretically be adapted to the libretro API. Key storage on Batocera would likely involve the `SHARE` partition on the SD card, requiring careful consideration of encryption and failure modes. While RetroAchievements offers an existing integration model, its technical hooks are not detailed in the provided content. Specific hardware comparisons for budget handhelds regarding Linux access, RAM, or secure elements are not available in the provided sources.

---

### 1. What is the Batocera architecture — EmulationStation frontend, retroarch cores, Linux processes? How do custom apps get added as "games" in the UI?

*   **Batocera Architecture:**
    *   Batocera Linux is an "open-source and completely free retro-gaming distribution" that turns a computer/nano computer into a gaming console.
    *   It supports "many emulators and game engines" out of the box.
    *   The `README.md` indicates it uses `buildroot` to create compiled images and organizes its components in a `package` directory for "emulator data, config generators, core packages, system utilities, etc."
    *   `RetroArch/README.md` states that RetroArch is the "reference frontend for the libretro API." Libretro cores are "dynamic libraries" that implement this API, typically for "video game system emulators and game engines as well as more generalized 3D programs."
    *   EmulationStation is described as "the main menu" in the Batocera Wiki.

*   **How custom apps get added as "games" in the UI:**
    *   Batocera will only show systems for which ROMs are installed. To update the game list, users press `[START]` and go to `GAME SETTINGS → UPDATE GAMELISTS`.
    *   Users can add their own ROMs and BIOS files to the `userdata` partition (labelled as `SHARE`). This can be done by:
        *   Using the built-in file manager (`[F1]` on PC/RPi4/Retroid Pocket 5/Mini).
        *   Using the controller-friendly `OD-Commander` in the `Ports` system.
        *   Transferring data via a network share (`\\BATOCERA\share` or `smb://BATOCERA.local/share`).
    *   The wiki mentions "Ports system" which suggests a category for non-emulator applications.
    *   It's also possible to run scripts by installing them to a folder in Batocera's network share and running commands via SSH (e.g., for `andrebrait's 1g1r-romset-generator`).
    *   **Inference:** A custom app could potentially be added as a "game" by placing its executable (or a script that launches it) into a designated system folder (e.g., "Ports") within the `SHARE` partition, and then updating the game lists in EmulationStation. If it's a libretro core, it would be placed in the appropriate core directory and associated with a dummy ROM file.

### 2. Can a custom binary/script run as a retroarch core? What's the libretro core API — could a CKB light client + signer implement it?

*   **Can a custom binary/script run as a retroarch core?**
    *   `RetroArch/README.md` states that libretro cores are "dynamic libraries" that implement the libretro API. These cores are typically "video game system emulators and game engines as well as more generalized 3D programs." This implies that a custom binary, if compiled as a dynamic library and adhering to the libretro API, could function as a core. A simple script cannot directly be a core, but a core could potentially launch a script.

*   **What's the libretro core API?**
    *   The `RetroArch/README.md` explicitly links to the "libretro API header" at `https://github.com/libretro/RetroArch/blob/master/libretro-common/include/libretro.h`.
    *   It describes libretro as an "API that exposes generic audio/video/input callbacks."
    *   A frontend (like RetroArch) "handles video output, audio output, input and application lifecycle."
    *   Cores are written in "portable C or C++" and can run seamlessly on many platforms.

*   **Could a CKB light client + signer implement it?**
    *   **Feasibility:** Yes, it is theoretically possible. The `CKB-ESP32` project demonstrates a CKB client and signer written in pure C/C++ (`CKB.h/CKB.cpp`, `CKBSigner.h/.cpp`, `ckb_molecule.h`, `ckb_blake2b.h`).
    *   The core functionality (querying, building, signing, broadcasting) is self-contained.
    *   To implement the libretro API, the CKB client would need to:
        1.  Be compiled as a dynamic library.
        2.  Implement the required `libretro.h` functions for initialization, deinitialization, video output (to display wallet UI), audio output (for notifications, if desired), and input handling (for navigation and transaction confirmation).
        3.  The CKB client's network operations would run within this core.
    *   The `CKB-ESP32` project's `CKB_PROFILE_SIGNER` or `CKB_PROFILE_FULL` would be relevant, as they include the necessary modules for sending transactions.

### 3. What's the button combo interception pattern in Batocera/EmulationStation? How have others added secret modes or overlays?

*   **Button combo interception pattern in Batocera/EmulationStation:**
    *   The Batocera Wiki mentions "Hotkey shortcuts" as a feature.
    *   Under "Advanced Users" -> "Development", it lists "Evmapy (keyboard shortcuts)" and "Evsieve (input manipulator)". These tools suggest that Batocera provides mechanisms for intercepting and mapping input events, which would be crucial for custom button combos.

*   **How have others added secret modes or overlays?**
    *   **Overlays:** The Batocera Wiki has a section titled "Overlays (modify the live system)". This indicates a built-in mechanism for overlays. Additionally, "Shader sets and their customization" and "Decorations (and The Bezel Project)" are mentioned, which relate to visual enhancements that could include overlay-like elements.
    *   **Secret Modes:** The wiki mentions "Kiosk and kid UI mode," which are alternative UI modes. While not explicitly "secret," this shows that different operational modes for the UI are supported. The provided content does not detail how "secret modes" are specifically implemented or triggered by button combos, but the existence of input manipulators (`Evmapy`, `Evsieve`) and UI modes suggests the underlying capability.

### 4. Micro SD key storage: what's the right approach — encrypted private key file, hardware-backed keystore, or just raw key? What are the failure modes (corruption, accidental eject)?

*   **Key storage approach:**
    *   The `CKB-ESP32` README states: "NOTE: load credentials from NVS in production — see Key Security section." NVS (Non-Volatile Storage) is specific to ESP32.
    *   For Batocera (a Linux distribution), the primary storage is the Micro SD card. The `SHARE` partition is where user data (ROMs, saves, configurations) is stored.
    *   The provided content **does not specify** the right approach for storing sensitive keys on Batocera's Micro SD card (e.g., encrypted private key file, hardware-backed keystore). It also does not mention the presence of hardware secure elements or TPM chips on the target retro handhelds.
    *   **Inference:** Without hardware-backed security, an encrypted private key file stored on the `SHARE` partition would be the most secure software-based approach, requiring a passphrase from the user. Storing a raw key is highly insecure.

*   **Failure modes (corruption, accidental eject):**
    *   **Corruption:** The Batocera Wiki describes the `SHARE` partition as separate from the `boot` partition. SD cards are susceptible to corruption, especially if power is lost during write operations or due to wear. The content does not explicitly discuss corruption in the context of key storage, but it's a general risk for any data on an SD card.
    *   **Accidental Eject:** The content does not explicitly discuss accidental eject of the Micro SD card as a failure mode for key storage. However, physical removal of the storage medium would make the keys inaccessible and could lead to data corruption if ejected during a write operation.

### 5. What existing projects combine retro gaming hardware with crypto/blockchain (seed phrase entry on gameboy, trezor gameboy case mods, etc)?

*   The provided content **does not contain any information** about existing projects that combine retro gaming hardware with crypto/blockchain, such as seed phrase entry on Game Boys or Trezor Game Boy case mods.
*   The `CKB-ESP32` project is a crypto project on embedded hardware (ESP32), but it is not described as being integrated with retro gaming hardware or software.

### 6. RetroAchievements integration: how does it work technically? Can we use the same hooks for CKB events instead of game achievements?

*   **RetroAchievements integration:**
    *   `RAIntegration/README.md` describes `RAIntegration` as "The DLL used for interfacing with RetroAchievements.org."
    *   It lists prerequisites for building the DLL, including "Visual Studio 2022 Community Edition" and "MSVC v142/v143 C++ build tools," indicating a Windows-centric development environment for the DLL itself.
    *   The Batocera Wiki mentions "RetroAchievements" as a feature, implying Batocera supports it.
    *   The provided content **does not detail the technical hooks or API** that emulators/libretro cores use to interface with the `RAIntegration` DLL or report achievement events. It only describes the DLL's purpose and build requirements.

*   **Can we use the same hooks for CKB events instead of game achievements?**
    *   Given that the technical details of the RetroAchievements hooks are not provided, it is **not possible to determine from the given content** if the same hooks could be repurposed for CKB events.
    *   **Inference:** If the hooks are generic event-reporting mechanisms, it might be possible. However, if they are highly specialized for game state and achievement logic, it would be difficult. A custom libretro core for the CKB wallet would likely implement its own display and input logic rather than relying on achievement hooks for core functionality.

### 7. What display/UX would the wallet screen look like in a Batocera ROM slot — full screen app, retroarch overlay, or EmulationStation scraper art?

*   **Full screen app:** If the CKB light client is implemented as a libretro core, it would likely take over the full screen, similar to how an emulator or game engine core does. RetroArch supports various "menu drivers" (XMB, rgui, glui, ozone) which are full-screen UIs. The `RetroArch/README.md` mentions a "gamepad-centric and touchscreen UI," which aligns with a full-screen application on a handheld.

*   **RetroArch overlay:** The Batocera Wiki mentions "Overlays (modify the live system)" and RetroArch supports "multi-pass shader support." This suggests that a wallet UI could potentially be rendered as an overlay on top of a running game or the RetroArch menu, though a full-screen application might offer a more dedicated and secure user experience for a wallet.

*   **EmulationStation scraper art:** EmulationStation scraper art is used for displaying metadata (box art, screenshots) for games in the menu. It is a static display element and **not suitable for an interactive wallet screen**. The wallet needs to be an active application.

*   **Conclusion:** A full-screen application implemented as a libretro core within RetroArch is the most plausible and robust display/UX approach for a CKB wallet in a Batocera ROM slot.

### 8. R36S vs other budget handhelds (RG35XX, Miyoo Mini, Powkiddy RGB30, Anbernic RG28XX, TrimUI Smart Pro) — which have the best Linux access, fastest boot, most RAM for running a light client alongside games? Focus on devices under $60 AUD. Are there any with hardware secure elements or TPM chips?

*   The provided content **does not contain any information** comparing specific budget handheld devices like R36S, RG35XX, Miyoo Mini, Powkiddy RGB30, Anbernic RG28XX, or TrimUI Smart Pro regarding:
    *   Best Linux access.
    *   Fastest boot times.
    *   Most RAM for running a light client alongside games.
    *   Presence of hardware secure elements or TPM chips.
*   The Batocera Wiki's "Supported Devices" section includes "Choose a handheld" and "Choose a single board computer" but does not offer the detailed comparison requested for these specific models or their hardware security features.

---

### Gaps / Follow-up

1.  **Libretro Core API Details:** The provided `libretro.h` link is crucial. A deeper dive into the actual API functions (e.g., `retro_init`, `retro_load_game`, `retro_run`, `retro_video_refresh`, `retro_input_poll`, `retro_input_state`) is needed to precisely map the CKB client's display, input, and networking requirements to the libretro interface.
2.  **Batocera Custom App Integration:** While adding to "Ports" is inferred, explicit documentation or examples of creating a *new system* or a *standalone application* that integrates seamlessly into EmulationStation's UI (beyond just launching a script) would be beneficial.
3.  **Key Storage Best Practices on Linux (Batocera):** Research into standard Linux practices for secure key storage on embedded systems, including encryption methods (e.g., LUKS, `gpg`), passphrase management, and potential integration with ephemeral storage or secure boot features (if available on the target hardware).
4.  **RetroAchievements Technical Hooks:** To assess the reusability of RetroAchievements hooks, detailed documentation on the API used by emulators/cores to report achievement events is required.
5.  **Budget Handheld Hardware Specifications:** Comprehensive research on the specific hardware (CPU, RAM, storage, presence of secure elements/TPM) of the listed budget handhelds (R36S, RG35XX, Miyoo Mini, etc.) is needed to determine the best candidate for performance and security.
6.  **Batocera Input System Customization:** More details on `Evmapy` and `Evsieve` would be helpful to understand how to implement custom button combo interception for a "secret mode."

---

### Relevant Code/API Snippets

*   **Libretro API Header:**
    `https://github.com/libretro/RetroArch/blob/master/libretro-common/include/libretro.h` (cited as the definition of the libretro API).

*   **CKB-ESP32 Profile Selection for Signer:**
    ```cpp
    #define CKB_PROFILE_SIGNER // pick one before the include
    #include "CKB.h"
    #include "CKBSigner.h"
    ```
    (Indicates the necessary includes and preprocessor definition for CKB transaction signing functionality).

*   **CKB-ESP32 Light Client Enablement:**
    ```cpp
    #define CKB_PROFILE_MINIMAL
    #define CKB_NODE_LIGHT // enables light client API
    #include "CKB.h"
    ```
    (Shows how to enable the light client API for reduced bandwidth).

*   **CKB-ESP32 Transaction Sending (One-shot):**
    ```cpp
    CKBError err = ckb.sendTransaction(
        "ckb1q...", // recipient address
        100.0f, // amount in CKB
        key, // key — from address derived automatically
        txHash // optional: output buffer for tx hash
    );
    ```
    (Demonstrates the high-level API for building, signing, and broadcasting a transaction).

*   **Batocera Network Share Access:**
    `\\BATOCERA\share` (Windows/MacOS)
    `smb://BATOCERA.local/share` (Linux)
    (Method for accessing the `SHARE` partition to add files, including potentially custom apps or key files).