# Research: fiberquest-console-hub-protocols

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/espressif/esp-idf/master/components/driver/spi/README.md, https://gbdev.io/pandocs/Serial_Data_Transfer_(Link_Cable).html, https://raw.githubusercontent.com/RetroPie/RetroPie-Setup/master/README.md, https://problemkaputt.de/fullsnes.htm, https://wiki.nesdev.org/w/index.php/Four_Score

---

## Research Note: fiberquest-console-hub-protocols

**Date:** 2026-03-05

### Summary
This research investigates the feasibility of an ESP32-S3 or ESP32-P4 emulating various classic console multiplayer connectivity protocols. The Game Boy Link Cable and NES Four Score/Satellite protocols are described in detail within the provided content, revealing synchronous serial communication methods. For these, ESP32's RMT peripheral or bit-banging, combined with 3.3V to 5V logic level shifting, appear suitable. However, detailed protocol specifications for SNES Multi-tap, Sega Genesis Team Player, N64 Joybus, and GBA Link Cable were not found in the provided sources, nor were specific existing ESP32 projects for these emulations. The core insight remains that native protocol emulation allows games to function without modification, abstracting the payment layer.

### Questions to Answer

#### (1) SNES Multi-tap / serial link — protocol, baud rate, signal levels, timing, what does the SNES expect to see on the serial pins? Is this SPI, UART, proprietary?
The provided content (`fullsnes.htm`) describes the SNES I/O map and registers for joypad input, specifically `4016h/Write - JOYWR` for strobing and `4016h/Read - JOYA`, `4017h/Read - JOYB`, and `4218h-421Fh` for reading joypad data (JOY1L-JOY4H). These registers indicate a parallel or multiplexed input scheme for controllers, where the console polls the controller states. The document does *not* describe a specific serial link protocol for a SNES Multi-tap, nor does it specify baud rates, signal levels, or timing for such a device. It implies standard controller polling, which a multi-tap would extend by multiplexing multiple controllers onto the existing controller port pins. Therefore, the detailed protocol for the SNES Multi-tap is not available in the provided content.

#### (2) Game Boy Link Cable — Serial Clock, Serial Data, clock speed, master/slave arbitration, how does the GB handle 2/4 player via Game Boy Printer adapter or 4-player adapter?
The Game Boy Link Cable uses a synchronous serial data transfer protocol, similar to SPI.
*   **Communication:** One byte at a time.
*   **Master/Slave Arbitration:** One Game Boy acts as the "master" by generating the clock signal internally (setting `SC` register Bit 0 to 1). The other Game Boy acts as the "slave" by receiving the external clock (setting `SC` register Bit 0 to 0).
    *   Master: Loads data byte into `FF01 (SB)`, sets `FF02 (SC)` to `$81` (Transfer requested, use internal clock). `SC` Bit 7 clears and a Serial interrupt occurs upon completion.
    *   Slave: Loads data byte into `FF01 (SB)`, sets `FF02 (SC)`'s Bit 7 to 1 (e.g., `$80`) to enable the serial port. A serial interrupt occurs and `SC` Bit 7 clears upon completion.
*   **Serial Data Transfer:** The `FF01 (SB)` register holds the outgoing byte. During transfer, the leftmost bit is shifted out, and the incoming bit is shifted in from the other side. After 8 shifts, the register contains the received byte.
*   **Clock Speed:**
    *   **Non-CGB Mode:** 8192 Hz (approx. 1 KB/s transfer speed).
    *   **CGB Mode (Normal Speed):**
        *   `SC` Bit 1 cleared: 8192 Hz (1 KB/s).
        *   `SC` Bit 1 set: 262144 Hz (32 KB/s).
    *   **CGB Mode (Double Speed):**
        *   `SC` Bit 1 cleared: 16384 Hz (2 KB/s).
        *   `SC` Bit 1 set: 524288 Hz (64 KB/s).
*   **External Clock:** Can be any speed, recognized up to 500 kHz by old/monochrome Game Boys. Clock pulses are not required to be regular.
*   **Synchronization:** The master Game Boy should introduce a small delay after each transfer to allow the slave to prepare. Alternatively, systems can switch master/slave roles for each byte.
*   **Disconnects:** On a disconnected link cable, the master will start to receive `$FF` bytes. If a disconnect occurs during transmission, the input will be pulled up to 1 over a 20µs period.
*   **4-Player Adapter:** The `gbdev.io/pandocs` document lists "20. 4-Player Adapter" under accessories but does not provide details on its protocol or how it handles 2/4 players.

#### (3) NES Four Score / Satellite — how does the NES 4-player adapter work at the electrical/protocol level?
The NES Four Score (and similar Hori 4 Players Adapter for Famicom) plugs into the console's controller ports and provides additional ports. It works by multiplexing controller inputs onto the standard controller data lines.
*   **Protocol Type:** Synchronous serial, using shift registers.
*   **Input ($4016 write):** Writing to `$4016` (specifically, setting Bit 0 to 0 then 1, a "strobe") resets the internal shift registers of all connected controllers simultaneously.
*   **Output ($4016/$4017 read):** After the strobe, the NES reads bits sequentially from `$4016` (D0 for Four Score, D1 for Hori) and `$4017` (D0 for Four Score, D1 for Hori). Each read shifts out the next bit of controller data.
*   **Report Structure (Four Score):**
    *   **$4016 D0:**
        *   Reads 0-7: Joypad D0 bits from controller #1.
        *   Reads 8-15: Joypad D0 bits from controller #3.
        *   Reads 16-18: Always 0.
        *   Read 19: Always 1.
        *   Reads 20-23: Always 0.
        *   Reads 24+: Always 1.
    *   **$4017 D0:**
        *   Reads 0-7: Joypad D0 bits from controller #2.
        *   Reads 8-15: Joypad D0 bits from controller #4.
        *   Reads 16-17: Always 0.
        *   Read 18: Always 1.
        *   Reads 19-23: Always 0.
        *   Reads 24+: Always 1.
*   **Turbo:** The Four Score has A and B turbo switches that apply universally to all controllers. They force the respective button bits to 0 at a fixed rate (approximately 2 frames) by ANDing with an alternating mask.
*   **Hardware:** Internally, the Four Score uses an FPA-S01 IC, which contains a decoder, shift registers, 5-bit counters, and multiplexers to handle the serial data stream from multiple controllers.
*   **NES Satellite:** Described as a 4-controller wireless adapter similar to the Four Score, with A and B turbo switches, but specific protocol details are not known from the provided content.

#### (4) Sega Genesis 6-button controller port / Team Player — EA 4-player adapter protocol, Genesis multitap, electrical spec (DE-9 connector pinout, voltage levels).
The provided source content does not contain any information regarding the Sega Genesis 6-button controller port, EA 4-player adapter protocol, Genesis multitap, or its electrical specifications (DE-9 connector pinout, voltage levels).

#### (5) N64 Joybus protocol — used for controllers, memory paks, Rumble Pak, Transfer Pak. Could an ESP32 emulate a Joybus device?
The provided source content does not contain any information regarding the N64 Joybus protocol. Therefore, it cannot be determined from this content whether an ESP32 could emulate a Joybus device.

#### (6) GBA Link Cable — what protocol? What chips? 115200 baud serial?
The provided source content (specifically `gbdev.io/pandocs`) details the Game Boy (DMG, CGB) link cable protocol. It does *not* contain information about the Game Boy Advance (GBA) Link Cable protocol, chips used, or specific baud rates like 115200 baud serial.

#### (7) For each: what GPIO/peripheral on ESP32-S3 or ESP32-P4 could implement it? SPI, I2S, UART, RMT, bit-banging? What voltage level shifting is needed (3.3V vs 5V)?
*   **Game Boy Link Cable:**
    *   **Protocol:** Synchronous serial, similar to SPI, but often uses a single bidirectional data line (SI/SO combined) and a clock line.
    *   **ESP32 Peripheral:**
        *   **RMT (Remote Control Peripheral):** Ideal for precise timing and bit-banging synchronous serial protocols, especially if a single bidirectional data line needs to be managed with precise timing for both input and output.
        *   **SPI Peripheral:** Could be used if the link cable is interpreted as separate MOSI/MISO lines, but the Game Boy's description of shifting bits in and out of a single register (`SB`) suggests a single data line. If separate lines, the SPI peripheral would be suitable.
        *   **GPIO Bit-banging:** A viable option for full control over timing and I/O direction, though more CPU-intensive.
    *   **Voltage Level Shifting:** Game Boy operates at 5V logic. ESP32-S3/P4 operate at 3.3V. **Bi-directional logic level shifting (e.g., using a TXS0108E or similar) is required** for the data and clock lines.
*   **NES Four Score / Satellite:**
    *   **Protocol:** Synchronous serial (shift register based) with a strobe and data lines. Requires precise timing for strobing and reading multiple bits sequentially.
    *   **ESP32 Peripheral:**
        *   **RMT (Remote Control Peripheral):** Highly suitable for generating the precise strobe pulse and then sampling the data line at specific intervals to emulate the NES's reading behavior. It can handle the timing requirements efficiently.
        *   **GPIO Bit-banging:** Possible, but requires careful timing in software and might be more susceptible to jitter than RMT.
    *   **Voltage Level Shifting:** NES controllers operate at 5V logic. ESP32-S3/P4 operate at 3.3V. **Bi-directional logic level shifting is required** for the strobe and data lines.

#### (8) Are there existing Arduino/ESP32 projects that have already done any of this? GitHub repos?
The provided content mentions RetroPie as a Raspberry Pi-based emulation platform, but it does not contain information about existing Arduino/ESP32 projects or GitHub repositories specifically implementing hardware emulation of these console multiplayer protocols.

#### (9) The prize insight: if our hub can speak native console protocols, games don't need to know about Fiber AT ALL — multiplayer just works as designed, and our hub invisibly handles the payment layer. This is extraordinary.
This statement highlights the core value proposition of the project: by emulating native console protocols, the Fiber hub can seamlessly integrate into existing multiplayer setups without requiring any game modifications. This allows the hub to transparently manage a payment layer while preserving the original multiplayer experience, which is indeed an extraordinary capability.

### Gaps / Follow-up
1.  **SNES Multi-tap / Serial Link Protocol:** Detailed specifications (baud rate, signal levels, timing, specific pins used for serial communication, if any) for the SNES Multi-tap itself are missing. Further research into SNES controller port multiplexing and multi-tap designs is needed.
2.  **Game Boy 4-Player Adapter Protocol:** While the Game Boy Link Cable protocol is well-documented, the specifics of how the official 4-player adapter works are not provided.
3.  **Sega Genesis 6-button controller port / Team Player:** Comprehensive details on the protocol, electrical specifications (DE-9 pinout, voltage levels), and how multi-taps like the Team Player function are entirely absent.
4.  **N64 Joybus Protocol:** No information is available regarding the N64 Joybus protocol, which is crucial for understanding controller, memory pak, and Rumble Pak communication.
5.  **GBA Link Cable Protocol:** The provided content focuses on the original Game Boy and Color Game Boy. Details for the Game Boy Advance link cable protocol (including its specific protocol type, chips, and common baud rates like 115200) are missing.
6.  **Existing ESP32 Projects:** A search for existing Arduino/ESP32 projects that have already implemented hardware emulation for any of these console protocols would be beneficial to leverage existing work and identify challenges.
7.  **ESP-IDF SPI Driver Details:** The `spi/README.md` link resulted in a 404 error, preventing access to specific ESP-IDF SPI driver documentation. While general peripheral knowledge allows for suggestions, specific API details would require consulting the official ESP-IDF documentation.

### Relevant Code/API Snippets
No direct code or API snippets for ESP32 or console protocols were found in the provided source content. The console protocols are described at a conceptual and register-level.