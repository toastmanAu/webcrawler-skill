# Research: ckb-lang-embedded-implementation

**Date:** 2026-03-10  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/espressif/esp-idf/master/components/riscv/include/riscv/rv_utils.h, https://raw.githubusercontent.com/espressif/esp-idf/master/components/esp_hw_support/include/esp_cpu.h, https://raw.githubusercontent.com/nervosnetwork/ckb-vm/main/README.md, https://raw.githubusercontent.com/nervosnetwork/ckb-vm/main/src/machine/mod.rs, https://raw.githubusercontent.com/nervosnetwork/ckb-vm/main/definitions/src/instructions/mod.rs, https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0003-ckb-vm/0003-ckb-vm.md

---

Date: 2026-03-10

## Summary

This research investigates the feasibility of implementing CKB-native scripting on embedded RISC-V microcontrollers like the ESP32-C3/C6/H2. The core challenge lies in bridging the architectural gap between the CKB-VM's `rv64imc` instruction set and the ESP32-C series' `rv32imc`. While a full CKB-VM interpreter on an MCU would face significant memory and performance hurdles due to 64-bit emulation and the 4MB contract runtime, a dual-target language approach using toolchains like `riscv-gcc`, `riscv-llvm`, or Rust appears promising. This would allow shared logic for on-chain script verification and device-side execution, enabling robust IoT device identity, hardware wallet integration, and a powerful scripting layer for the `wyltek-embedded-builder` framework.

## Questions to Answer

### 1. ESP32-C3/C6/H2 are rv32imc; CKB-VM is rv64imc. What's the exact delta? Is it purely 32→64 bit registers, or are there instruction differences? Could a rv32 CKB-VM interpreter run on ESP32-C with minimal changes?

The exact delta between `rv32imc` (ESP32-C3/C6/H2) and `rv64imc` (CKB-VM) is primarily the word size and associated register width.
*   **CKB-VM:** Uses `rv64imc` architecture, meaning it's based on the 64-bit integer instruction set (RV64I), with the M standard extension for integer multiplication and division, and the C standard extension for RISC-V Compressed Instructions. It explicitly does not support floating-point instructions, but a softfloat implementation can be packed into the binary if needed (Source: `0003-ckb-vm.md`).
*   **ESP32-C3/C6/H2:** Use `rv32imc` architecture, based on the 32-bit integer instruction set (RV32I) with M and C extensions.

The differences are not purely 32→64 bit registers; while the core instruction *families* (I, M, C) are shared, the specific encodings and operations for 64-bit arithmetic, memory addressing, and register manipulation will differ from their 32-bit counterparts. For example, `LD` (load doubleword) and `SD` (store doubleword) instructions exist in RV64I but not RV32I, which would use two `LW` (load word) or `SW` (store word) operations.

A `rv32` CKB-VM interpreter running on an ESP32-C would require significant changes to handle the `rv64imc` instruction set. It would need to *emulate* all 64-bit operations (e.g., 64-bit arithmetic, 64-bit memory accesses) using sequences of 32-bit instructions. This is not a "minimal change" scenario and would introduce considerable performance overhead and complexity.

### 2. Has anyone ported CKB-VM to run as an interpreter on a microcontroller? What are the RAM/flash requirements of the VM itself?

Based on the provided content, there is no explicit mention or evidence that CKB-VM has been ported to run as an interpreter on a microcontroller. The `ckb-vm` source files (README.md, mod.rs, definitions/src/instructions/mod.rs) were not found (`[FETCH ERROR: HTTP Error 404: Not Found]`), preventing direct inspection of its implementation or stated requirements.

The `0003-ckb-vm.md` RFC states that "CKB virtual machine has a maximum of 4 MB runtime memory for running contracts." This refers to the *contract execution environment's* memory limit, not the RAM/flash requirements of the VM interpreter *itself*. Without access to the VM's source or specific documentation on its embedded footprint, the exact RAM/flash requirements of the CKB-VM interpreter cannot be determined from the provided content.

### 3. What's the minimum viable CKB script verifier for embedded — not full VM, just enough to verify a lock script result for a specific known script hash? Is there a stripped-down verification path?

The provided content does not describe a "stripped-down verification path" or a "minimum viable CKB script verifier" that avoids running the full CKB-VM. The `0003-ckb-vm.md` RFC details the full `rv64imc` VM, ELF format contracts, syscalls, and W^X memory protection as the mechanism for script execution and validation.

However, if the goal is to verify the result of a *specific known lock script hash* (e.g., a simple secp256k1 signature verification), a device could implement the *specific cryptographic and logical checks* required by that script directly in native C/Rust code, without a full VM. The project ground truth confirms that "secp256k1 signing confirmed working" on ESP32-P4, indicating the necessary cryptographic primitives are available. This approach would involve:
1.  Parsing the transaction data to extract the relevant input (e.g., public key, message hash, signature).
2.  Executing the specific verification algorithm (e.g., `secp256k1_verify`) using the device's native crypto libraries.
This would not be a general "CKB script verifier" but rather a "specific lock script checker" tailored to known script types.

### 4. Dual-target compilation: what languages already support compiling to both RISC-V64 (CKB-VM) and RISC-V32 (ESP32-C) from the same source? Any toolchain that handles both word sizes from one codebase?

Yes, several languages and toolchains support compiling to both RISC-V64 (CKB-VM) and RISC-V32 (ESP32-C) from the same source.
*   **C/C++:** The `0003-ckb-vm.md` RFC explicitly states: "Any compilers with RV64I support, such as `riscv-gcc`, `riscv-llvm` or Rust can be used to generate CKB compatible scripts." Both `riscv-gcc` and `riscv-llvm` are mature toolchains that can target various RISC-V architectures, including `rv32imc` and `rv64imc`. Developers can use conditional compilation (`#ifdef __riscv_xlen == 64` or similar) to handle word-size specific logic if necessary, but much of the core logic can be architecture-agnostic.
*   **Rust:** Rust has strong support for embedded development, including RISC-V targets. The `0003-ckb-vm.md` RFC mentions `rust-embedded/wg/issues/218` in this context. Rust's robust type system and memory safety features, combined with its `no_std` capabilities, make it suitable for writing code that can be compiled for both 32-bit and 64-bit RISC-V targets. The `cargo` build system and `rustup` toolchain manager simplify cross-compilation.

These toolchains allow developers to specify the target architecture (e.g., `riscv64gc-unknown-none-elf` for CKB-VM or `riscv32imac-esp-espidf` for ESP32-C3) and produce binaries for the respective environments from a single codebase.

### 5. Hardware wallet angle: if a CKB script defines a signing protocol, can the same protocol logic run on a device (WyVault/ESP32-S3) without re-implementing it separately? What would a "shared script logic" architecture look like?

Yes, the *protocol logic* defined by a CKB script can run on a device like WyVault/ESP32-S3 without entirely re-implementing it separately, provided the logic is expressed in a dual-target language (as discussed in Q4).

A "shared script logic" architecture would look like this:
1.  **Protocol Definition:** The core signing protocol (e.g., multi-signature rules, time-locked conditions, specific derivation paths) is defined once in a high-level language (e.g., Rust, C). This logic dictates *how* a signature is generated and *under what conditions* it is valid.
2.  **On-chain Deployment (CKB-VM):** The protocol logic is compiled to `rv64imc` for the CKB-VM. This compiled binary forms the CKB lock script (or type script) that resides on the blockchain. Its purpose is to *verify* that a transaction attempting to spend a cell protected by this script adheres to the defined protocol.
3.  **Device-side Implementation (WyVault/ESP32-S3):** The *same* protocol logic codebase is compiled to `rv32imc` for the embedded device. On the device, this code's purpose is to *generate* a signature that will be accepted by the on-chain CKB script.
    *   The device (e.g., WyVault/ESP32-S3) would receive a transaction to be signed.
    *   Its native firmware, incorporating the compiled protocol logic, would evaluate the transaction against the protocol's rules (e.g., check required inputs, verify conditions).
    *   If conditions are met, the device would use its secure element or internal `secp256k1` implementation (confirmed working on ESP32-P4) to generate the required signature(s).
    *   The generated signature(s) would then be returned to the transaction builder for inclusion in the CKB transaction.

This architecture ensures that the rules for spending funds are consistent between the on-chain verification and the device's signing process, minimizing discrepancies and security risks.

### 6. IoT device identity: a device generates a keypair, its lock script is deployed on CKB, it can prove ownership of cells. How would a device-side language runtime interact with a light client to verify incoming payments?

For an IoT device to prove ownership of cells and verify incoming payments using its lock script and a light client (`ckb-light-esp`), the interaction would be as follows:

1.  **Device Identity & Cell Ownership:**
    *   The device generates a keypair (e.g., using `secp256k1`).
    *   A CKB lock script (e.g., a simple secp256k1 lock) corresponding to the device's public key is deployed on CKB.
    *   The device's CKB address (derived from the lock script hash) can then receive CKB or UDTs, establishing its on-chain identity and ownership of cells.

2.  **Interaction with `ckb-light-esp` (Light Client):**
    *   The `ckb-light-esp` client, running on the ESP32, continuously syncs CKB block headers and maintains a view of the blockchain state relevant to the device's subscribed addresses. It implements `GetLastState` and `SendLastState` for this purpose.
    *   The device-side language runtime (e.g., a C/Rust application built with `wyltek-embedded-builder`) would interact with `ckb-light-esp` via an internal API or message passing.

3.  **Verifying Incoming Payments:**
    *   The device-side runtime would query `ckb-light-esp` for new blocks or transactions relevant to its CKB address.
    *   When `ckb-light-esp` identifies a new cell created for the device's address (an "incoming payment"), it would notify the device-side runtime and provide the necessary transaction and cell data.
    *   To *verify* the incoming payment, the device-side runtime needs to ensure the transaction that *created* this new cell is valid. This involves:
        *   **Transaction Structure Validation:** Basic checks on the transaction format.
        *   **Lock Script Verification (of spending inputs):** The device would need to verify the lock scripts of the *input cells* that were spent to create the new output cell. This is the critical step for "verifying incoming payments" in a UTXO-like model.
            *   If a full CKB-VM interpreter is not feasible on the device (as discussed in Q2/Q7), the device would likely rely on the light client to perform this full verification or, for specific, simple lock scripts, use a stripped-down native verification (as discussed in Q3).
            *   Alternatively, the device could trust the light client's assertion of validity, but a truly trustless verification would require some form of script execution.
        *   **Capacity/UDT Balance Check:** Ensure the capacities/UDTs are correctly transferred.

The `ckb-light-esp` provides the blockchain data; the device-side language runtime processes this data to make decisions, potentially using a local, specialized script verifier for critical checks.

### 7. Memory constraints: ESP32-S3 has 512KB SRAM + PSRAM option. RP2040 has 264KB. What's the minimum RAM a CKB script interpreter needs to run non-trivial scripts?

The `0003-ckb-vm.md` RFC states that "CKB virtual machine has a maximum of 4 MB runtime memory for running contracts." This 4MB is the *addressable memory space* and *execution limit* for CKB scripts within the CKB-VM environment.

The minimum RAM an *interpreter itself* (the code that runs the VM) needs is not specified in the provided content, and the `ckb-vm` source files were not found. However, given the 4MB contract runtime memory, running a full CKB-VM interpreter on an ESP32-S3 (512KB SRAM + PSRAM) or RP2040 (264KB) would be extremely challenging:
*   The interpreter's code and data would need to fit within the available SRAM.
*   The 4MB contract memory space would need to be emulated. This could involve using PSRAM (if available and fast enough) or external flash, but accessing these would be significantly slower than internal SRAM.
*   "Non-trivial scripts" that utilize a substantial portion of the 4MB would likely exceed the physical memory capabilities of these MCUs, even with PSRAM.

Therefore, running a *full* CKB-VM interpreter capable of executing arbitrary "non-trivial scripts" that leverage the 4MB memory limit is likely not feasible on these MCUs without significant architectural compromises (e.g., severely limiting the script's actual runtime memory, heavy reliance on slow external memory, or a very specialized JIT/AOT compilation approach). A stripped-down verifier for specific script types (as in Q3) would be more memory-efficient.

### 8. JTAG/debug tooling for RISC-V embedded: if we're writing a language that targets both CKB-VM and MCU, what does the debug story look like? OpenOCD for the chip side, ckb-debugger for the VM side?

Yes, the debug story for a dual-target language would involve distinct tooling for each environment:

*   **MCU Side (ESP32-C/S series):**
    *   **Tooling:** `OpenOCD` (Open On-Chip Debugger) would be used for JTAG/SWD debugging. It interfaces with hardware debug probes (e.g., ESP-PROG, J-Link) and provides a GDB server. `GDB` (GNU Debugger) would then connect to OpenOCD to debug the native `rv32imc` code running on the ESP32.
    *   **Features:** Espressif's ESP-IDF provides low-level debugging utilities like `esp_cpu_set_breakpoint`, `esp_cpu_clear_breakpoint`, `esp_cpu_dbgr_is_attached`, and `esp_cpu_dbgr_break` (Source: `esp_cpu.h`, `rv_utils.h`), which can be leveraged by OpenOCD/GDB for hardware breakpoints, watchpoints, and triggering debug breaks.

*   **CKB-VM Side:**
    *   **Tooling:** `ckb-debugger` (or similar tools provided by the Nervos ecosystem) would be used to debug the `rv64imc` scripts executing within the CKB-VM environment. This typically involves a simulated or emulated CKB-VM instance on a host machine.
    *   **Features:** CKB-VM debuggers would offer features like step-through execution, register inspection, memory dumps, and syscall tracing within the VM's context.

The challenge lies in debugging the *shared logic* across these two disparate environments. A robust development workflow would involve:
1.  **Unit Testing:** Thorough unit tests for the shared logic codebase, independent of the target environment.
2.  **Integration Testing:**
    *   For the MCU target: Running the compiled code on the actual ESP32 hardware with OpenOCD/GDB.
    *   For the CKB-VM target: Running the compiled script within a CKB-VM simulation/testnet environment, using `ckb-debugger`.
3.  **Trace Comparison:** If an issue arises, comparing execution traces or state changes between the MCU and CKB-VM environments can help pinpoint discrepancies in the shared logic's behavior across different word sizes or execution contexts.

### 9. Real-world precedent: have any blockchain projects shipped a light-weight VM interpreter on MCU hardware for on-device transaction verification? (Ethereum has some work here — find specifics)

The provided content explicitly states: "Ethereum has some work here — find specifics." However, the content *itself* does not provide any specifics regarding Ethereum's or any other blockchain project's lightweight VM interpreter shipped on MCU hardware for on-device transaction verification. Therefore, I cannot answer this question with specifics from the given text.

### 10. Wyltek embedded builder angle: could the language be the scripting layer for wyltek-embedded-builder boards? Device-specific logic written once, deployed both to the chain (as a lock/type script) and to the device firmware.

Yes, absolutely. The proposed dual-target language (e.g., C/Rust compiled for both `rv64imc` and `rv32imc`) could serve as a powerful scripting layer for `wyltek-embedded-builder` boards.

This aligns perfectly with the goal of having "device-specific logic written once, deployed both to the chain (as a lock/type script) and to the device firmware."
*   **Device-side Logic:** Code written in this language could handle sensor readings, actuator control, local state management, UI interactions, and other embedded application logic. This would be compiled to native `rv32imc` code and integrated into the `wyltek-embedded-builder` firmware.
*   **On-chain Logic:** The *same* codebase, or relevant subsets of it, could be compiled to `rv64imc` to form CKB lock or type scripts. These scripts could define on-chain rules for the device, such as:
    *   Conditions for unlocking device-owned funds.
    *   State transitions for device-controlled NFTs (DOBs).
    *   Verification logic for data submitted by the device to CKBFS.
    *   Rules for participating in payment channels (Fiber).

This approach would provide a unified development experience, ensuring consistency between a device's on-chain behavior and its physical operation, and leveraging the `wyltek-embedded-builder` framework for hardware abstraction and modularity.

## Gaps / Follow-up

1.  **CKB-VM Interpreter Footprint:** The exact RAM/flash requirements for a CKB-VM interpreter (distinct from the 4MB contract runtime) remain unknown due to the unavailability of the `ckb-vm` source code. Further investigation into the CKB-VM implementation details would be necessary to assess its suitability for constrained MCU environments.
2.  **Performance of 64-bit Emulation:** The performance impact of emulating `rv64imc` instructions on a `rv32imc` MCU needs to be thoroughly evaluated. This would involve benchmarking critical CKB script operations.
3.  **Stripped-down CKB Script Verifier:** While a specific lock script checker is feasible, the existence or design of a more general "stripped-down CKB script verifier" that can validate a broader range of CKB scripts without the full VM overhead is a key area for further research. This might involve a selective instruction set interpreter or a proof-of-execution mechanism.
4.  **Ethereum Precedent Details:** Specifics on Ethereum's or other blockchain projects' lightweight VM interpreters on MCU hardware for on-device transaction verification were not found in the provided content and require external research.
5.  **Fiber Client Library for Node.js:** The project ground truth explicitly mentions "Key gap: no official Node.js Fiber client library exists — must build from Rust RPC source." This is a critical gap for the FiberQuest project and potentially for other Node.js-based integrations with Fiber.

## Relevant Code/API Snippets

```c
// From https://raw.githubusercontent.com/espressif/esp-idf/master/components/riscv/include/riscv/rv_utils.h
FORCE_INLINE_ATTR void rv_utils_dbgr_break(void) {
    asm volatile("ebreak\n");
}
// ... other debug utilities like rv_utils_set_breakpoint, rv_utils_clear_breakpoint
```

```c
// From https://raw.githubusercontent.com/espressif/esp-idf/master/components/esp_hw_support/include/esp_cpu.h
FORCE_INLINE_ATTR bool esp_cpu_dbgr_is_attached(void) {
#ifdef __XTENSA__
    return xt_utils_dbgr_is_attached();
#else
    return rv_utils_dbgr_is_attached();
#endif
}

FORCE_INLINE_ATTR void esp_cpu_dbgr_break(void) {
#ifdef __XTENSA__
    xt_utils_dbgr_break();
#else
    rv_utils_dbgr_break();
#endif
}
// ... esp_cpu_set_breakpoint, esp_cpu_clear_breakpoint for hardware debugging
```

**CKB-VM Architectural Details (from `0003-ckb-vm.md`):**
*   "CKB uses `rv64imc` architecture: it is based on core RV64I ISA with M standard extension for integer multiplication and division, and C standard extension for RCV(RISC-V Compressed Instructions)."
*   "CKB doesn't support floating point instructions..."
*   "CKB virtual machine has a maximum of 4 MB runtime memory for running contracts."
*   "W^X memory... ensures the memory is either writable or executable."
*   "Any compilers with RV64I support, such as `riscv-gcc`, `riscv-llvm` or Rust can be used to generate CKB compatible scripts."