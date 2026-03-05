# Research: snes9x-fork-architecture-extensibility

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/snes9xgit/snes9x/master/LICENSE, https://raw.githubusercontent.com/snes9xgit/snes9x/master/README.md, https://raw.githubusercontent.com/snes9xgit/snes9x/master/snes9x.cpp, https://raw.githubusercontent.com/snes9xgit/snes9x/master/port.h, https://raw.githubusercontent.com/snes9xgit/snes9x/master/apu/apu.cpp

---

## Research Note: snes9x-fork-architecture-extensibility

**Date:** 2026-03-05

### Summary
Snes9x appears to be a viable fork base for FiberQuest, offering a portable C/C++ codebase. Its license explicitly permits non-commercial use, but commercial applications require permission, which is a critical consideration for FiberQuest's micropayment model. The emulator provides explicit save/load state functions and a sound callback (`S9xSetSamplesAvailableCallback`) that can likely be leveraged for frame-complete events. Display output is handled via pixel buffers (`PIXEL_FORMAT`), suggesting a direct approach for compositing. Input can be configured via `S9xSetController`. However, the provided content does not detail an internal plugin API, the specific build system (beyond CI status), or an existing official ESP32 port.

### (1) What is the license?
Snes9x is licensed under the "Snes9x License," which grants permission to use, copy, modify, and distribute the software in both binary and source form **for non-commercial purposes** without fee. It explicitly states: "Snes9x is freeware for PERSONAL USE only. Commercial users should seek permission of the copyright holders first. Commercial use includes, but is not limited to, charging money for Snes9x or software derived from Snes9x, including Snes9x or derivatives in commercial game bundles, and/or using Snes9x as a promotion for your commercial product."

**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/LICENSE`

### (2) Where does the main emulation loop live — what callback/hook points exist for frame-complete, memory-write events, save-state?

*   **Main Emulation Loop:** The provided content does not explicitly show the main emulation loop function (e.g., `main_loop()` or `run_frame()`). However, `snes9x.cpp` handles argument parsing and configuration loading, suggesting it's part of the main application entry point. The `apu/apu.cpp` file contains core sound processing and synchronization logic, implying its functions are called repeatedly within the emulation cycle.

*   **Frame-Complete Events:**
    *   The `S9xSetSamplesAvailableCallback` function in `apu/apu.cpp` allows setting a callback that is invoked when samples are available, which is typically synchronized with video frames.
        ```cpp
        void S9xSetSamplesAvailableCallback(apu_callback callback, void *data) {
            spc::callback = callback;
            spc::callback_data = data;
        }
        ```
    *   The `S9xLandSamples()` function, also in `apu/apu.cpp`, is called when sound samples are processed and potentially signals a frame boundary, especially when `Settings.SoundSync` is enabled.
        ```cpp
        void S9xLandSamples(void) {
            if (spc::callback != NULL)
                spc::callback(spc::callback_data);
            // ... sound_in_sync logic ...
        }
        ```

*   **Memory-Write Events:** The provided content does not explicitly detail callback or hook points for arbitrary memory-write events. However, the `S9xAPULoadBlarggState` function in `apu/apu.cpp` shows direct memory access and copying to `SNES::smp.apuram`, indicating that memory manipulation is central to the emulator's operation. A fork would likely need to modify the memory access routines directly to implement such hooks.

*   **Save-State:** Explicit functions for saving and loading APU state exist:
    *   `S9xAPUSaveState(uint8 *block)`: Saves the APU state to a provided memory block.
    *   `S9xAPULoadState(uint8 *block)`: Loads the APU state from a provided memory block.
    These functions handle the state of the SNES's Audio Processing Unit (APU), including SMP and DSP.
    ```cpp
    void S9xAPUSaveState(uint8 *block) { /* ... */ }
    void S9xAPULoadState(uint8 *block) { /* ... */ }
    ```

**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/apu/apu.cpp`

### (3) Is there an existing plugin or extension API?
The provided content does not explicitly mention an internal plugin or extension API for Snes9x. The `README.md` does refer to a "libretro core," which is a port of Snes9x to the Libretro API, allowing it to function as a core within a Libretro frontend (like RetroArch). This is an external API that Snes9x *implements*, not an internal plugin system for Snes9x itself.

**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/README.md`

### (4) How is display output handled — can we inject a compositing layer?
Display output is handled at a low level using pixel formats. `port.h` defines `PIXEL_FORMAT` as `RGB565` by default, or `RGB555` for macOS. This implies the emulator renders to a raw pixel buffer.
```c
#ifndef PIXEL_FORMAT
#define PIXEL_FORMAT RGB565
#endif
```
The `snes9x.cpp` file includes `display.h` and uses `S9xMessage` for displaying information, and `port.h` defines `S9xDisplayString DisplayStringFromBottom`. Injecting a compositing layer would likely involve intercepting the emulator's output pixel buffer before it is sent to the final display device, allowing for modification or overlaying of additional graphics. This would require direct modification of the rendering pipeline within a fork.

**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/port.h`, `https://raw.githubusercontent.com/snes9xgit/snes9x/master/snes9x.cpp`

### (5) How is input handled — can we intercept/redirect?
Input handling is configurable via command-line arguments and internal functions. The `snes9x.cpp` file contains `parse_controller_spec` and `S9xSetController` functions, which allow specifying the type of controller (e.g., `pad`, `mouse`, `superscope`, `justifier`, `mp5`, `macsrifle`) for each port.
```cpp
static bool parse_controller_spec (int port, const char *arg) { /* ... */ }
// ...
S9xSetController(port, CTL_NONE, 0, 0, 0, 0); // Example usage
```
The `-port#` command-line option allows users to specify which controller to emulate. This suggests that input can be intercepted or redirected by modifying how `S9xSetController` maps physical inputs to emulated SNES inputs, or by introducing a custom controller type that reads input from a different source (e.g., network, custom hardware).

**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/snes9x.cpp`

### (6) What is the build system (cmake, autoconf)?
The provided `README.md` mentions "Nightly builds from continuous integration" for various operating systems (Windows, Linux, macOS, FreeBSD) and for the Libretro core. However, it does not explicitly state the underlying build system (e.g., CMake, Autoconf, Makefiles).

**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/README.md`

### (7) Is there an ESP32 port already (Snes9x-ESP32)?
The provided Snes9x content (README.md, port.h) does not mention an official Snes9x port specifically for ESP32 hardware. The `README.md` lists various `libretro core` targets, including `Linux/armhf`, `Linux/armv7-neon-hf`, `Linux/arm64`, `Android/arm`, `Android/arm64`, `Nintendo Wii`, `Nintendo Switch`, `Nintendo GameCube`, and `PSP`, but ESP32 is not among them. `port.h` defines macros for `__arm__` and `__aarch64__` but not for ESP32 or RISC-V architectures.

**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/README.md`, `https://raw.githubusercontent.com/snes9xgit/snes9x/master/port.h`

### Gaps / Follow-up
1.  **Commercial Use License:** FiberQuest's micropayment model could be interpreted as commercial use. Clarification or permission from Snes9x copyright holders is essential before proceeding with a fork.
2.  **Main Emulation Loop:** The exact location and structure of the main emulation loop (where frames are processed, CPU/PPU/APU cycles are advanced) is not explicitly detailed in the provided snippets. This is crucial for understanding where to inject custom logic for game events.
3.  **Memory-Write Hooks:** While memory access is evident, explicit callback mechanisms for memory-write events (e.g., to detect changes in game state variables like health or score) are not present. This would likely require direct modification of the emulator's memory management unit (MMU) or CPU emulation core.
4.  **Build System:** Identifying the specific build system (e.g., CMake, Autoconf, Makefiles) is necessary for setting up a development environment and integrating custom code.
5.  **ESP32-P4 Porting Effort:** Given no existing official ESP32 port, a significant effort would be required to port Snes9x to the ESP32-P4, including adapting its rendering, input, and sound output to ESP-IDF and the P4's specific hardware capabilities. This would involve configuring the build system for the Xtensa/RISC-V architecture and potentially optimizing for the P4's dual-core setup.

### Relevant Code/API Snippets

**License Excerpt:**
```
Permission to use, copy, modify and/or distribute Snes9x in both binary and source form, for non-commercial purposes, is hereby granted without fee, providing that this license information and copyright notice appear with all copies and any derived work.
...
Snes9x is freeware for PERSONAL USE only. Commercial users should seek permission of the copyright holders first.
```
**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/LICENSE`

**Sound/Frame Callback:**
```cpp
// From apu/apu.cpp
void S9xSetSamplesAvailableCallback(apu_callback callback, void *data) {
    spc::callback = callback;
    spc::callback_data = data;
}

void S9xLandSamples(void) {
    if (spc::callback != NULL)
        spc::callback(spc::callback_data);
    // ...
}
```
**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/apu/apu.cpp`

**Save State Functions (APU):**
```cpp
// From apu/apu.cpp
void S9xAPUSaveState(uint8 *block) { /* ... */ }
void S9xAPULoadState(uint8 *block) { /* ... */ }
```
**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/apu/apu.cpp`

**Display Pixel Format:**
```c
// From port.h
#ifndef PIXEL_FORMAT
#define PIXEL_FORMAT RGB565
#endif
```
**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/port.h`

**Input Configuration:**
```cpp
// From snes9x.cpp
static bool parse_controller_spec (int port, const char *arg) {
    if (!strcasecmp(arg, "none")) S9xSetController(port, CTL_NONE, 0, 0, 0, 0);
    else if (!strncasecmp(arg, "pad", 3) && arg[3] >= '1' && arg[3] <= '8') S9xSetController(port, CTL_JOYPAD, arg[3] - '1', 0, 0, 0);
    // ... other controller types
    return (true);
}
```
**Source:** `https://raw.githubusercontent.com/snes9xgit/snes9x/master/snes9x.cpp`