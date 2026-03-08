# WyVault — ESP32-P4 CKB Hardware Wallet

## Summary
A CKB hardware wallet on ESP32-P4 with hybrid classical + post-quantum key architecture. Secp256k1 for current CKB compatibility, SPHINCS+ for quantum resistance.

## Architecture
- **Secp256k1**: Standard CKB key derivation (BIP-32/BIP-44), transaction signing, address generation
- **SPHINCS+-128f**: Post-quantum signature scheme, ~200ms signing on P4
- **Hybrid model**: Ephemeral session key in RAM + permanent key in eFuse (one-time burn)
- **USB HID**: Ledger APDU protocol over HID — compatible with existing CKB tooling
- **Display**: ST7789 480x320 SPI — transaction review UI before signing

## Performance on ESP32-P4
- secp256k1 sign: ~5ms
- SPHINCS+-128f sign: ~200ms
- Auto-sweep end-to-end: ~42s

## Key Design Decisions
- eFuse key burn is one-way — generates key on-device, never exported
- SPHINCS+ adds quantum resistance without breaking CKB compatibility (classical sig still included)
- Ledger APDU protocol chosen for ecosystem compatibility
- GM861S barcode scanner on UART for QR address input (no manual typing)

## Hardware
- ESP32-P4 4.3" IPS dev board (ordered)
- W5500 Ethernet for wired node connectivity
- ST7789 480×320 SPI display (SPI3)
- GM861S barcode scanner (UART)

## Repo
https://github.com/toastmanAu/WyVault
