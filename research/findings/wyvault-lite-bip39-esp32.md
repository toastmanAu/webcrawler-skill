# Research: wyvault-lite-bip39-esp32

**Date:** 2026-03-08  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/trezor/trezor-crypto/master/README.md, https://raw.githubusercontent.com/trezor/trezor-crypto/master/bip39.c, https://raw.githubusercontent.com/trezor/trezor-crypto/master/bip32.c, https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/security/flash-encryption.html, https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/security/secure-boot-v2.html, https://raw.githubusercontent.com/Blockstream/Jade/master/README.md

---

Date: 2026-03-08

## Summary

This research note analyzes the feasibility and implementation details for BIP39/BIP32 on ESP32-S3 for the WyVault Lite project, leveraging `trezor-crypto` as a primary candidate library. It confirms `trezor-crypto`'s suitability for mnemonic generation, validation, and HD derivation, noting its embedded optimization. The analysis also covers critical ESP32-S3 security features: flash encryption and secure boot v2, detailing their enablement, eFuse involvement, and irreversible characteristics. Key storage options like eFuses and NVS encryption are discussed, with eFuses identified as the fundamental secure storage mechanism. Information regarding ESP32-S3's hardware RNG quality and alternative open-source hardware wallet projects (beyond Jade) was not found in the provided content.

## (1) Best C library for BIP39 mnemonic generation + validation on ESP-IDF — trezor-crypto? bip39-c? What are the RAM/flash requirements?

`trezor-crypto` is a suitable C library for BIP39 mnemonic generation and validation on ESP-IDF. Its `README.md` explicitly lists "BIP39 Mnemonic code" as a feature. The `bip39.c` source file provides a comprehensive implementation, including functions such as `mnemonic_generate`, `mnemonic_from_data`, `mnemonic_to_entropy`, `mnemonic_check`, and `mnemonic_to_seed`.

The library is described as "Heavily optimized cryptography algorithms for embedded devices," indicating its design for resource-constrained environments. While specific RAM/flash requirements in KB/MB are not detailed in the provided content, the use of `static CONFIDENTIAL` buffers within `bip39.c` (e.g., `mnemo[24 * 10]` for mnemonic storage and `PBKDF2_HMAC_SHA512_CTX pctx` for PBKDF2 operations) suggests a design that minimizes dynamic memory allocation and reuses fixed-size buffers. Given that `secp256k1` signing (a component often found in such crypto suites) is already confirmed working on ESP32-P4 within Wyltek's existing projects, `trezor-crypto` is a strong candidate for ESP32-S3.

Information regarding `bip39-c` is not available in the provided content, so a comparison or assessment of its requirements cannot be made.

## (2) BIP32 HD derivation in C on ESP32 — trezor-crypto hdnode implementation feasibility, RAM usage per derivation step.

`trezor-crypto` provides a robust implementation for BIP32 HD derivation in C, making it feasible for ESP32. The `README.md` explicitly states "BIP32 Hierarchical Deterministic Wallets" as a feature. The `bip32.c` file includes core derivation functions such as `hdnode_from_seed`, `hdnode_private_ckd`, `hdnode_public_ckd`, and `hdnode_private_ckd_cardano`.

For RAM usage per derivation step, the `bip32.c` code utilizes `static CONFIDENTIAL` buffers for intermediate calculations. For example:
*   `hdnode_from_seed` uses `static CONFIDENTIAL uint8_t I[32 + 32];` and `static CONFIDENTIAL HMAC_SHA512_CTX ctx;`.
*   `hdnode_private_ckd` uses `static CONFIDENTIAL uint8_t I[32 + 32];`, `static CONFIDENTIAL uint8_t data[1 + 32 + 4];`, `static CONFIDENTIAL HMAC_SHA512_CTX ctx;`, and `bignum256 a, b;`.

While specific RAM consumption figures in KB/MB are not provided, the consistent use of static, confidential memory and the library's stated optimization for embedded devices indicate a design that minimizes dynamic memory allocation and reuses fixed-size buffers, which is suitable for resource-constrained environments like the ESP32.

## (3) ESP32-S3 hardware RNG quality — is esp_random() suitable for key generation entropy or does it need additional mixing?

The provided content does not contain any information regarding the quality of the ESP32-S3 hardware RNG or whether `esp_random()` is suitable for key generation entropy without additional mixing. Therefore, I cannot answer this question based on the given sources.

## (4) Flash encryption on ESP32-S3 — what does enabling it involve at firmware level? Does it affect OTA? Can it be enabled post-flashing or only at first boot?

Enabling flash encryption on ESP32-S3 involves a process that occurs primarily on the **first boot** after flashing plaintext firmware, as detailed in the ESP-IDF Programming Guide's "Flash Encryption" documentation.

**At the firmware level, enabling flash encryption involves:**
1.  **Initial State**: On the first power-on reset, all data in flash is un-encrypted (plaintext).
2.  **Bootloader Action**: The first stage (ROM) bootloader loads the second stage bootloader. The second stage bootloader, which must be compiled to support flash encryption, checks the `SPI_BOOT_CRYPT_CNT` eFuse.
3.  **Key Generation/Loading**: If `SPI_BOOT_CRYPT_CNT` is 0 (indicating encryption is not enabled), the second stage bootloader configures and enables the hardware flash encryption block. It then either generates a 256-bit or 512-bit AES key using the RNG module (if a valid key isn't already present in eFuses) and writes it into one or two `BLOCK_KEYN` eFuses. The `KEY_PURPOSE_N` eFuses are updated, and the `BLOCK_KEYN` eFuses are write- and read-protected, making the key inaccessible via software.
4.  **In-place Encryption**: The hardware flash encryption block encrypts the flash contents, including the second stage bootloader, application partitions, and any other partitions marked as encrypted. This in-place encryption can take up to a minute for large partitions.
5.  **eFuse Update**: The second stage bootloader sets the first available bit in `SPI_BOOT_CRYPT_CNT` (e.g., to 0b001) to mark the flash contents as encrypted.
6.  **Mode-Specific eFuse Settings**:
    *   In **Development Mode**, the `SPI_BOOT_CRYPT_CNT` eFuse bits are *not* write-protected, and the UART bootloader can re-flash encrypted binaries. Other eFuses like `DIS_DOWNLOAD_ICACHE`, `DIS_DOWNLOAD_DCACHE`, `HARD_DIS_JTAG`, and `DIS_LEGACY_SPI_BOOT` are also set.
    *   In **Release Mode**, all eFuses set in development mode are also set, along with `DIS_DOWNLOAD_MANUAL_ENCRYPT`, and the `SPI_BOOT_CRYPT_CNT` eFuse bits are write-protected.

**Does it affect OTA?**
Yes, flash encryption affects OTA updates. The documentation explicitly mentions "Updating Encrypted Flash OTA Updates" and implies support for it. The second stage bootloader is designed to handle re-flashing encrypted binaries, with specific behaviors configurable for development and production modes (e.g., "Enabling UART Bootloader Encryption/Decryption").

**Can it be enabled post-flashing or only at first boot?**
Flash encryption can only be enabled at the **first boot** after flashing plaintext firmware. The process of key generation and in-place encryption occurs during this initial power-on reset if the relevant eFuses are in their default (unencrypted) state.

## (5) Secure boot v2 on ESP32-S3 — signing key generation, efuse burning process, what makes it irreversible.

Secure Boot v2 on ESP32-S3 protects against unauthorized code execution by verifying RSA-PSS signatures of the second stage bootloader and application binaries.

**Signing Key Generation:**
*   RSA-PSS public keys (up to three) are generated and their digests are stored on the device in eFuses.
*   The corresponding RSA-PSS private keys are kept secret off-device and are never accessed by the ESP32-S3.
*   The ESP-IDF provides tools for this, such as `idf.py secure-boot-generate-key` or `espsecure.py generate_secure_boot_signing_key`.

**eFuse Burning Process:**
*   A digest of the RSA-3072 public key is stored in an eFuse.
*   On startup, the ROM code checks the "Secure Boot v2 bit in the eFuse." If enabled, it proceeds with signature verification.
*   The eFuse burning process for secure boot involves writing these public key digests to the eFuses, typically during manufacturing. Tools like `idf.py secure-boot-burn-key` or `espsecure.py burn_key` are used for this.

**What makes it irreversible:**
*   The process is irreversible because eFuses are One-Time Programmable (OTP) memory. Once the Secure Boot v2 eFuse bit is set and the public key digests are burned, the device is permanently configured to only execute signed code verified against those burned public key digests.
*   The ROM code, which is immutable, enforces this verification.
*   The ESP32-S3 also provides a facility to "permanently revoke individual public keys" via eFuse operations, further highlighting the irreversible nature of eFuse programming. Once a key is revoked, it cannot be used for verification again.

## (6) What is the minimum viable secure key storage on ESP32-S3 without a secure element — NVS encryption? eFuse key storage?

Based on the provided content, the minimum viable secure key storage on ESP32-S3 without a dedicated secure element is **eFuse key storage**.

*   **eFuse Key Storage**: The documentation for Flash Encryption explicitly states that the AES key used for flash encryption is stored in `BLOCK_KEYN` eFuses. Crucially, "The key cannot be accessed via software as the write and read protection bits for one or two BLOCK_KEYN eFuses are set." This provides a hardware-level mechanism to store sensitive keys securely and prevent software access. The eFuses also offer R/W access control via `WR_DIS` and `RD_DIS` registers, allowing for permanent write-protection. This makes eFuses suitable for storing root keys or master encryption keys directly.
*   **NVS Encryption**: While "NVS Key Partition" is listed as being encrypted by default when flash encryption is enabled, this means the NVS data is encrypted *at rest* using the key stored in the eFuses. NVS itself does not provide an independent, isolated secure key storage mechanism; it leverages the underlying flash encryption, which in turn relies on eFuse-stored keys. Therefore, eFuses represent the more fundamental and direct secure key storage mechanism for root keys on the ESP32-S3.

## (7) Any open source ESP32 hardware wallet projects to reference (not Jade — something simpler/more readable)?

The provided content only references Blockstream Jade as an open-source ESP32/ESP32-S3 hardware wallet project. The research question specifically asks for projects *other than* Jade that are simpler/more readable. Since no other such projects are mentioned in the provided source material, I cannot provide an answer to this question based solely on the given content.

## Gaps / Follow-up

1.  **RAM/Flash Requirements for `trezor-crypto`**: While `trezor-crypto` is described as optimized for embedded devices and uses static buffers, specific figures (e.g., KB of RAM, KB of flash) for its BIP39 and BIP32 implementations on ESP32-S3 are not provided. Further investigation into actual memory footprints would be beneficial.
2.  **ESP32-S3 Hardware RNG Quality**: The suitability of `esp_random()` for cryptographic key generation entropy and whether additional mixing is required remains unanswered. This is a critical security consideration for any hardware wallet.
3.  **Alternative Open-Source ESP32 Hardware Wallet Projects**: No projects other than Blockstream Jade were identified in the provided content. Research into simpler or more readable open-source ESP32 hardware wallet implementations would require external sources.
4.  **Detailed OTA Impact with Flash Encryption**: While "Updating Encrypted Flash OTA Updates" is mentioned as supported, the specifics of how the OTA process is affected (e.g., requirements for signed encrypted images, bootloader roles, potential complexities) are not fully detailed.

## Relevant Code/API Snippets

**From `trezor-crypto/bip39.c`:**
*   Mnemonic generation:
    ```c
    const char *mnemonic_generate(int strength);
    const char *mnemonic_from_data(const uint8_t *data, int len);
    ```
*   Mnemonic validation:
    ```c
    int mnemonic_check(const char *mnemonic);
    int mnemonic_to_entropy(const char *mnemonic, uint8_t *entropy);
    ```
*   Seed derivation:
    ```c
    void mnemonic_to_seed(const char *mnemonic, const char *passphrase, uint8_t seed[512 / 8], void (*progress_callback)(uint32_t current, uint32_t total));
    ```
*   Internal memory usage examples:
    ```c
    static CONFIDENTIAL char mnemo[24 * 10];
    static CONFIDENTIAL PBKDF2_HMAC_SHA512_CTX pctx;
    ```

**From `trezor-crypto/bip32.c`:**
*   HDNode structure and initialization:
    ```c
    int hdnode_from_seed(const uint8_t *seed, int seed_len, const char *curve, HDNode *out);
    int hdnode_from_xprv(uint32_t depth, uint32_t child_num, const uint8_t *chain_code, const uint8_t *private_key, const char *curve, HDNode *out);
    ```
*   Child key derivation:
    ```c
    int hdnode_private_ckd(HDNode *inout, uint32_t i);
    int hdnode_public_ckd(HDNode *inout, uint32_t i);
    ```
*   Internal memory usage examples:
    ```c
    static CONFIDENTIAL uint8_t I[32 + 32]; // Used in hdnode_from_seed, hdnode_private_ckd
    static CONFIDENTIAL HMAC_SHA512_CTX ctx; // Used in hdnode_from_seed, hdnode_private_ckd
    static CONFIDENTIAL uint8_t data[1 + 32 + 4]; // Used in hdnode_private_ckd
    ```

**From ESP-IDF Flash Encryption Documentation:**
*   Relevant eFuses: `BLOCK_KEYN`, `KEY_PURPOSE_N`, `DIS_DOWNLOAD_MANUAL_ENCRYPT`, `SPI_BOOT_CRYPT_CNT`.
*   eFuse API example: `esp_efuse_read_field_bit (ESP_EFUSE_DISABLE_DL_ENCRYPT)`.

**From ESP-IDF Secure Boot v2 Documentation:**
*   Key generation tools: `idf.py secure-boot-generate-key`, `espsecure.py generate_secure_boot_signing_key`.
*   eFuse burning tools: `idf.py secure-boot-burn-key`, `espsecure.py burn_key`.