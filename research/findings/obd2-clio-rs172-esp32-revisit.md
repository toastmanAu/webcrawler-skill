# Research: obd2-clio-rs172-esp32-revisit

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://www.cliosport.net/threads/obd2-diagnostic-on-172.html, https://raw.githubusercontent.com/P1kachu/talking-with-cars/master/README.md, https://raw.githubusercontent.com/merecarvill/OBD2-KLine-Reader/master/README.md, https://www.nxp.com/docs/en/data-sheet/L9637D.pdf, https://raw.githubusercontent.com/collin80/esp32_can/master/README.md, https://raw.githubusercontent.com/guilherme-gm/Renault-Clip-Decrypted/master/README.md

---

## Research Note: obd2-clio-rs172-esp32-revisit

**Date:** 2026-03-03

### Summary
The provided web content, primarily due to multiple HTTP 404 errors, offers very limited specific technical details for integrating an ESP32 with the Renault Clio RS 172's OBD2/K-Line. The successfully fetched content focuses exclusively on CAN bus communication and ESP32 CAN drivers, without mentioning the Clio RS 172, K-Line protocols, or the L9637D chip. Consequently, most of the research questions regarding the Clio RS 172's bus type, ECU, K-Line protocol specifics, and data read/write capabilities cannot be answered from the given sources.

### 1. Does the Renault Clio RS 172 use K-Line or CAN bus on OBD2? What ECU type (Bosch ME7.4.6?)?
The provided content does not specify whether the Renault Clio RS 172 uses K-Line or CAN bus on OBD2, nor does it identify the ECU type (e.g., Bosch ME7.4.6). The `P1kachu/talking-with-cars` repository discusses CAN bus but does not mention the Clio RS 172. The `https://www.cliosport.net/threads/obd2-diagnostic-on-172.html` link, which might have contained this information, returned a `FETCH ERROR: HTTP Error 404: Not Found`.

### 2. Can Renault Link v1.99 KKL protocol be replicated on ESP32 + L9637D? Baud rates, init sequence?
The provided content does not contain information on replicating the Renault Link v1.99 KKL protocol on an ESP32 with an L9637D. The datasheet for the L9637D (`https://www.nxp.com/docs/en/data-sheet/L9637D.pdf`) and the `https://raw.githubusercontent.com/merecarvill/OBD2-KLine-Reader/master/README.md` repository, which would be crucial for these details, both returned `FETCH ERROR: HTTP Error 404: Not Found`. Therefore, specific baud rates or initialization sequences for this protocol cannot be determined from the given sources.

### 3. What data can be READ via K-Line: live PIDs, fault codes, immobiliser status?
The provided content does not specify what data (live PIDs, fault codes, immobiliser status) can be READ via K-Line for the Renault Clio RS 172. The relevant sources for K-Line protocols and Renault-specific diagnostics (`https://raw.githubusercontent.com/merecarvill/OBD2-KLine-Reader/master/README.md` and `https://raw.githubusercontent.com/guilherme-gm/Renault-Clip-Decrypted/master/README.md`) were unavailable due to `FETCH ERROR: HTTP Error 404: Not Found`.

### 4. What can be WRITTEN: key programming, idle speed, ignition timing, throttle adaptation reset?
The provided content does not specify what data or functions (key programming, idle speed, ignition timing, throttle adaptation reset) can be WRITTEN via K-Line for the Renault Clio RS 172. The necessary documentation for K-Line write operations and Renault-specific commands (`https://raw.githubusercontent.com/merecarvill/OBD2-KLine-Reader/master/README.md` and `https://raw.githubusercontent.com/guilherme-gm/Renault-Clip-Decrypted/master/README.md`) was not accessible due to `FETCH ERROR: HTTP Error 404: Not Found`.

### Gaps / Follow-up
*   **Clio RS 172 OBD2 Bus Type and ECU:** The primary gap is determining if the Renault Clio RS 172 uses K-Line or CAN bus, and its specific ECU type. This information is fundamental for any integration project.
*   **K-Line Protocol Details:** Specifics of the KKL protocol, especially for Renault Link v1.99, including baud rates, initialization sequences, and message structures, are missing.
*   **L9637D Datasheet:** Access to the L9637D datasheet is critical for understanding how to interface with this chip for K-Line communication.
*   **Renault-Specific Diagnostic Commands:** Details on PIDs, fault code reading, immobiliser status, and write operations (key programming, idle speed, ignition timing, throttle adaptation reset) for the Clio RS 172 via K-Line are entirely absent.
*   **Working K-Line ESP32 Implementation:** A functional example or documentation for an ESP32 K-Line reader/writer would be highly beneficial.

### Relevant Code/API Snippets
The only relevant code snippets found pertain to ESP32 CAN bus drivers, not K-Line, and are not specific to the Renault Clio RS 172.

From `https://raw.githubusercontent.com/collin80/esp32_can/master/README.md`:
This library implements a CAN driver for the built-in CAN hardware on an ESP32. It requires the `can_common` library. For MCP2517FD support (if an external CAN controller is used), a separate library is needed:
```c++
#include <esp32_mcp2517fd.h> // Example include for MCP2517FD
```
The README states that "Primarily, one should check TX and RX pins if using a different board" when using this library for ESP32 CAN.