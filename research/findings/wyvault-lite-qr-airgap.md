# Research: wyvault-lite-qr-airgap

**Date:** 2026-03-08  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nayuki/QR-Code-generator/master/c/qrcodegen.h, https://raw.githubusercontent.com/nayuki/QR-Code-generator/master/c/qrcodegen.c, https://raw.githubusercontent.com/lvgl/lvgl/master/README.md, https://api.github.com/repos/Guition/JC3248W535/contents, https://raw.githubusercontent.com/BlockchainCommons/Research/master/papers/bcr-2020-005-ur.md

---

Date: 2026-03-08

## Summary

This research note analyzes the requirements for an air-gapped QR signing workflow for WyVault Lite, focusing on CKB transaction formats, QR code generation on ESP32, and companion web app development. The Uniform Resources (UR) encoding standard is identified as a robust solution for multi-part binary data transfer via QR codes, suitable for CKB transactions. Nayuki's `qrcodegen` C library is a strong candidate for ESP32 QR generation, offering heap-free operation. While LVGL supports ESP32, specific examples for the JC3248W535 board were not found in the provided content.

## (1) What is the standard format for unsigned tx QR codes in existing hardware wallets (PSBT for Bitcoin, what for CKB)?

The provided content does not specify a CKB-specific standard format analogous to Bitcoin's PSBT for unsigned transaction QR codes. However, the "Uniform Resources (UR) Encoding" document, which describes a method for encoding binary data for transport in URIs and QR codes, states that the binary sequences encoded according to this specification "MUST be valid dCBOR" (Gordian Deterministic CBOR). This implies that a dCBOR-encoded representation of an unsigned CKB transaction would be the structured binary data conveyed by a UR-encoded QR code. This approach is used by hardware wallets like Keystone and Passport for various cryptocurrencies to ensure interoperability and robust multi-part data transfer.

## (2) QR code generation on ESP32 — best C library (libqrencode? nayuki?), RAM requirements, speed at 320×480 display resolution.

Based on the provided source content, **Project Nayuki's `qrcodegen` C library** is the most relevant and suitable option. The library is designed for C, supports QR Code Model 2 (versions 1-40), all 4 error correction levels, and 4 character encoding modes.

*   **RAM Requirements**: The `qrcodegen` library is designed to avoid heap allocation. Its functions "don't allocate or free any memory on the heap," implying stack-based memory usage, which is ideal for embedded systems like the ESP32. The primary memory requirement is for the `qrcode` buffer, which must be at least `qrcodegen_BUFFER_LEN_FOR_VERSION(version)`. For a Version 40 QR code (177x177 modules), this buffer requires `ceil(177^2 / 8 + 1) = 3918 bytes`. Additional temporary buffers are needed for encoding text/binary data, calculated using `qrcodegen_calcSegmentBufferSize`.
*   **Speed at 320x480 display resolution**: The provided content for `qrcodegen` states that its functions "run in at most quadratic time with respect to input arguments. Most functions run in linear time, and some in constant time." However, specific benchmarks for ESP32 or performance at a 320x480 display resolution are not provided. Given the ESP32-P4's dual-core 400MHz RISC-V CPU, the library's efficiency suggests it should perform well, but concrete speed metrics are unavailable in the provided text.

## (3) What is the maximum data size for a QR code that's scannable by a phone camera from a 3.5" screen?

The "Uniform Resources (UR) Encoding" document states the theoretical maximum data capacity for a QR code: "The largest QR code ('version 40') consists of 177x177 'modules' (pixels). Version 40 QR codes, using the binary encoding mode and the lowest level of error correction have a capacity of 2,953 bytes." It also notes that "Ultimately this limitation is due to the inherent limitations of optical readers to resolve a captured image."

However, the provided content **does not specify the practical maximum data size for a QR code that is reliably scannable by a phone camera from a 3.5" screen.** This would depend on factors like screen pixel density, ambient lighting, phone camera quality, and scanning distance, which are not discussed.

## (4) Animated QR / multi-part QR — is it needed for CKB tx sizes, or does a single QR fit?

Yes, animated QR / multi-part QR codes are likely needed for CKB transaction sizes. The "Uniform Resources (UR) Encoding" document explicitly addresses this limitation: "This maximum capacity on QR codes becomes an issue when one wishes to convey data messages longer than the maximum supported by the standard." It further notes that "Developers of cryptocurrency wallets currently all have their own bespoke ways of breaking a binary message into several parts suitable for display as a series of QR codes, and reassembling them on the destination device."

The UR encoding standard itself is designed to "Transport binary data of arbitrary content and length using a sequence of one or more URIs or QR codes" and "Remain agnostic about whether QR codes are displayed together or time-sequenced (animated)." While the provided content does not give typical CKB transaction sizes, the existence and design goals of the UR standard strongly suggest that single QR codes are often insufficient for the "arbitrary content and length" of binary data, which would include complex or multi-output CKB transactions.

## (5) BC-UR encoding standard (used by Keystone/Passport) — worth implementing or overkill for a first version?

Implementing the BC-UR encoding standard appears to be **worth it** rather than overkill, even for a first version, given the stated goals and benefits. The "Uniform Resources (UR) Encoding" document highlights several advantages that directly address common challenges in hardware wallet communication:

*   **Standardization and Interoperability**: It aims to solve the "lack of standardization" that "is one of several problems hampering interoperability between such devices."
*   **Robust Multi-part Handling**: It supports "Transport binary data of arbitrary content and length using a sequence of one or more URIs or QR codes" and can handle both finite and "rateless encoding" sequences.
*   **Wide Compatibility**: It avoids QR code binary mode, which is "not consistently supported by readers," and instead uses the alphanumeric QR code mode for efficiency and compatibility.
*   **Data Integrity**: It includes a "CRC-32 checksum of the entire message in each part to tie them together and ensure the transmitted message has been reconstructed."
*   **Structured Data**: It supports "the addition of structure in the binary data" using Gordian Deterministic CBOR (dCBOR).

Given that Wyltek Industries already has a `wyltek-embedded-builder` C framework for ESP32, and a C++/Arduino fork of `bc-ur` (`BitConserve-UR`) exists, implementing UR seems technically feasible and would provide a robust, interoperable foundation for WyVault Lite's air-gapped communication.

## (6) Companion web app approach — what's the simplest way to build a browser-based unsigned tx generator that outputs a QR, then accepts a signed tx QR back?

The simplest approach would be to leverage Wyltek Industries' existing web development stack and infrastructure:

1.  **Frontend Framework**: Utilize the existing **React/Vite** setup, as seen in the `ckb-dob-minter` and the `Wyltek Industries site`. This provides a familiar and efficient development environment.
2.  **CKB Transaction Building**: Use the **`@ckb-ccc/core`** JavaScript SDK, which is explicitly mentioned as the "primary JS SDK for CKB transaction building." This will handle the complexities of constructing unsigned CKB transactions.
3.  **Wallet Integration**: Integrate with **JoyID wallet** using **`@ckb-ccc/connector-react`**, which is already in use for the DOB minter. This allows users to connect their wallet and initiate transaction generation.
4.  **QR Code Generation (Output)**:
    *   Serialize the unsigned CKB transaction into a binary format (e.g., dCBOR, potentially UR-encoded as discussed in Q1 and Q5).
    *   Use a browser-side JavaScript QR code generation library (e.g., `qrcode.js`, `qrious`) to render this binary data as a QR code onto an HTML Canvas element.
    *   If multi-part UR encoding is used, the app would display a sequence of QR codes, potentially animated or manually advanced.
5.  **QR Code Scanning (Input)**:
    *   Utilize standard web APIs like `getUserMedia` to access the user's webcam.
    *   Employ a browser-side JavaScript QR code scanning library (e.g., `jsQR`, `html5-qrcode`) to continuously scan the video feed for a QR code containing the signed transaction.
    *   If multi-part UR encoding is used, the scanning library would need to reassemble the parts into the complete signed transaction.
6.  **Transaction Submission**: Once the signed transaction is scanned and reassembled, use `@ckb-ccc/core` to submit it to the CKB network.

This approach minimizes new technology adoption by building upon existing, proven components within the Wyltek ecosystem.

## (7) LVGL on JC3248W535 — is there existing working code/examples for this exact board?

Based on the provided content, there is **no explicit working code or examples for LVGL on the exact JC3248W535 board.**

The LVGL `README.md` confirms that LVGL is a "fully portable C (C++ compatible) library with no external dependencies" and "Can be compiled for any MCU or MPU." It specifically lists "ESP-IDF(ESP32) component" under Platform Support, indicating strong compatibility with ESP32 devices. Given that Wyltek's primary hardware target is ESP32-P4 and the `wyltek-embedded-builder` framework exists, LVGL is highly likely to be compatible with an ESP32-based board like the JC3248W535. However, the attempt to fetch content for `Guition/JC3248W535` resulted in a `FETCH ERROR: HTTP Error 404: Not Found`, meaning no specific examples for *this exact board* were available in the provided sources.

## Gaps / Follow-up

*   **CKB Transaction Size Data**: The research would benefit from data on typical and maximum CKB transaction sizes (especially for complex scenarios like Spore NFT minting or multi-output transactions) to definitively determine the necessity and frequency of multi-part QR codes.
*   **ESP32-P4 QR Generation Benchmarks**: While `qrcodegen` is efficient, specific performance benchmarks (generation time, CPU usage) on the ESP32-P4 at 320x480 resolution would be valuable.
*   **Practical QR Scannability Limits**: Further research or experimentation is needed to determine the practical maximum data size for a QR code that can be reliably scanned by a phone camera from a 3.5" screen, considering real-world conditions.
*   **Browser-side QR Libraries**: Identify specific, well-maintained JavaScript libraries for QR code generation and scanning that are compatible with React/Vite and handle binary data (or UR-encoded data) effectively.
*   **JC3248W535 LVGL Examples**: While LVGL supports ESP32, a manual search for community or vendor-specific examples for the JC3248W535 board would be a useful follow-up to find existing integrations.

## Relevant Code/API Snippets

**Nayuki's `qrcodegen` C library (for ESP32 QR generation):**

```c
// From qrcodegen.h
/*
 * The error correction level in a QR Code symbol.
 */
enum qrcodegen_Ecc {
	qrcodegen_Ecc_LOW = 0 , // The QR Code can tolerate about 7% erroneous codewords
	qrcodegen_Ecc_MEDIUM , // The QR Code can tolerate about 15% erroneous codewords
	qrcodegen_Ecc_QUARTILE, // The QR Code can tolerate about 25% erroneous codewords
	qrcodegen_Ecc_HIGH , // The QR Code can tolerate about 30% erroneous codewords
};

/*
 * Returns the number of bytes needed for the `tempBuffer` of `qrcodegen_encodeSegments()`
 * or `qrcodegen_encodeSegmentsAdvanced()`, given the QR Code version and error correction level.
 * For example, `qrcodegen_BUFFER_LEN_FOR_VERSION(1, qrcodegen_Ecc_LOW)` returns 26.
 * Use this to allocate a `uint8_t tempBuffer[]` array.
 */
#define qrcodegen_BUFFER_LEN_FOR_VERSION(version)  \
	(qrcodegen_REED_SOLOMON_DEGREE_MAX * 2 + 32 + (version) * (version) * 2)

/*
 * Returns the number of bytes needed for the `qrcode` buffer of `qrcodegen_encodeSegments()`
 * or `qrcodegen_encodeSegmentsAdvanced()`, given the QR Code version.
 * For example, `qrcodegen_BUFFER_LEN_FOR_VERSION(1)` returns 26.
 * Use this to allocate a `uint8_t qrcode[]` array.
 */
#define qrcodegen_BUFFER_LEN_FOR_VERSION(version)  \
	(qrcodegen_REED_SOLOMON_DEGREE_MAX * 2 + 32 + (version) * (version) * 2)

// Example usage (conceptual, not directly from provided snippet but implied by API):
// uint8_t tempBuffer[qrcodegen_BUFFER_LEN_FOR_VERSION(maxVersion)];
// uint8_t qrcode[qrcodegen_BUFFER_LEN_FOR_VERSION(maxVersion)];
// bool success = qrcodegen_encodeText(text, tempBuffer, qrcode, qrcodegen_Ecc_MEDIUM, minVersion, maxVersion, qrcodegen_Mask_AUTO, true);
// int size = qrcodegen_getSize(qrcode);
// bool isDark = qrcodegen_getModule(qrcode, x, y);
```

**LVGL (for ESP32 display integration):**

```c
// From lvgl/lvgl/master/README.md
#include "lvgl/lvgl.h"

/*Define LV_LVGL_H_INCLUDE_SIMPLE to include as "lvgl.h"*/
#define TFT_HOR_RES 320
#define TFT_VER_RES 240

static uint32_t my_tick_cb(void) {
    return my_get_millisec();
}

static void my_flush_cb(lv_display_t * disp, const lv_area_t * area, uint8_t * px_map) {
    /*Write px_map to the area->x1, area->x2, area->y1, area->y2 area of the
     *frame buffer or external display controller. */
    /* signal LVGL that we're done */
    lv_display_flush_ready(disp);
}

void main(void) {
    my_hardware_init();
    /*Initialize LVGL*/
    lv_init();
    /*Set millisecond-based tick source for LVGL so that it can track time.*/
    lv_tick_set_cb(my_tick_cb);
    /*Create a display where screens and widgets can be added*/
    lv_display_t * display = lv_display_create(TFT_HOR_RES, TFT_VER_RES);
    /*Add rendering buffers to the screen.
     *Here adding a smaller partial buffer assuming 16-bit (RGB565 color format)*/
    static uint8_t buf[TFT_HOR_RES * TFT_VER_RES / 10 * 2]; /* x2 because of 16-bit color depth */
    lv_display_set_buffers(disp
```