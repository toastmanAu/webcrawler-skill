# Research: snes-controller-protocol-implementation-details

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://www.raphnet.net/electronique/snes_usb/snes_usb_en.php, https://www.retroleum.com/snes-controller-pinout, https://www.cs.columbia.edu/~sedwards/classes/2013/4840/reports/SNES.pdf, https://raw.githubusercontent.com/MickGyver/DaemonBite-Retro-Controllers-USB/master/SNEStoUSB/SNEStoUSB.ino

---

Date: 2026-03-05

## Research Note: SNES Controller Protocol Implementation Details

### Summary
The provided web content for researching SNES controller serial protocol implementation details was entirely inaccessible or irrelevant. All specified URLs either returned HTTP 404 errors or, in the case of `retroleum.com`, presented a domain-for-sale page without any technical information. Consequently, no precise technical specifications regarding timing, bit order, voltage levels, or button mapping for the SNES controller could be extracted from the given sources.

### 1. What are the precise timing requirements (in microseconds) for the Latch and Clock pulses?
The provided source content did not contain any information regarding the precise timing requirements for the Latch and Clock pulses of the SNES controller. All linked technical resources were inaccessible.

### 2. What is the exact bit order for the 16 data bits sent by the controller (e.g., MSB first, which button corresponds to which bit)?
The provided source content did not contain any information regarding the exact bit order for the 16 data bits sent by the SNES controller, nor did it specify which button corresponds to which bit. All linked technical resources were inaccessible.

### 3. What are the signal voltage levels (e.g., 5V, 3.3V) and are logic level shifters required for ESP32-P4 (3.3V)?
The provided source content did not contain any information regarding the signal voltage levels of the SNES controller or whether logic level shifters would be required for an ESP32-P4 (which operates at 3.3V). All linked technical resources were inaccessible.

### 4. What is the full button-to-bit mapping for a standard SNES controller?
The provided source content did not contain any information regarding the full button-to-bit mapping for a standard SNES controller. All linked technical resources were inaccessible.

### Gaps / Follow-up
Due to the complete inaccessibility of all provided technical source URLs, no information could be gathered for any of the research questions.
Follow-up actions required:
*   Identify and provide working, authoritative technical documentation or community resources detailing the SNES controller serial protocol.
*   Specifically, look for datasheets, reverse-engineering guides, or established open-source hardware projects that interface with SNES controllers.
*   Key information needed includes:
    *   Latch pulse duration and timing relative to clock.
    *   Clock pulse frequency/period and duty cycle.
    *   Data line sampling edge (rising or falling clock).
    *   Precise 16-bit data stream mapping to physical buttons (e.g., A, B, X, Y, Start, Select, D-Pad, L, R).
    *   Confirmation of 5V logic levels for SNES controllers and explicit recommendation for level shifting when interfacing with 3.3V microcontrollers like the ESP32-P4.

### Relevant Code/API Snippets
No relevant code or API snippets could be extracted from the provided source content as all technical links were inaccessible.