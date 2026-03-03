# Research: esp32-p4-sphincs-plus

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/espressif/esp-idf/master/components/esp_hw_support/include/esp_sha.h, https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/sha.html, https://raw.githubusercontent.com/pq-crystals/sphincsplus/master/README.md, https://raw.githubusercontent.com/RustCrypto/signatures/master/sphincsplus/README.md, https://raw.githubusercontent.com/espressif/esp-idf/master/components/mbedtls/port/include/sha256_alt.h, https://raw.githubusercontent.com/nicowillis/git-mirror/main/README.md

---

Date: 2026-03-03

## Research Note: esp32-p4-sphincs-plus Feasibility

### Summary
Due to persistent fetch errors for all provided source URLs, no content could be retrieved for analysis. Consequently, it is impossible to assess the feasibility of SPHINCS+ post-quantum signing on ESP32-P4 based on the given information. All research questions remain unanswered, and no specific code, APIs, or documentation could be cited.

### 1. Does ESP-IDF expose SHA-256/512 hardware acceleration via a simple API?
Cannot be determined from the provided content. All links intended to provide information on ESP-IDF's SHA APIs (e.g., `esp_sha.h`, `sha.html`, `sha256_alt.h`) resulted in `[FETCH ERROR: HTTP Error 404: Not Found]`.

### 2. Which SPHINCS+ parameter set is practical on a microcontroller (sphincs-sha2-128s vs 256s)?
Cannot be determined from the provided content. The `pq-crystals/sphincsplus/README.md` link, which might have contained this information or pointers to it, resulted in `[FETCH ERROR: HTTP Error 404: Not Found]`.

### 3. Is there a Rust SPHINCS+ crate with configurable hash backend?
Cannot be determined from the provided content. The `RustCrypto/signatures/sphincsplus/README.md` link, which would likely describe the crate's features, resulted in `[FETCH ERROR: HTTP Error 404: Not Found]`.

### 4. What's the expected sign time on ESP32-P4 in pure software (extrapolate from Cortex-M benchmarks)?
Cannot be determined from the provided content. No benchmarks or performance data for SPHINCS+ on any platform, nor specific ESP32-P4 performance characteristics, were available due to the fetch errors. Therefore, no extrapolation is possible.

### 5. Any prior art: SPHINCS+ on ESP32 or similar Xtensa/RISC-V MCU?
Cannot be determined from the provided content. The `nicowillis/git-mirror/README.md` link, which might have referenced prior art, resulted in `[FETCH ERROR: HTTP Error 404: Not Found]`.

### Gaps / Follow-up
All research questions remain unanswered due to the complete unavailability of the source content. To proceed with this research, the following steps are necessary:
*   **Re-fetch or provide valid URLs for the source content.** Specifically, access to:
    *   ESP-IDF SHA documentation and headers (`esp_sha.h`, `sha.html`, `sha256_alt.h`)
    *   SPHINCS+ official documentation (`pq-crystals/sphincsplus/README.md`)
    *   RustCrypto SPHINCS+ crate documentation (`RustCrypto/signatures/sphincsplus/README.md`)
    *   Any relevant prior art or benchmark information (`nicowillis/git-mirror/README.md`)

### Relevant Code/API Snippets
None could be extracted as all source content failed to load.