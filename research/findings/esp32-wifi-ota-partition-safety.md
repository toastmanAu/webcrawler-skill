# Research: esp32-wifi-ota-partition-safety

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/espressif/esp-idf/master/docs/en/api-reference/system/ota.rst, https://raw.githubusercontent.com/espressif/arduino-esp32/master/tools/partitions/huge_app.csv, https://raw.githubusercontent.com/GyverLibs/FastBot/main/README_EN.md, https://raw.githubusercontent.com/espressif/esp-idf/master/components/bootloader_support/include/esp_ota_ops.h

---

Date: 2026-03-05

## Summary
To ensure safe Over-The-Air (OTA) updates with rollback capabilities on ESP32, the current `huge_app.csv` partition scheme is insufficient as it only defines one OTA application slot. A robust scheme requires at least two OTA app slots (`ota_0`, `ota_1`) and an OTA Data Partition (`otadata`). The ESP-IDF's "Safe update mode" prevents bricking during a power cut mid-flash for application updates, allowing fallback to the previous working firmware. Rollback functionality, enabled by `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE`, necessitates explicit calls to `esp_ota_mark_app_valid_cancel_rollback()` after successful diagnostics of a new firmware. FastBot facilitates the delivery of firmware binaries but does not inherently manage the underlying ESP-IDF rollback mechanisms.

## Questions to Answer

### 1. Does huge_app.csv include two OTA slots? If not, what partition scheme should we use?
No, the provided `huge_app.csv` only includes one OTA application slot, named `app0` with subtype `ota_0`.
```csv
otadata, data, ota, 0xe000, 0x2000,
app0, app, ota_0, 0x10000, 0x300000,
```
The ESP-IDF documentation states that "OTA requires configuring the ... device with at least two OTA app slot partitions (i.e., `ota_0` and `ota_1`) and an OTA Data Partition" for "Safe update mode" (Source: `ota.rst`).

Therefore, a new partition scheme must be used. It should include `ota_0` and `ota_1` partitions.

### 2. How does esp_ota_mark_app_valid_cancel_rollback() work and when must we call it?
The function `esp_ota_mark_app_valid_cancel_rollback()` marks the currently running application with the state `ESP_OTA_IMG_VALID`. This state indicates that the application is functional and has no restrictions on booting.

This function *must* be called by the application after a successful diagnostic check of a newly updated firmware, *if* the `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE` Kconfig option is enabled. If `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE` is set and this function is *not* called after a new application's first boot, the application will be marked `ESP_OTA_IMG_ABORTED` (or `ESP_OTA_IMG_PENDING_VERIFY` will change to `ESP_OTA_IMG_ABORTED`) and rolled back to the previous working application on the next reboot. If `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE` is not enabled (default), then calling this function is optional.

(Source: `ota.rst`, "App Rollback" and "Rollback Process" sections)

### 3. What happens on power cut mid-flash — will the device brick or fall back to previous?
For application firmware updates (written to OTA app slots), if a power cut occurs mid-flash, the device will **not brick**. It will fall back to the previous working application. This is due to the "Safe update mode" of the OTA process for application partitions. The new, incomplete firmware image is written to an inactive OTA app slot. If the write is interrupted, the OTA Data Partition (which tracks which app slot to boot) will not be updated, ensuring the device continues to boot the previously validated application. The OTA data partition itself is also designed to be resilient against power failures during its write process by using two flash sectors.

However, updates to the bootloader or the partition table itself are considered "Unsafe update mode" and a power interruption during these specific updates *can* lead to an unrecoverable state.

(Source: `ota.rst`, "OTA Process Overview" and "OTA Data Partition" sections)

### 4. Is there a FastBot-specific approach to triggering OTA with rollback support?
FastBot provides the capability for "OTA updating the firmware .bin with a Telegram chat file (Firmware and Spiffs)" (Source: `FastBot/README_EN.md`). This means FastBot can facilitate the *delivery* of the `.bin` file to the ESP32.

However, the FastBot documentation does not describe any *FastBot-specific approach* to implementing or managing OTA rollback support. Rollback functionality is an underlying feature of the ESP-IDF framework, configured via Kconfig (`CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE`) and managed by specific ESP-IDF API calls (e.g., `esp_ota_mark_app_valid_cancel_rollback()`) within the application's code. FastBot is a high-level library for Telegram interaction and file transfer, not for low-level firmware update logic or partition management.

### 5. Minimum safe partition scheme for OTA + rollback on a 4MB flash ESP32?
A minimum safe partition scheme for OTA with rollback on a 4MB flash ESP32 requires:
1.  **NVS partition**: For non-volatile storage.
2.  **OTA Data Partition (`otadata`)**: Type `data`, subtype `ota`, size `0x2000` (8KB).
3.  **Two OTA App Slots (`ota_0`, `ota_1`)**: Type `app`, subtypes `ota_0` and `ota_1`. Each must be large enough to hold the application firmware. Given the `ckb-light-esp` binary size of 214KB, allocating 1.5MB (0x180000) per app slot is generous and provides ample room for growth.
4.  **SPIFFS/FATFS partition**: For file storage, using remaining space.
5.  **Coredump partition (optional but recommended)**: For debugging.

Based on the `huge_app.csv` and the requirement for two app slots on a 4MB flash, a suitable scheme could be:

```csv
# Name, Type, SubType, Offset, Size, Flags
nvs, data, nvs, 0x9000, 0x5000,
otadata, data, ota, 0xe000, 0x2000,
app0, app, ota_0, 0x10000, 0x180000,  # 1.5MB
app1, app, ota_1, 0x190000, 0x180000,  # 1.5MB
spiffs, data, spiffs, 0x310000, 0xE0000, # 0.875MB
coredump, data, coredump, 0x3F0000, 0x10000, # 0.0625MB
```
This scheme allocates 3MB for application firmware (1.5MB per slot), 20KB for NVS, 8KB for OTA data, 896KB for SPIFFS, and 64KB for coredump, fitting within a 4MB flash (0x400000 bytes).

(Source: `ota.rst`, "OTA Process Overview" and "OTA Data Partition" sections; `huge_app.csv` for baseline structure and sizes)

## Gaps / Follow-up

*   **Bootloader Anti-Rollback Fuses**: The provided content does not detail the bootloader anti-rollback fuses mentioned in the research goal. While `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE` is discussed, hardware-level fuse protection against rollback is not covered. This would require consulting further ESP-IDF documentation or Espressif technical references.
*   **`esp_ota_ops.h`**: The link to `esp_ota_ops.h` resulted in a 404 error. While the `ota.rst` provided sufficient context for the questions, direct access to the header file would offer precise function signatures and inline documentation.
*   **Specific OTA App Slot Sizes**: The `ota.rst` specifies the *need* for two OTA app slots but does not provide explicit minimum or recommended sizes. The proposed partition scheme's app slot sizes are derived from splitting the existing `huge_app.csv`'s single app slot and considering the known binary size, which is a reasonable heuristic but not an explicit requirement from the provided docs.

## Relevant Code/API Snippets

```c
// Example code from ota.rst for app rollback
const esp_partition_t *running = esp_ota_get_running_partition();
esp_ota_img_states_t ota_state;
if (esp_ota_get_state_partition(running, &ota_state) == ESP_OK) {
    if (ota_state == ESP_OTA_IMG_PENDING_VERIFY) {
        // run diagnostic function ...
        bool diagnostic_is_ok = diagnostic();
        if (diagnostic_is_ok) {
            ESP_LOGI(TAG, "Diagnostics completed successfully! Continuing execution ...");
            esp_ota_mark_app_valid_cancel_rollback();
        } else {
            ESP_LOGE(TAG, "Diagnostics failed! Start rollback to the previous version ...");
            esp_ota_mark_app_invalid_rollback_and_reboot();
        }
    }
}
```