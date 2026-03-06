# Research: esp32-p4-emulator-fiber-cpu-headroom-benchmarking

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** 

---

## Research Note: esp32-p4-emulator-fiber-cpu-headroom-benchmarking

**Date:** 2026-03-06

### Summary
The provided content outlines the objective of benchmarking the ESP32-P4's CPU and memory usage when concurrently running a RetroArch emulator, WiFi stack, and `secp256k1` signing operations for the FiberQuest project. While it confirms the successful implementation and negligible CPU impact of the `ckb-light-esp` client and the working status of `secp256k1` signing on the ESP32-P4, it explicitly states that the "CPU headroom for emulator (core 0) + light client + WiFi + signing (core 1)" is an "open FiberQuest question" and a "stretch goal." Consequently, specific benchmark data for the emulator's CPU utilization, WiFi overhead, `secp256k1` signing execution time, or the overall system's remaining CPU headroom under concurrent load is not present in the provided text.

### 1. What is the average CPU utilization of the emulator core(s) when running NES/SNES at target frame rates?
The provided content does not contain specific benchmark data regarding the average CPU utilization of the emulator core(s) when running NES/SNES at target frame rates on the ESP32-P4. It identifies running an emulator (RetroArch) on the ESP32-P4 as a "stretch goal" for the FiberQuest project and notes that "CPU headroom for emulator (core 0)" is an "open FiberQuest question."

### 2. What is the CPU overhead of the WiFi stack during active network communication (e.g., UDP polling, sending signed messages)?
The provided content does not specify the CPU overhead of the WiFi stack during active network communication on the ESP32-P4. While "WiFi" is listed as a component in the "open FiberQuest question" regarding CPU headroom, and "UDP RAM polling (READ_CORE_MEMORY, port 55355)" is mentioned as part of the FiberQuest setup, no quantitative data on its CPU impact is available. The `ckb-light-esp` project, which runs on the ESP32-P4, utilizes a "W5500 SPI Ethernet" for network connectivity, not WiFi, so its performance metrics are not directly applicable to WiFi overhead.

### 3. What is the execution time and CPU impact of a `secp256k1` signing operation on the ESP32-P4?
The provided content explicitly states that "`secp256k1` signing confirmed working (used in DOB minting flow)" on the ESP32-P4. However, it does not provide any specific execution time or CPU impact figures for a `secp256k1` signing operation. The "open FiberQuest question" includes "signing (core 1)" as a component requiring CPU headroom, indicating that its performance under concurrent load is yet to be fully characterized.

### 4. What is the remaining CPU headroom for other tasks, and are there any observed performance degradation or stuttering when all components run concurrently?
The provided content explicitly states that the "CPU headroom for emulator (core 0) + light client + WiFi + signing (core 1)" is an "open FiberQuest question" and a "stretch goal" for the ESP32-P4. Therefore, there is no information available in the provided text regarding the remaining CPU headroom or any observed performance degradation or stuttering when all these components run concurrently. While the `ckb-light-esp` client shows "live tracking 0.08-0.40ms CPU — negligible" when running in isolation, this does not account for the combined load with the emulator, WiFi, and signing operations.

### Gaps / Follow-up
The primary gap in the provided content is the absence of actual benchmark data for the concurrent operation of the RetroArch emulator, WiFi stack, and `secp256k1` signing on the ESP32-P4. The content clearly identifies this as an "open question" and a "stretch goal" for the FiberQuest project.

Follow-up actions would involve:
*   Conducting the actual benchmarking as outlined in the "Goal" section of the research topic.
*   Measuring CPU utilization of the emulator core(s) with NES/SNES games at target frame rates.
*   Measuring CPU overhead of the WiFi stack during active data transfer (e.g., UDP polling, sending signed messages).
*   Measuring the execution time and CPU impact of `secp256k1` signing operations.
*   Observing and quantifying performance degradation or stuttering when all components run simultaneously on the ESP32-P4.
*   Analyzing memory usage for each component and the total system to ensure it fits within the 768KB SRAM + PSRAM.

### Relevant Code/API Snippets
While no direct benchmark results are provided, the content refers to the following relevant components and their confirmed status:
*   **`ckb-light-esp`**: "Full CKB light client protocol stack running on ESP32 (C/ESP-IDF)" with "Performance: boot sync 10k headers in 0.8s (P4), live tracking 0.08-0.40ms CPU — negligible". This confirms the light client's individual performance on P4.
*   **`secp256k1` signing**: "confirmed working (used in DOB minting flow)" on ESP32-P4. This confirms the capability, though not its performance metrics.
*   **RetroArch (emulator)**: Mentioned as the target emulator for the FiberQuest project, intended to run on "core 0" of the ESP32-P4.
*   **UDP RAM polling**: "READ_CORE_MEMORY, port 55355" is the mechanism for the emulator to communicate with the Node.js sidecar, implying active network usage.
*   **ESP32-P4 hardware**: "dual-core 400MHz RISC-V, 768KB SRAM + PSRAM support, MIPI DSI, USB Host, WiFi". This outlines the available resources.