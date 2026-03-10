# Research: ckb-risc-v-compiler-toolchain

**Date:** 2026-03-10  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb-c-stdlib/master/Makefile, https://raw.githubusercontent.com/nervosnetwork/ckb-c-stdlib/master/molecule/blockchain.mol, https://raw.githubusercontent.com/nicowillis/rvcc/main/README.md, https://raw.githubusercontent.com/bellard/tcc/master/README, https://c9x.me/compile/doc/il.html, https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0002-ckb/0002-ckb.md

---

Date: 2026-03-10

## Summary

The Nervos team utilizes `riscv64-unknown-elf-gcc` with specific optimization and linker flags (`-O3`, `-fdata-sections`, `-ffunction-sections`, `-Wl,--gc-sections`, `-nostdlib`, `-nostartfiles`) to compile C scripts for the CKB-VM, focusing on binary size reduction. While QBE is presented as a lightweight intermediate language backend capable of generating assembly for standard toolchains (like GNU binutils, which includes RISC-V assemblers), the provided content does not list specific languages that have adopted it. Information regarding TCC's RISC-V support, `chibicc`, `ckb_dlopen` for shared libraries, specific CKB-VM instruction extensions beyond RISC-V ISA compatibility, or detailed cycle-per-instruction documentation for cost estimation is not available in the provided sources. CKB cells have a minimum capacity cost based on their total byte size, but no explicit maximum binary size limit for scripts is documented.

## Questions to Answer

### 1. What does the Nervos team use to compile C scripts — riscv64-unknown-elf-gcc with what flags? Any size optimisation tricks documented?

The Nervos team uses `riscv64-unknown-elf-gcc` to compile C scripts, as indicated by the `ckb-c-stdlib/Makefile`. The specific toolchain is provided via a Docker image: `nervos/ckb-riscv-gnu-toolchain:jammy-20230214`.

The following flags are used:

*   **Compiler Flags (`CFLAGS`):**
    *   `-Wall -Werror -Wextra -Wno-unused-parameter -Wno-dangling-pointer -Wno-nonnull -Wno-nonnull-compare`: Standard warning and error flags.
    *   `-fno-builtin-printf -fno-builtin-memcmp`: Prevents GCC from using built-in versions of these functions, likely to use custom, smaller implementations.
    *   `-O3`: Aggressive optimization level.
    *   `-g`: Include debugging information.
    *   `-fdata-sections -ffunction-sections`: Places each data item and function in its own section, enabling dead code/data elimination by the linker.
    *   `-I . -I libc -I molecule -Wno-unused-function -Wno-array-bounds -Wno-stringop-overflow`: Include paths and additional warning suppressions.
*   **Linker Flags (`LDFLAGS`):**
    *   `-nostdlib -nostartfiles`: Prevents linking against standard libraries and startup files, significantly reducing binary size by requiring a minimal custom C standard library.
    *   `-Wl,-static`: Links statically.
    *   `-Wl,--gc-sections`: Linker garbage collection, which removes unreferenced sections (functions and data) made possible by `-fdata-sections` and `-ffunction-sections`.

These flags, particularly `-O3`, `-fdata-sections`, `-ffunction-sections`, `-nostdlib`, `-nostartfiles`, and `-Wl,--gc-sections`, are explicit size optimization tricks documented in the `Makefile`.

### 2. TCC (Tiny C Compiler) — does it have a working RISC-V64 backend? Could it be compiled to RISC-V itself (recursive compiler-as-script)?

The provided content includes a reference to `bellard/tcc/README`, but a `FETCH ERROR` occurred, preventing access to its content. Therefore, it is not possible to determine from the provided information whether TCC has a working RISC-V64 backend or if it could be compiled to RISC-V itself.

### 3. QBE backend — what languages have used QBE as their backend? Could a new CKB language use QBE → RISC-V asm?

The `c9x.me/compile/doc/il.html` document describes QBE's Intermediate Language (IL) and its design as a lightweight backend. It highlights that QBE "smoothes most of the irregularities of the underlying hardware and allows an infinite number of temporaries to be used," positioning it as a simpler alternative to LLVM. However, the provided documentation does **not** explicitly list specific programming languages that have used QBE as their backend.

Yes, a new CKB language *could* use QBE as its backend to target RISC-V assembly. The QBE documentation states, "Once processed by QBE, the resulting file can be assembled and linked using a standard toolchain (e.g., GNU binutils)." Given that CKB-VM is a RISC-V ISA compatible virtual machine and the Nervos team uses `riscv64-unknown-elf-gcc` (part of GNU binutils), QBE could generate assembly that is then processed by the appropriate RISC-V assembler and linker to produce a CKB-VM compatible binary.

### 4. chibicc RISC-V support — Rui added x86-64 and ARM64. Is RISC-V64 in a fork? What would it take to add?

The provided content does **not** contain any information about `chibicc` or its RISC-V support. Therefore, it is not possible to determine if RISC-V64 is supported in a fork or what would be required to add it.

### 5. Binary size reality: what do existing CKB C scripts weigh in at? Is there a size limit per cell?

The provided content does **not** state the typical binary size of existing CKB C scripts.

Regarding a size limit per cell, the `rfcs/0002-ckb.md` document explains the "State Cost and Cell Capacity." It states: "The actual size of a cell is calculated by `(8 + data_size + lock_script_size + type_script_size)` bytes, where `data_size` is the length of the data field, `lock_script_size` is the length of the lock script, and `type_script_size` is the length of the type script." This total byte size determines the CKB capacity required to store the cell, with "The minimum capacity for a cell is 60 CKB." While the size of the script (as part of `lock_script_size` or `type_script_size`) directly contributes to the cell's overall byte size and thus its storage cost, the content does **not** specify a hard *maximum byte limit* for the script binary itself within a cell.

### 6. ckb_dlopen / shared libraries — how do scripts share code libraries on-chain without duplicating binary blobs?

The provided content does **not** mention `ckb_dlopen` or any mechanisms for scripts to share code libraries on-chain without duplicating binary blobs. Therefore, this question cannot be answered from the given information.

### 7. CKB-VM version history — what instruction extensions are available (rv64imc baseline, any additions)?

The `rfcs/0002-ckb.md` document states that "CKB-VM is a RISC-V ISA compatible virtual machine." However, it does **not** specify the exact instruction set extensions available (e.g., whether it's strictly `rv64imc` or if there are any additional extensions).

### 8. Cycle counting — is there documentation on cycles-per-instruction for CKB-VM? How do script authors estimate cost?

The `rfcs/0002-ckb.md` document mentions "Computation Cost and Transaction Fees," stating that "Transaction fees are calculated based on the total cycles consumed by the transaction and the transaction size." However, the provided content does **not** contain documentation on specific cycles-per-instruction for CKB-VM or detailed methods on how script authors estimate the computational cost of their scripts beyond this general statement.

## Gaps / Follow-up

1.  **TCC RISC-V Support:** Investigate the current status of RISC-V64 backend support in TCC and its potential for self-compilation.
2.  **QBE Language Adoption:** Research specific programming languages that have successfully used QBE as their backend to understand practical implementations.
3.  **chibicc RISC-V Support:** Determine if `chibicc` has a RISC-V64 backend in any forks and assess the effort required to implement it.
4.  **CKB Script Binary Size Limits:** Clarify if there is a hard maximum byte limit for script binaries within a CKB cell, beyond the capacity cost calculation.
5.  **ckb_dlopen / Shared Libraries:** Research the `ckb_dlopen` mechanism and how CKB scripts implement on-chain shared libraries to avoid binary duplication.
6.  **CKB-VM Instruction Extensions:** Identify the precise RISC-V instruction set extensions supported by CKB-VM (e.g., `rv64imc` plus any others).
7.  **CKB-VM Cycle Counting:** Find documentation detailing cycles-per-instruction for CKB-VM and recommended methodologies for script authors to estimate execution costs.
8.  **Existing CKB Script Sizes:** Gather data on the typical binary sizes of various production CKB C scripts to establish a realistic baseline.

## Relevant Code/API Snippets

**From `nervosnetwork/ckb-c-stdlib/master/Makefile`:**

```makefile
CC := riscv64-unknown-elf-gcc
AR := riscv64-unknown-elf-ar
LIB := libdummylibc.a

CFLAGS := -Wall -Werror -Wextra -Wno-unused-parameter -Wno-dangling-pointer -Wno-nonnull -Wno-nonnull-compare -fno-builtin-printf -fno-builtin-memcmp -O3 -g -fdata-sections -ffunction-sections
LDFLAGS := -nostdlib -nostartfiles -Wl,-static -Wl,--gc-sections
EXTRA := -I . -I libc -I molecule -Wno-unused-function -Wno-array-bounds -Wno-stringop-overflow

# nervos/ckb-riscv-gnu-toolchain:jammy-20230214
BUILDER_DOCKER := nervos/ckb-riscv-gnu-toolchain@sha256:d175f4a766b4b17a44bd9bbeca8e24ab2427ba615738016dc49e194046e6b28b
```