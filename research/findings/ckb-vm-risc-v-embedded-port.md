# Research: ckb-vm-risc-v-embedded-port

**Date:** 2026-03-10  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb-vm/main/Cargo.toml, https://raw.githubusercontent.com/nervosnetwork/ckb-vm/main/src/interpreter.rs, https://raw.githubusercontent.com/nervosnetwork/ckb-vm/main/src/machine/asm/mod.rs, https://raw.githubusercontent.com/nervosnetwork/ckb-vm/main/benches/vm_metrics.rs, https://raw.githubusercontent.com/raspberrypi/pico-sdk/master/README.md, https://raw.githubusercontent.com/espressif/esp-idf/master/examples/get-started/hello_world/main/hello_world_main.c

---

## Research Note: ckb-vm-risc-v-embedded-port

**Date:** 2026-03-10

### Summary
This research investigates the feasibility of porting or embedding the CKB-VM onto RISC-V and ARM microcontrollers, specifically targeting ESP32-P4/S3 and RP2040. Due to critical source code (`ckb-vm` Rust files) being unavailable, direct analysis of the existing CKB-VM's binary size, `no_std` compatibility, and interpreter specifics is not possible. However, the availability of 8MB PSRAM on ESP32-S3 significantly enhances memory capacity for CKB scripts. The CKB-VM's cycle counting mechanism is identified as a valuable feature for embedded resource limiting. Security considerations for on-device script execution remain paramount, requiring robust VM sandboxing.

### Questions to Answer

1.  **CKB-VM is written in Rust — what does it compile to in terms of binary size for a no_std embedded target? Is there a no_std feature flag or would it need significant porting?**
    The provided content indicates a `[FETCH ERROR: HTTP Error 404: Not Found]` for `nervosnetwork/ckb-vm/main/Cargo.toml`. Without access to the `Cargo.toml` file or the Rust source code, it is impossible to determine the exact binary size for a `no_std` embedded target, nor can we confirm the existence of a `no_std` feature flag or estimate the porting effort required.

2.  **The interpreter mode (not JIT/AOT) — how many lines of code, what are its dependencies? Could it be rewritten in C for embedded portability?**
    The provided content indicates a `[FETCH ERROR: HTTP Error 404: Not Found]` for `nervosnetwork/ckb-vm/main/src/interpreter.rs`. Therefore, the number of lines of code for the interpreter mode and its specific dependencies cannot be determined from the provided sources.
    Regarding rewriting in C for embedded portability: Given Wyltek Industries already has `wyltek-embedded-builder`, a C framework for ESP32 embedded CKB/blockchain apps, rewriting a minimal CKB-VM interpreter in C would align with existing tooling and expertise, potentially offering better control over binary size and resource usage for deeply embedded targets like the RP2040.

3.  **rv64imc on rv32imc emulation: is there prior art for running 64-bit RISC-V code on a 32-bit RISC-V core? What's the performance cost?**
    The provided content does not contain any information regarding prior art for running 64-bit RISC-V code on a 32-bit RISC-V core, nor does it provide details on the associated performance costs.

4.  **RP2040 as a target: Cortex-M0+ with 264KB RAM. Is there a C implementation of a RISC-V interpreter small enough to fit? (Previous work: rvemu, mini-rv32ima, etc.)**
    The `pico-sdk/README.md` confirms the RP2040 is a Cortex-M0+ with 264KB RAM, supporting C/C++ development. The document states: "The SDK can be used to build anything from simple applications, fully-fledged runtime environments such as MicroPython, to low level software such as the RP-series microcontroller's on-chip bootrom itself."
    However, the provided content does not include details on the binary size or memory footprint of `rvemu` or `mini-rv32ima`, or any other C implementation of a RISC-V interpreter. Therefore, it cannot be definitively stated whether such an interpreter would fit within the RP2040's 264KB RAM based solely on the provided information.

5.  **mini-rv32ima (Charles Lohr's ~1000 line RISC-V emulator) — could this be adapted to rv64imc for CKB-VM compatibility? What instruction set extensions would need adding?**
    The provided content does not include the source code or detailed specifications for `mini-rv32ima`. Therefore, it is not possible to definitively state whether it could be adapted to `rv64imc` for CKB-VM compatibility or what specific instruction set extensions would need adding. Adapting a 32-bit RISC-V emulator to support `rv64imc` would generally require significant modifications, including:
    *   Changing register width from 32-bit to 64-bit.
    *   Updating memory addressing and load/store operations to handle 64-bit values.
    *   Implementing the full `RV64I` base integer instruction set.
    *   Ensuring correct handling of the `M` (Integer Multiply/Divide) and `C` (Compressed Instructions) extensions for 64-bit.

6.  **ESP32-S3 with PSRAM: 8MB external PSRAM available. Does this change the feasibility? What CKB script complexity becomes possible with 8MB heap?**
    Yes, the availability of 8MB external PSRAM on the ESP32-S3 significantly changes the feasibility of running CKB-VM. The ground truth states that `ckb-light-esp` targets ESP32-S3 (among others), confirming its compatibility with the platform.
    A heap of 8MB provides a substantial increase in available memory compared to the internal SRAM (e.g., ESP32-P4 has 768KB SRAM). This larger heap would allow for:
    *   Execution of much larger and more complex CKB scripts that require significant memory for their code and data.
    *   Loading and processing larger transaction structures or cell data within the VM.
    *   Potentially supporting more concurrent script executions or larger state within the VM if designed for it.
    *   Reducing the need for aggressive memory optimization in the VM implementation, making development potentially simpler.
    The specific "CKB script complexity" is difficult to quantify without CKB-VM memory usage benchmarks, but generally, more RAM directly translates to the ability to run more resource-intensive programs.

7.  **Cycle limit as a natural embedded timeout: CKB-VM's cycle counting could double as a watchdog/resource limiter for embedded execution. Is this a useful property for IoT use cases?**
    Yes, CKB-VM's cycle counting is an extremely useful property for IoT and embedded use cases. It provides a deterministic and predictable execution limit for scripts, which can:
    *   **Prevent infinite loops:** Malicious or buggy scripts cannot run indefinitely, consuming all CPU cycles.
    *   **Ensure predictable latency:** Critical real-time tasks can be scheduled knowing that script execution will complete within a defined cycle budget.
    *   **Resource management:** It acts as a built-in software watchdog, preventing scripts from monopolizing CPU resources.
    *   **Security:** It helps mitigate denial-of-service attacks by limiting the computational burden a single script can impose on the embedded device.
    This property is highly valuable for maintaining system stability and reliability in resource-constrained and often unattended IoT deployments.

8.  **Security model: running CKB scripts on-device for payment verification — what are the attack surfaces? Can a malicious script escape the VM sandbox on embedded hardware?**
    The provided content does not detail the specific security model of CKB-VM or its attack surfaces. However, when running CKB scripts on-device for payment verification on embedded hardware, general attack surfaces and risks include:
    *   **VM Escape:** A malicious script could exploit vulnerabilities in the VM implementation (e.g., buffer overflows, integer overflows, incorrect memory access, or improper handling of system calls/host functions) to break out of the sandbox and execute arbitrary code on the host microcontroller. This could lead to data corruption, unauthorized device control, or compromise of other running applications (e.g., `ckb-light-esp`).
    *   **Side-Channel Attacks:** Even if the VM sandbox is robust, a malicious script could attempt to infer sensitive information (e.g., private keys used for signing) by analyzing timing, power consumption, or electromagnetic emissions during its execution.
    *   **Denial of Service (DoS):** A script could intentionally consume excessive CPU cycles (if not strictly limited by cycle counting), memory, or I/O resources, leading to system unresponsiveness or crashes.
    *   **Data Tampering:** If the VM has access to host memory or storage, a malicious script could attempt to read or modify sensitive data outside its allocated sandbox.
    *   **Input Validation Bypass:** If the VM interacts with external inputs (e.g., transaction data, sensor readings), a malicious script could exploit flaws in input validation to trigger unexpected behavior.

    A well-designed VM *should* prevent a malicious script from escaping its sandbox. However, the effectiveness of the sandbox depends entirely on the correctness and robustness of the VM implementation. On embedded hardware, the lack of hardware-level memory protection (like an MMU or MPU in its most advanced forms) can make it more challenging to enforce strict memory isolation compared to systems with full operating systems. Therefore, the VM itself must be meticulously designed and audited to ensure strong isolation.

### Gaps / Follow-up

*   **CKB-VM Rust Source Code Analysis:** The most significant gap is the inability to access `nervosnetwork/ckb-vm` source files (`Cargo.toml`, `interpreter.rs`, `vm_metrics.rs`). Direct access is crucial for:
    *   Determining actual binary size for `no_std` targets.
    *   Identifying specific Rust dependencies and their `no_std` compatibility.
    *   Quantifying the lines of code and internal structure of the interpreter.
    *   Understanding the specific RISC-V instruction set extensions supported by the CKB-VM.
    *   Analyzing existing benchmarks for performance metrics.
*   **`mini-rv32ima` Details:** Specifics on `mini-rv32ima`'s current instruction set support, memory footprint, and performance are missing, which would be vital for assessing its adaptability to `rv64imc`.
*   **rv64imc on rv32imc Emulation Performance:** Concrete data or prior art on the performance overhead of emulating 64-bit RISC-V on 32-bit cores is needed to evaluate the feasibility for ESP32-C6.
*   **CKB-VM Memory Footprint:** Detailed memory usage characteristics of the CKB-VM interpreter (code size, stack, heap per script) are needed to accurately assess fitting on RP2040 and the impact of ESP32-S3 PSRAM.
*   **CKB-VM Security Model Documentation:** Specific documentation on the CKB-VM's security design, threat model, and sandboxing mechanisms would be beneficial for a deeper security analysis.

### Relevant Code/API Snippets

**Raspberry Pi Pico SDK (RP2040 confirmation):**
From `https://raw.githubusercontent.com/raspberrypi/pico-sdk/master/README.md`:
```markdown
# Raspberry Pi Pico SDK
The Raspberry Pi Pico SDK (henceforth the SDK) provides the headers, libraries and build system necessary to write programs for the RP-series microcontroller-based devices such as the Raspberry Pi Pico or Raspberry Pi Pico 2 in C, C++ or assembly language.
...
A single program runs on the device at a time and starts with a conventional `main()` method. Standard C/C++ libraries are supported along with C-level libraries/APIs for accessing all of the RP-series microcontroller's hardware including PIO (Programmable IO).
...
The SDK can be used to build anything from simple applications, fully-fledged runtime environments such as MicroPython, to low level software such as the RP-series microcontroller's on-chip bootrom itself.
```

**ESP-IDF (General ESP32 context):**
From `https://raw.githubusercontent.com/espressif/esp-idf/master/examples/get-started/hello_world/main/hello_world_main.c`:
```c
#include <stdio.h>
#include "sdkconfig.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_chip_info.h"
#include "esp_flash.h"
#include "esp_system.h"

void app_main(void)
{
    printf("Hello world!\n");
    /* Print chip information */
    esp_chip_info_t chip_info;
    uint32_t flash_size;
    esp_chip_info(&chip_info);
    printf("This is %s chip with %d CPU core(s), %s%s%s%s, ",
           CONFIG_IDF_TARGET,
           chip_info.cores,
           (chip_info.features & CHIP_FEATURE_WIFI_BGN) ? "WiFi/" : "",
           (chip_info.features & CHIP_FEATURE_BT) ? "BT" : "",
           (chip_info.features & CHIP_FEATURE_BLE) ? "BLE" : "",
           (chip_info.features & CHIP_FEATURE_IEEE802154) ? ", 802.15.4 (Zigbee/Thread)" : "");

    unsigned major_rev = chip_info.revision / 100;
    unsigned minor_rev = chip_info.revision % 100;
    printf("silicon revision v%d.%d, ", major_rev, minor_rev);

    if(esp_flash_get_size(NULL, &flash_size) != ESP_OK) {
        printf("Get flash size failed");
        return;
    }
    printf("%" PRIu32 "MB %s flash\n", flash_size / (uint32_t)(1024 * 1024),
           (chip_info.features & CHIP_FEATURE_EMB_FLASH) ? "embedded" : "external");
    printf("Minimum free heap size: %" PRIu32 " bytes\n", esp_get_minimum_free_heap_size());
    // ... (rest of the example)
}
```