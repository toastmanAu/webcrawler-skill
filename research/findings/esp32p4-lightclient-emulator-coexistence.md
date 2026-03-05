# Research: esp32p4-lightclient-emulator-coexistence

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/src/LightClient.cpp, https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/src/LightClient.h, https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/src/core/header_chain.cpp, https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/src/core/block_filter.cpp, https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/src/core/header_chain.h, https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/platformio.ini

---

Date: 2026-03-05

## Summary

This research focuses on the feasibility of concurrently running the `ckb-light-esp` CKB light client and a NES/SNES emulator on an ESP32-P4, specifically targeting an architecture where the emulator runs on Core 0 and the light client, WiFi stack, and `secp256k1` signing operate on Core 1. While the `ckb-light-esp` client is confirmed to run efficiently on the ESP32-P4 with negligible CPU load (0.08-0.40ms), the provided content does not offer specific details on WiFi interrupt load, precise peak heap consumption (due to unspecified configuration constants), or FreeRTOS task priority levels. The ability to safely trigger `secp256k1` signing without emulator frame drops, while a ~1ms operation, cannot be fully validated from the given information regarding FreeRTOS scheduling and shared resource contention.

## Questions to Answer

### 1. What is the interrupt load of the WiFi stack on core 1 and does it interfere with emulator timing on core 0?

The provided content explicitly states the intention to run the light client, WiFi, and `secp256k1` signing on Core 1, with the emulator on Core 0, as part of the "ESP32-P4 stretch goal" for FiberQuest. The `ckb-light-esp` project uses `WiFiTransport` as indicated by `#ifdef LIGHT_TRANSPORT_WIFI` in `LightClient.h` and the `platformio.ini` configuration for `esp32p4-full`.

However, the provided source content (including `LightClient.cpp`, `LightClient.h`, `header_chain.cpp`, `block_filter.cpp`, and `platformio.ini`) does not contain specific data or analysis regarding the interrupt load of the WiFi stack on Core 1, nor does it discuss its potential interference with emulator timing on Core 0. The performance metric "live tracking 0.08-0.40ms CPU — negligible" refers to the `ckb-light-esp`'s processing time, not the underlying WiFi stack's interrupt load.

### 2. How much heap does ckb-light-esp consume at peak (header chain + filter state)?

The `ckb-light-esp` client uses several data structures that contribute to heap consumption, primarily within the `LightClient`, `HeaderChain`, and `BlockFilter` classes.

*   **`LightClient`**: Contains a `char _jsonBuf[LIGHT_JSON_BUFFER_SIZE];` for JSON responses.
*   **`HeaderChain`**: Stores `_cache[LIGHT_HEADER_CACHE_SIZE]` which is an array of `CKBHeader` structs. Each `CKBHeader` is approximately 97 bytes (4 bytes `compact_target`, 8 bytes `number`, 4 bytes `timestamp`, 32 bytes `hash`, 32 bytes `parent_hash`, 16 bytes `nonce`, 1 byte `verified`).
*   **`BlockFilter`**: Stores `_scriptHashes[LIGHT_MAX_WATCHED_SCRIPTS][32]`, `_scriptStartBlock[LIGHT_MAX_WATCHED_SCRIPTS]`, `_matchQueue[LIGHT_FILTER_MATCH_QUEUE_SIZE]`, and `_eventQueue[LIGHT_FILTER_EVENT_QUEUE_SIZE]`. Each `FilterEvent` in `_eventQueue` is approximately 75 bytes (67 bytes `txHash`, 8 bytes `blockNumber`).

The `platformio.ini` for `env:esp32p4-full` includes `-DBOARD_HAS_PSRAM` and `-DCONFIG_SPIRAM_SUPPORT=1`, indicating that PSRAM is available and utilized, which would significantly expand the available heap.

However, the specific values for the configuration constants (`LIGHT_JSON_BUFFER_SIZE`, `LIGHT_HEADER_CACHE_SIZE`, `LIGHT_MAX_WATCHED_SCRIPTS`, `LIGHT_FILTER_MATCH_QUEUE_SIZE`, `LIGHT_FILTER_EVENT_QUEUE_SIZE`) are not provided in the source content. Without these values, the exact peak heap consumption cannot be calculated. The content only states the binary size (214KB) and flash free (79%), which are not directly indicative of runtime heap usage.

### 3. Can secp256k1 signing (a one-shot ~1ms operation) be safely triggered from core 1 during emulator gameplay without causing frame drops?

The "Project Ground Truth" confirms that "secp256k1 signing confirmed working (used in DOB minting flow)" and the "Goal" section explicitly targets running it on Core 1. The question specifies it as a "one-shot ~1ms operation".

While the operation's duration is short (~1ms), the provided content does not contain information about FreeRTOS task scheduling, core affinity configuration (beyond the stated intent), or analysis of shared resource contention (e.g., flash access, shared bus contention with Core 0) that would definitively determine if it can be *safely* triggered without causing emulator frame drops. The `ckb-light-esp` code snippets do not include `secp256k1` implementation details or FreeRTOS task management. Therefore, based solely on the provided content, a conclusive answer regarding its safety without frame drops cannot be given.

### 4. What FreeRTOS priority levels should each task use to guarantee emulator gets consistent CPU time?

The provided source content, including `LightClient.cpp`, `LightClient.h`, `header_chain.cpp`, `block_filter.cpp`, and `platformio.ini`, does not specify any FreeRTOS task creation calls (`xTaskCreatePinnedToCore`) or explicit priority settings (`vTaskPrioritySet`). The `LightClient::sync()` method is described as a "non-blocking state machine" intended to be called "regularly," which suggests it might run within an existing FreeRTOS task (e.g., the Arduino `loop()` task) rather than a newly created, dedicated task with specific priority.

Therefore, the content does not provide information on recommended FreeRTOS priority levels for the emulator, light client, WiFi, or signing tasks.

### 5. Is there a known pattern for "emulator on core 0, network stack on core 1" in ESP32 projects we can reference?

The provided content describes the "emulator on core 0, light client + WiFi + signing on core 1" as an "ESP32-P4 stretch goal" and an "open FiberQuest question" for Wyltek Industries. This indicates it is a specific architectural challenge or objective for the FiberQuest project itself.

The content does not reference any external, known patterns or existing ESP32 projects that have successfully implemented and documented this specific "emulator on core 0, network stack on core 1" architecture.

## Gaps / Follow-up

1.  **WiFi Interrupt Load Analysis:** Detailed analysis or empirical data on the typical interrupt frequency and CPU time consumed by the ESP-IDF WiFi stack on Core 1 is needed. This would help quantify its impact on other tasks on Core 1 and potential cross-core interference.
2.  **Configuration Constant Values:** To accurately estimate `ckb-light-esp`'s peak heap consumption, the values for `LIGHT_JSON_BUFFER_SIZE`, `LIGHT_HEADER_CACHE_SIZE`, `LIGHT_MAX_WATCHED_SCRIPTS`, `LIGHT_FILTER_MATCH_QUEUE_SIZE`, and `LIGHT_FILTER_EVENT_QUEUE_SIZE` from `LightConfig.h` are required.
3.  **FreeRTOS Task Configuration:** Specific FreeRTOS task creation (`xTaskCreatePinnedToCore`), priority settings, and core affinity for the emulator, light client, WiFi, and `secp256k1` signing tasks need to be defined and implemented.
4.  **Shared Resource Contention:** An analysis of potential contention points, such as shared flash access (e.g., for program code or data), SPI bus (if W5500 Ethernet is used, though WiFi is mentioned for P4), or other peripherals, when running the emulator on Core 0 and network/crypto on Core 1.
5.  **`secp256k1` Integration Details:** While `secp256k1` is confirmed to work, understanding its specific implementation (e.g., from `trezor_crypto`) and how it's invoked within the FreeRTOS context on Core 1 would be beneficial for assessing its real-time impact.
6.  **Emulator Performance Metrics:** Specific metrics for emulator frame drops under various load conditions would be crucial for validation.

## Relevant Code/API Snippets

*   **`LightClient.h`**:
    ```cpp
    #ifdef LIGHT_TRANSPORT_WIFI
    #include "transport/wifi_transport.h"
    #endif
    // ...
    class LightClient {
    private:
        LightSyncState _state;
        HeaderChain _headers;
        BlockFilter _filter;
        #ifndef LIGHT_NO_UTXO_STORE
        UTXOStore _utxos;
        #endif
        #ifdef LIGHT_TRANSPORT_WIFI
        WiFiTransport _transport;
        #endif
        // ...
        char _jsonBuf[LIGHT_JSON_BUFFER_SIZE];
        // ...
    };
    ```
*   **`HeaderChain.h`**:
    ```cpp
    #include "../LightConfig.h"
    // ...
    struct CKBHeader {
        uint32_t compact_target;
        uint64_t number;
        uint32_t timestamp; // seconds
        uint8_t hash[32];
        uint8_t parent_hash[32];
        uint8_t nonce[16]; // little-endian
        bool verified;
    };
    // ...
    class HeaderChain {
    private:
        CKBHeader _cache[LIGHT_HEADER_CACHE_SIZE];
        uint8_t _count;
        uint8_t _tipIdx;
        // ...
    };
    ```
*   **`BlockFilter.h`**:
    ```cpp
    #include "../LightConfig.h"
    // ...
    struct FilterEvent {
        char txHash[67]; // "0x" + 64 hex + null
        uint64_t blockNumber;
    };
    // ...
    class BlockFilter {
    private:
        uint8_t _scriptHashes[LIGHT_MAX_WATCHED_SCRIPTS][32];
        uint64_t _scriptStartBlock[LIGHT_MAX_WATCHED_SCRIPTS];
        uint8_t _scriptCount;
        uint64_t _matchQueue[LIGHT_FILTER_MATCH_QUEUE_SIZE];
        uint8_t _matchHead, _matchTail;
        FilterEvent _eventQueue[LIGHT_FILTER_EVENT_QUEUE_SIZE];
        uint8_t _eventHead, _eventTail;
        // ...
    };
    ```
*   **`platformio.ini` (for `env:esp32p4-full`)**:
    ```ini
    [env:esp32p4-full]
    platform = espressif32
    board = esp32p4
    framework = arduino
    build_flags = -DLIGHT_PROFILE_FULL -DBOARD_HAS_PSRAM -DBOARD_ESP32_P4 -DCONFIG_SPIRAM_SUPPORT=1
    lib_deps = symlink:///home/phill/workspace/CKB-ESP32
               symlink:///home/phill/workspace/ckb-light-esp
               bblanchon/ArduinoJson @ ^7.0.0
    monitor_speed = 115200
    ```
    (Note: `CKB-ESP32` library, which contains `trezor_crypto` for `secp256k1`, is a dependency.)