# Research: handheld-gaming-rk3566-deep-dive

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/christianhaitian/ArkOS/master/README.md, https://raw.githubusercontent.com/JustEnoughLinuxOS/distribution/main/README.md, https://wiki.batocera.org/hardware_compatibility, https://raw.githubusercontent.com/AmberELEC/AmberELEC/main/README.md, https://wiki.batocera.org/supported_games_controllers

---

## Research Note: handheld-gaming-rk3566-deep-dive

**Date:** 2026-03-03

### Summary
This research aims to identify the best RK3566 handheld gaming OS for running CKB/Fiber nodes concurrently with an emulator frontend. Based on the provided content, Batocera emerges as the most suitable option. It explicitly supports a package manager (Pacman) for installing arbitrary Linux applications, provides a mechanism for managing custom services ("Batocera Services"), and features "Overlays" for persistent system modifications. Other distributions like ArkOS lack sufficient detail in the provided documentation to assess their capabilities for this specific use case, and information for AmberELEC was unavailable.

### 1. Which RK3566 gaming distros support systemd services + arbitrary Linux apps alongside the frontend?
Based on the provided content, **Batocera** is the only distribution that explicitly indicates support for both arbitrary Linux applications and a service management mechanism.

*   **Arbitrary Linux Apps:** The Batocera wiki mentions "Pacman (package manager)" under the "Advanced Users" section, and further details "Create your own pacman package" under "Development". This strongly suggests the ability to install and manage arbitrary Linux applications, including a CKB/Fiber node. The presence of "SSH/Xterm and commands" also implies a full Linux environment accessible for custom installations.
*   **Systemd Services (or equivalent):** The Batocera wiki lists "Batocera Services" under "Scripting". While it does not explicitly name "systemd," the term "services" in a modern Linux context implies a system for managing background processes, which is essential for a persistent CKB node.
*   **ArkOS:** The provided `README.md` for ArkOS states it is "Another rockchip Operating System" but does not offer details regarding support for arbitrary Linux applications or service management.
*   **JELOS:** Described as an "immutable Linux distribution," which often complicates the installation of arbitrary applications directly into the root filesystem. However, JELOS is End of Life, and the content does not detail its service management capabilities.
*   **RockNix, AmberELEC, Lakka:** No relevant content was provided for RockNix or Lakka. The `README.md` for AmberELEC resulted in a "FETCH ERROR: HTTP Error 404: Not Found".

### 2. Anbernic RG-ARC-D: Android or Linux distro? Root/ADB situation?
The provided source content **does not contain any information** about the "Anbernic RG-ARC-D" device, nor does it discuss Android, root access, or ADB for any device.

### 3. Does Batocera on RK3566 have pacman or equivalent package manager accessible?
Yes, the Batocera wiki explicitly states the presence of "Pacman (package manager)" under the "Advanced Users" section. It also mentions the ability to "Create your own pacman package" under "Development". While RK3566 is not specifically mentioned in conjunction with Pacman, Batocera is listed as an alternative for "ARM based devices" (which includes RK3566), and Pacman is a core feature of the distribution.

### 4. Best approach for persistent CKB node service that survives frontend restarts?
Based on the provided content, the best approach would be to use **Batocera**.

1.  **Install CKB Node:** Utilize Batocera's "Pacman (package manager)" to install the CKB node. This could involve creating a custom Pacman package for the CKB node or installing its binaries directly into a persistent location.
2.  **Define as a Service:** Leverage "Batocera Services" (found under "Scripting" in the wiki) to define the CKB node as a background service. This would involve creating a script that starts, stops, and manages the CKB node process, ensuring it runs independently of the frontend (EmulationStation) and can survive frontend restarts.
3.  **Ensure Persistence:** Batocera's "Overlays (modify the live system)" feature would be crucial for ensuring that the installed CKB node binaries, configuration, and service definitions persist across reboots and system updates. Additionally, "Editing the boot partition" and "SSH/Xterm and commands" provide avenues for configuring the system for persistence.

This combination of features in Batocera (Pacman, Batocera Services, Overlays) provides the necessary tools for running a persistent CKB node service alongside the emulator frontend.

### Gaps / Follow-up
*   **Batocera Systemd Confirmation:** Explicit confirmation that "Batocera Services" is implemented using `systemd` or details on the specific init system used would be beneficial.
*   **Batocera Overlay Mechanics:** More detailed documentation on how "Overlays (modify the live system)" works in practice for custom package installations and service definitions would be valuable.
*   **RK3566 Specifics:** While Batocera supports ARM, explicit confirmation of RK3566 support for advanced features like Pacman and overlays would be ideal.
*   **ArkOS Capabilities:** Research into ArkOS's capabilities regarding arbitrary Linux apps, service management, and persistence would be needed to compare it effectively with Batocera.
*   **Anbernic RG-ARC-D:** Information regarding the default OS (Android/Linux), root access, and ADB for the Anbernic RG-ARC-D is entirely missing and requires external research.
*   **Other Distros:** Information on RockNix, Lakka, and a working link for AmberELEC would be needed for a comprehensive comparison.

### Relevant Code/API Snippets
The provided content is primarily descriptive text from READMEs and wikis, not direct code or API snippets. However, the following concepts are directly relevant to the questions:

*   **`Pacman (package manager)`**: Refers to the Arch Linux package manager, indicating its availability for installing software.
*   **`Batocera Services`**: Denotes a system within Batocera for managing background services, likely involving shell scripts or configuration files.
*   **`Overlays (modify the live system)`**: Describes a filesystem mechanism used in live Linux distributions to enable persistent changes to the root filesystem.
*   **`SSH/Xterm and commands`**: Implies command-line access for system administration and scripting.
*   **`Create your own pacman package`**: Suggests the ability to package custom software for installation via Pacman.