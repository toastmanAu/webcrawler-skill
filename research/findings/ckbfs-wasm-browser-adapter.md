# Research: ckbfs-wasm-browser-adapter

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/code-monad/ckbfs/main/README.md, https://raw.githubusercontent.com/code-monad/ckbfs/main/RFC.md, https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html, https://raw.githubusercontent.com/emscripten-core/emscripten/main/site/source/docs/porting/connecting_cpp_and_javascript/embind.rst, https://raw.githubusercontent.com/toastmanAu/CKB-ESP32/main/src/ckbfs.h, https://raw.githubusercontent.com/toastmanAu/CKB-ESP32/main/src/ckbfs.cpp

---

Date: 2026-03-03

## Summary

This research outlines the design and specification for a WebAssembly adapter to bring the CKB-ESP32 CKBFS C/C++ implementation to browsers and React apps. The core strategy involves using Emscripten, specifically Embind, to create a clean JavaScript API for the C++ classes and functions. Key challenges include bridging asynchronous JavaScript operations (like signing and HTTP `fetch`) into the synchronous C++ codebase, which will be addressed using Emscripten's Asyncify feature. The current CKBFS implementation supports single-transaction file uploads up to 480KB, with multi-transaction support and an "APPEND protocol" not present in the provided source. The npm package will bundle the WASM module, Emscripten glue, custom JS bindings, TypeScript types, and a React hook.

## Questions to Answer

### 1. What is the minimal Emscripten build config to compile ckbfs.h pure functions to WASM — what flags, what stubs needed for Arduino guards?

To compile the pure C functions from `ckbfs.h` and `ckbfs.cpp` (e.g., `ckbfs_adler32`, `ckbfs_hex_dump`, `ckbfs_estimate_cost`, `ckbfs_build_witness`, `ckbfs_build_cell_data`, `ckbfs_hex_encode`, and molecule helpers like `mol_u32le`) to WASM, the following Emscripten build configuration is recommended:

**Emscripten Flags:**
*   `-sEXPORTED_FUNCTIONS=_ckbfs_adler32,_ckbfs_hex_dump,_ckbfs_estimate_cost,_ckbfs_build_witness,_ckbfs_build_cell_data,_ckbfs_hex_encode,...`: This flag is crucial to prevent dead code elimination from removing the desired C functions. Note the leading underscore for C function names as per Emscripten documentation: "Note that you need _ at the beginning of the function names in the EXPORTED_FUNCTIONS list." (Interacting-with-code.html).
*   `-sMODULARIZE=1 -sEXPORT_ES6=1`: To generate an ES6 module, which is suitable for modern JavaScript environments and npm packages.
*   `-sWASM=1`: Explicitly compile to WebAssembly (though often default).
*   `-sALLOW_MEMORY_GROWTH=1`: To allow the WASM memory to grow dynamically, which is useful given the use of `malloc` in `ckbfs.cpp` for buffers like `wit_buf` and JSON strings.
*   `-O3` or `-Oz`: For aggressive optimization and code size reduction.
*   `-sEXPORTED_RUNTIME_METHODS=ccall,cwrap`: If `ccall` or `cwrap` are used in external JavaScript not seen by the compiler, as mentioned in the Emscripten docs. However, with Embind, direct access via `Module` is preferred.

**Stubs needed for Arduino guards:**
The `ckbfs.h` and `ckbfs.cpp` files contain `#ifdef ARDUINO` guards. When compiling for WASM, `ARDUINO` should *not* be defined. This will cause the `else` branches to be compiled:
*   `ckbfs_print_cost`: The `printf` calls in the `else` block will be compiled. Emscripten automatically redirects `printf` output to `console.log` in the browser environment, so no explicit stub is needed for this.
*   `WDT_FEED()`: In `ckbfs.cpp`, the `else` branch defines `WDT_FEED()` as `do {} while(0);`, which is a no-op and will be optimized away by the compiler, requiring no stub.
*   `vTaskDelay(1)`: Inside `ckbfs_hex_encode`, this is guarded by `#ifdef ARDUINO`. The `else` branch is empty, so no stub is needed.

The `CKBKey` and `CKBClient` classes, and their methods like `getLockArgsHex`, `collectInputCells`, `signTx`, `broadcastRaw`, and `rpc`, are C++ and contain platform-specific logic (e.g., HTTP client). These are not "pure functions" in the context of `ckbfs.h`'s utility functions and will require Embind for binding and `EM_JS` for bridging platform-specific operations (like HTTP calls) as discussed in later questions.

### 2. How should the JS/WASM boundary be designed — embind vs cwrap vs WASM exports directly? What's the cleanest API surface?

Given that the CKBFS implementation in `ckbfs.cpp` and `ckbfs.h` heavily utilizes C++ classes like `CKBKey` and `CKBClient`, **Embind** is the superior choice for designing the JS/WASM boundary and achieving the cleanest API surface.

**Reasons for Embind:**
*   **C++ Class Binding:** Embind is specifically designed to bind C++ classes, member functions, static functions, and properties to JavaScript. This allows JavaScript to interact with C++ objects in an object-oriented manner (e.g., `new Module.CKBKey()`, `keyInstance.getLockArgsHex()`), which is much cleaner than managing raw pointers and manual method calls.
*   **Automatic Type Conversion:** Embind handles automatic conversion between many C++ types (like `int`, `float`, `std::string`, `uint8_t*` to `Uint8Array`) and JavaScript types, reducing boilerplate.
*   **Natural JavaScript API:** It generates a JavaScript API that feels native, making the compiled C++ code easier to consume in React apps.
*   **Memory Management:** Embind provides mechanisms like the `delete()` method for C++ objects created in JavaScript or returned from C++ functions, and integrates with modern JavaScript's Explicit Resource Management (`using` keyword) for automatic cleanup, which is crucial for preventing memory leaks.

**Why not `cwrap`/`ccall` or direct WASM exports:**
*   **`cwrap`/`ccall`:** These are suitable for simple C functions but become cumbersome for C++ classes. They would require manual marshaling of C++ object pointers and function arguments, leading to a less ergonomic and error-prone API.
*   **Direct WASM Exports:** This is the lowest-level approach, requiring extensive manual JavaScript glue code to handle function signatures, memory access, and type conversions. It offers the least clean API surface and is the most complex to maintain.

**Example Embind structure (conceptual):**
```cpp
// ckbfs-wasm-bindings.cpp
#include <emscripten/bind.h>
#include "ckbfs.h" // Include your CKBFS headers
#include "CKB.h"
#include "CKBSigner.h"

using namespace emscripten;

// Forward declarations for classes that might be used in bindings
// (e.g., if CKBKey and CKBClient are defined in separate headers)

EMSCRIPTEN_BINDINGS(ckbfs_module) {
    // Bind CKBKey class
    class_<CKBKey>("CKBKey")
        .constructor<const char*>() // Example constructor
        .function("getLockArgsHex", &CKBKey::getLockArgsHex, allow_raw_pointers()) // Example method
        .function("signTx", &CKBKey::signTx, allow_raw_pointers()) // Example method
        ;

    // Bind CKBClient class
    class_<CKBClient>("CKBClient")
        .constructor<const char*>() // Example constructor
        .function("setTimeoutMs", &CKBClient::setTimeoutMs)
        .function("collectInputCells", &CKBClient::collectInputCells, allow_raw_pointers())
        // ... other CKBClient methods
        ;

    // Bind ckbfs_cost_t struct as a value object
    value_object<ckbfs_cost_t>("CKBFS_Cost")
        .field("cell_bytes", &ckbfs_cost_t::cell_bytes)
        .field("witness_bytes", &ckbfs_cost_t::witness_bytes)
        .field("tx_count", &ckbfs_cost_t::tx_count)
        .field("capacity_ckb", &ckbfs_cost_t::capacity_ckb)
        .field("capacity_shannon", &ckbfs_cost_t::capacity_shannon)
        .field("fee_shannon", &ckbfs_cost_t::fee_shannon)
        .field("total_shannon", &ckbfs_cost_t::total_shannon)
        .field("use_type_script", &ckbfs_cost_t::use_type_script)
        ;

    // Bind global C functions
    function("ckbfs_adler32", &ckbfs_adler32, allow_raw_pointers());
    function("ckbfs_estimate_cost", &ckbfs_estimate_cost, allow_raw_pointers());
    function("ckbfs_build_witness", &ckbfs_build_witness, allow_raw_pointers());
    function("ckbfs_build_cell_data", &ckbfs_build_cell_data, allow_raw_pointers());
    // ... other pure C functions
    // Note: ckbfs_publish and ckbfs_fetch_witness will need special handling due to async operations.
}
```
This Embind approach provides a clean, object-oriented API for JavaScript consumers.

### 3. For `ckbfs_publish` in browser: the signing step needs to go through a CCC signer (async, returns a signature). How do we bridge async JS signing into synchronous C signing? (Asyncify? Promise + callback?)

The `ckbfs_publish` function in `ckbfs.cpp` calls `key.signTx(...)`, which is a synchronous C++ function. To bridge an asynchronous JavaScript CCC signer into this synchronous C++ flow, **Asyncify** is the most suitable and cleanest approach.

**Asyncify Approach:**
1.  **Compile with Asyncify:** The Emscripten project must be compiled with `-sASYNCIFY=1`.
2.  **Modify `CKBKey::signTx` (or a wrapper):** The C++ `signTx` method (or a new method specifically for WASM) would be modified to call an `EM_JS` function that performs the actual asynchronous signing.
3.  **`EM_JS` Async Signer:** Define an `EM_JS` function in JavaScript that:
    *   Receives the transaction data (or hash) from C++.
    *   Calls the external asynchronous CCC signer.
    *   Uses `Asyncify.handleSleep(resolve => { /* ... */ })` to pause the C++ execution.
    *   When the CCC signer's promise resolves, it calls `resolve()` with the signature, allowing C++ execution to resume.

**Conceptual `EM_JS` snippet:**
```javascript
// In a .js file passed to emcc with --js-library
mergeInto(LibraryManager.library, {
  $asyncSigner: {
    // This function will be called from C++
    signTransactionAsync: function(txHashPtr, txHashLen) {
      return Asyncify.handleSleep(function(wakeUp) {
        const txHash = UTF8ToString(txHashPtr, txHashLen); // Get tx hash from WASM memory
        // Call your actual async CCC signer
        window.cccSigner.sign(txHash)
          .then(signature => {
            // Write signature back to WASM memory if needed, or return via wakeUp
            const signaturePtr = stringToUTF8OnStack(signature); // Example: write to stack
            wakeUp(signaturePtr); // Resume C++ with the signature pointer
          })
          .catch(error => {
            console.error("Signing failed:", error);
            wakeUp(0); // Resume C++ with an error indicator
          });
      });
    }
  },
  // ... other EM_JS functions
});
```

**Conceptual C++ wrapper:**
```cpp
// In CKBKey.cpp (WASM-specific implementation)
extern "C" {
  // Declare the EM_JS function as callable from C++
  char* signTransactionAsync(char* txHashPtr, size_t txHashLen);
}

// CKBKey::signTx (WASM-specific overload or implementation)
bool CKBKey::signTxWasm(const CKBTransaction& tx, ...) {
    // ... prepare tx hash ...
    char* signaturePtr = signTransactionAsync(txHashBuffer, txHashLen);
    if (signaturePtr) {
        // ... use signaturePtr to update tx witness ...
        return true;
    }
    return false;
}
```

**Why Asyncify is preferred over Promise + Callback:**
*   **Code Simplicity:** Asyncify allows the C++ code to remain largely synchronous in its structure, making it easier to port existing blocking C++ logic. The C++ function can "wait" for the JS promise to resolve without complex callback management within C++.
*   **Direct Return Value:** Asyncify allows the C++ function to directly "return" the result of the asynchronous JS operation, mimicking a synchronous call. A promise + callback approach would require restructuring the C++ code to be non-blocking and manage state across the async boundary, which is more complex for existing synchronous code.

### 4. For `ckbfs_fetch_witness` in browser: HTTP calls need to use `fetch()` instead of HTTPClient. Best approach — JS fetch shim exported to C via EM_JS, or pure JS implementation calling WASM for decode only?

The `ckbfs_fetch_witness` function in `ckbfs.cpp` relies on `CKBClient` methods (`getLiveCell`, `getTransaction`), which internally use `CKBClient::rpc` for HTTP communication. The `ckbfs_rpc_call` function in `ckbfs.cpp` explicitly shows platform-specific `CKBClient::rpc` calls.

The **best approach** is to implement a **JavaScript `fetch()` shim exported to C++ via `EM_JS`**, combined with Asyncify.

**Reasons for this approach:**
*   **Maintain C++ Core Logic:** This approach keeps the core C++ logic of `ckbfs_fetch_witness` (e.g., parsing RPC responses, handling CKB data structures) intact within the C++ codebase. This aligns with the goal of "one C codebase, two targets."
*   **Leverage Browser `fetch()`:** It allows the WASM module to utilize the browser's native, asynchronous `fetch()` API for network requests, which is the standard and most efficient way to make HTTP calls in a browser environment.
*   **Asyncify Integration:** Similar to the signing step, since `fetch()` is asynchronous, Asyncify will be necessary to allow the synchronous C++ `CKBClient::rpc` (or its WASM-specific implementation) to pause and wait for the `fetch()` promise to resolve.

**Implementation Details:**
1.  **`EM_JS` Fetch Shim:** Create an `EM_JS` function that wraps the browser's `fetch()` API. This function would take the URL, method, headers, and body as arguments from C++.
2.  **Asyncify for `fetch`:** The `EM_JS` function would use `Asyncify.handleSleep` to pause the C++ execution until the `fetch()` promise resolves.
3.  **C++ `CKBClient::rpc` Adaptation:** The `CKBClient::rpc` method (or a WASM-specific override) would be modified to call this `EM_JS` `fetch` shim. It would pass the necessary RPC request details (URL, JSON body) to the JS function and receive