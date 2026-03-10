# Research: ckb-custom-lang-feasibility

**Date:** 2026-03-10  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb-js-vm/main/README.md, https://raw.githubusercontent.com/nervosnetwork/ckb-js-vm/main/docs/development.md, https://raw.githubusercontent.com/nervosnetwork/ckb-c-stdlib/master/README.md, https://raw.githubusercontent.com/nervosnetwork/ckb-c-stdlib/master/ckb_syscalls.h, https://raw.githubusercontent.com/nervosnetwork/ckb-c-stdlib/master/ckb_dlfcn.h, https://raw.githubusercontent.com/rui314/chibicc/main/README.md

---

Date: 2026-03-10

## Summary

This feasibility study explores the potential for a custom, C-like scripting language for the Nervos CKB blockchain, targeting the CKB-VM's RISC-V bytecode execution. Analysis of existing CKB script environments like `ckb-js-vm` (QuickJS) and `ckb-c-stdlib` reveals a foundation of CKB syscalls and data structures. While `ckb-js-vm` provides a JavaScript runtime, details on its glue layer are limited. The study identifies a lack of explicit RISC-V backend support in small C compilers like chibicc within the provided content, and no direct information on cycle costs for interpreters vs. AOT on-chain. Key considerations for a new language include defining CKB-native types and leveraging existing open-source compiler components, though specific RISC-V-focused tools are not detailed in the provided materials.

## Questions to Answer

### 1. How is ckb-js-vm structured — QuickJS compiled to RISC-V, script reads JS from cell data, executes it? What does the glue layer look like?

`ckb-js-vm` is structured as a JavaScript runtime environment for CKB-VM, built by adapting [QuickJS](https://bellard.org/quickjs/). It consists of two main components:
1.  **ckb-js-vm**: An on-chain script runtime engine that executes JavaScript code or bytecode.
2.  **ckb-js-std**: TypeScript packages providing helper utilities for writing on-chain scripts.

The provided content explicitly states it executes "JavaScript code or bytecode," implying that QuickJS itself (or a significant part of it) is compiled to RISC-V bytecode for execution on CKB-VM. The script (JavaScript code or bytecode) would then be read from cell data and interpreted/executed by this on-chain QuickJS runtime.

The provided documentation does not detail the specific "glue layer" that connects QuickJS to the CKB-VM environment or how it interacts with CKB syscalls beyond stating that `ckb-js-std` provides "helper utilities for writing on-chain script".

### 2. What syscalls does CKB expose to scripts (ckb_load_cell, ckb_load_script, etc.) and how are they bound in C stdlib? These would be the native primitives any new language needs.

The `ckb-c-stdlib` repository serves as a commonplace for useful scripts, including "Utilities for interacting with CKB via syscalls" and "CKB's data structure definitions."

The `ckb_dlfcn.h` header within `ckb-c-stdlib` demonstrates several CKB syscalls and their C bindings:
*   `ckb_dlopen`: A wrapper around `ckb_dlopen2` for dynamic loading of dependency cells.
    ```c
    int ckb_dlopen(const uint8_t *dep_cell_data_hash, uint8_t *aligned_addr, size_t aligned_size, void **handle, size_t *consumed_size) {
        return ckb_dlopen2(dep_cell_data_hash, 0, aligned_addr, aligned_size, handle, consumed_size);
    }
    ```
*   `_ckb_load_cell_code`: A wrapper that calls `ckb_load_cell_data_as_code` to load cell data as executable code.
    ```c
    int _ckb_load_cell_code(void *addr, size_t memory_size, size_t content_offset, size_t content_size, size_t index, size_t source) {
        return ckb_load_cell_data_as_code(addr, memory_size, content_offset, content_size, index, source);
    }
    ```
*   `ckb_load_cell_data`: Used to load data from a cell.
    ```c
    ret = ckb_load_cell_data((void *)&header, &len, 0, index, CKB_SOURCE_CELL_DEP);
    ```
*   `ckb_look_for_dep_with_hash2`: Used to find a dependency cell by hash.
    ```c
    int ret = ckb_look_for_dep_with_hash2(dep_cell_hash, hash_type, &index);
    ```
*   `ckb_dlsym`: Used to look up symbols in a dynamically loaded handle.

These C functions act as bindings to the underlying CKB syscalls, providing a C-compatible interface for scripts to interact with the CKB blockchain environment (e.g., loading cell data, accessing dependencies, performing dynamic linking). A new language would need similar primitives to access these core CKB functionalities.

### 3. chibicc (Rui Ueyama's small C compiler) — does it support RISC-V backend? Could it be embedded as an on-chain compiler cell?

Based on the `chibicc` README, the compiler primarily targets x86-64. It explicitly states: "I'm using Ubuntu 20.04 for x86-64 as a development platform." The "Codegen" stage "emits an assembly text for given AST nodes," but there is no mention of a RISC-V backend or support for RISC-V assembly generation in the provided content.

Regarding embedding it as an on-chain compiler cell: The CKB-VM is designed for executing pre-compiled RISC-V bytecode, not for running a full compiler. While theoretically possible to compile `chibicc` itself to RISC-V and run it on-chain, this would likely incur extremely high cycle costs and memory usage, making it impractical for typical CKB script execution. The CKB-VM's constraints are optimized for verification of deterministic execution, not for general-purpose compilation tasks.

### 4. What's the cycle cost of running an interpreter vs AOT compilation on-chain? Is there published benchmarking for ckb-js-vm cycle usage?

The provided content does not contain any information regarding the cycle cost of running an interpreter versus AOT compilation on-chain. It also does not include any published benchmarking results for `ckb-js-vm` cycle usage.

### 5. Prior art: Forth on RISC-V, Lua on RISC-V, any other small language runtimes targeting RISC-V — what binary sizes do they compile to?

The provided content does not include information on Forth on RISC-V, Lua on RISC-V, or any other small language runtimes targeting RISC-V, nor their binary sizes. The only relevant information is that `ckb-js-vm` adapts QuickJS for CKB-VM.

### 6. What would "CKB-native types" look like in a language? (Script, Cell, CellInput, Capacity as u64 with overflow protection, H256 for hashes)

Based on the CKB cell model and the `ckb-c-stdlib`, CKB-native types in a new language would need to represent the fundamental components of the CKB blockchain. While the provided content doesn't define a *new language's* type system, it shows how CKB concepts are handled in C:

*   **Hashes (H256)**: Represented by `uint8_t` arrays of appropriate length (e.g., `uint8_t dep_cell_data_hash` in `ckb_dlopen`).
*   **Capacity**: Would logically map to an unsigned 64-bit integer (`uint64_t` in C) to handle the CKB capacity unit (shannons). The language would need to provide explicit overflow protection mechanisms, as suggested.
*   **Scripts, Cells, CellInputs, CellOutputs**: These are complex data structures. In C, they would be represented by structs containing their constituent fields (e.g., `lock_hash`, `type_hash`, `capacity`, `data`). The `ckb-c-stdlib` README mentions "CKB's data structure definitions" are included, implying C structs for these. For a new language, these would likely be opaque types or structs with fields accessible via specific methods or properties, ensuring type safety and correct interaction with the CKB-VM.
*   **Indices and Sources**: `size_t index` and `size_t source` (e.g., `CKB_SOURCE_CELL_DEP`) are used in syscalls like `ckb_load_cell_data` to specify which cell to load and from where (input, output, cell_dep, header_dep). These would be fundamental integer types or enums in a new language.

The examples provided in the question (Script, Cell, CellInput, Capacity as u64 with overflow protection, H256 for hashes) accurately reflect the necessary CKB-native primitives for a purpose-built language.

### 7. Linear/affine type systems for cell ownership — has anyone proposed this for CKB? Compare to Move language's resource model.

The provided content does not contain any information or proposals regarding linear or affine type systems for cell ownership on CKB, nor does it compare CKB's model to the Move language's resource model.

### 8. Minimal viable compiler pipeline: source → AST → RISC-V assembly → binary. What existing open-source components could be reused (LLVM too heavy, QBE backend, libgccjit, RVCC)?

The `chibicc` README describes a compiler pipeline:
1.  **Tokenize**: String input → list of tokens.
2.  **Preprocess**: List of tokens → macro-expanded tokens.
3.  **Parse**: Preprocessor output → Abstract Syntax Trees (AST), with type information added.
4.  **Codegen**: AST nodes → assembly text.

For a custom CKB language, this pipeline (Tokenize → Parse → AST → Codegen) is a standard and viable approach. However, `chibicc`'s codegen targets x86-64 assembly, not RISC-V.

The provided content does not mention specific existing open-source components like QBE backend, libgccjit, or RVCC that could be reused for a RISC-V backend. It only states that CKB-VM executes RISC-V bytecode. Therefore, while the *stages* of `chibicc`'s pipeline are relevant, its specific code generation backend would not be directly reusable for RISC-V without significant modification or replacement.

### 9. Are there any CKB RFCs or community proposals for a higher-level scripting layer?

The provided content mentions `ckb-js-vm` as "A JavaScript runtime environment for CKB-VM," which serves as a higher-level scripting layer. `ckb-c-stdlib` also provides a C-based layer.

However, the provided text does not mention any *other* CKB RFCs or community proposals for *new* or *alternative* higher-level scripting layers beyond these existing implementations.

## Gaps / Follow-up

1.  **ckb-js-vm Glue Layer Details**: The specific implementation details of how QuickJS (compiled to RISC-V) interacts with CKB syscalls and the CKB-VM environment are not provided. A deeper dive into the `ckb-js-vm` source code would be necessary to understand this "glue layer."
2.  **CKB-VM Cycle Cost Benchmarking**: There is no explicit data on the cycle costs for `ckb-js-vm` or a general comparison of interpreter vs. AOT compilation costs on CKB-VM. This is critical for evaluating the performance implications of a new language.
3.  **RISC-V Compiler Backend Components**: The provided content lacks information on existing open-source compiler components specifically for generating RISC-V assembly or bytecode that could be integrated into a custom compiler. Research into projects like QBE, libgccjit, or RVCC, and their suitability for CKB-VM's constraints, would be a necessary follow-up.
4.  **Prior Art for Small RISC-V Runtimes**: Information on binary sizes and characteristics of other small language runtimes (e.g., Forth, Lua) compiled for RISC-V is missing. This would provide valuable context for expected footprint and performance.
5.  **CKB-native Type Definitions**: While the concepts are clear, a precise definition of how "CKB-native types" (like `Script`, `Cell`, `Capacity`, `H256`) would be represented and manipulated in a new language's syntax and runtime is not detailed.
6.  **Linear/Affine Type Systems for CKB**: There's no mention of research or proposals for advanced type systems like linear or affine types for managing cell ownership on CKB. This could be a significant area for future exploration to enhance security and correctness.

## Relevant Code/API Snippets

**From `nervosnetwork/ckb-c-stdlib/master/ckb_dlfcn.h` (CKB Syscall Bindings):**

```c
// Wrapper for ckb_dlopen2
int ckb_dlopen(const uint8_t *dep_cell_data_hash, uint8_t *aligned_addr, size_t aligned_size, void **handle, size_t *consumed_size) {
    return ckb_dlopen2(dep_cell_data_hash, 0, aligned_addr, aligned_size, handle, consumed_size);
}

// Wrapper for ckb_load_cell_data_as_code
int _ckb_load_cell_code(void *addr, size_t memory_size, size_t content_offset, size_t content_size, size_t index, size_t source) {
    return ckb_load_cell_data_as_code(addr, memory_size, content_offset, content_size, index, source);
}

// Example of ckb_load_cell_data usage
ret = ckb_load_cell_data((void *)&header, &len, 0, index, CKB_SOURCE_CELL_DEP);

// Example of ckb_look_for_dep_with_hash2 usage
int ret = ckb_look_for_dep_with_hash2(dep_cell_hash, hash_type, &index);
```

**From `nervosnetwork/ckb-js-vm/main/README.md` (ckb-js-vm structure):**

```markdown
# ckb-js-vm A JavaScript runtime environment for CKB-VM, built by adapting [QuickJS](https://bellard.org/quickjs/). This project consists of two main components: 1. **ckb-js-vm**: An on-chain script runtime engine that executes JavaScript code or bytecode 2. **ckb-js-std**: TypeScript packages providing helper utilities for writing on-chain script
```

**From `rui314/chibicc/main/README.md` (chibicc pipeline):**

```markdown
## Internals
chibicc consists of the following stages:
- Tokenize: A tokenizer takes a string as an input, breaks it into a list of tokens and returns them.
- Preprocess: A preprocessor takes as an input a list of tokens and output a new list of macro-expanded tokens. It interprets preprocessor directives while expanding macros.
- Parse: A recursive descendent parser constructs abstract syntax trees from the output of the preprocessor. It also adds a type to each AST node.
- Codegen: A code generator emits an assembly text for given AST nodes.
```