/*
 * ckb_bech32.h — CKB address bech32/bech32m decoder
 * ===================================================
 * Decodes CKB mainnet/testnet addresses into lock script components:
 *   - code_hash (32 bytes)
 *   - hash_type ("type" | "data" | "data1" | "data2")
 *   - args (variable length, hex string)
 *
 * Supports:
 *   - CKB2021 full address (bech32m): ckb1q... / ckt1q...
 *   - Legacy short address (bech32):  ckb1q... / ckt1q...  (payload[0] == 0x01)
 *   - Legacy full address (bech32):   ckb1q... / ckt1q...  (payload[0] == 0x02)
 *
 * Usage:
 *   CKBLockScript ls;
 *   if (ckb_decode_address("ckb1qzda0cr08m85hc8...", &ls)) {
 *       // ls.code_hash_hex, ls.hash_type, ls.args_hex populated
 *   }
 *
 * No dynamic allocation. All buffers fixed-size (safe for ESP32).
 */

#pragma once
#include <stdint.h>
#include <string.h>
#include <stdbool.h>
#include <Arduino.h>

// ── bech32 charset ────────────────────────────────────────────────────────────
static const char BECH32_CHARSET[] = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

static int bech32_char_val(char c) {
    for (int i = 0; i < 32; i++)
        if (BECH32_CHARSET[i] == c) return i;
    return -1;
}

// ── bech32 polymod ────────────────────────────────────────────────────────────
static uint32_t bech32_polymod(const uint8_t* values, size_t len) {
    static const uint32_t GEN[] = {
        0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3
    };
    uint32_t chk = 1;
    for (size_t i = 0; i < len; i++) {
        uint8_t top = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ values[i];
        for (int j = 0; j < 5; j++)
            if ((top >> j) & 1) chk ^= GEN[j];
    }
    return chk;
}

// Expand HRP for checksum
static void bech32_hrp_expand(const char* hrp, size_t hrp_len,
                               uint8_t* out, size_t* out_len) {
    *out_len = 0;
    for (size_t i = 0; i < hrp_len; i++)
        out[(*out_len)++] = (uint8_t)(hrp[i] >> 5);
    out[(*out_len)++] = 0;
    for (size_t i = 0; i < hrp_len; i++)
        out[(*out_len)++] = (uint8_t)(hrp[i] & 0x1f);
}

typedef enum { BECH32_BECH32, BECH32_BECH32M } Bech32Enc;

static bool bech32_verify_checksum(const char* hrp, size_t hrp_len,
                                    const uint8_t* data, size_t data_len,
                                    Bech32Enc* enc_out) {
    uint8_t buf[256];
    size_t buf_len;
    bech32_hrp_expand(hrp, hrp_len, buf, &buf_len);
    if (buf_len + data_len > sizeof(buf)) return false;
    memcpy(buf + buf_len, data, data_len);
    buf_len += data_len;
    uint32_t val = bech32_polymod(buf, buf_len);
    if (val == 1)          { *enc_out = BECH32_BECH32;   return true; }
    if (val == 0x2bc830a3) { *enc_out = BECH32_BECH32M;  return true; }
    return false;
}

// Convert 5-bit groups to 8-bit bytes
static bool convert_bits(const uint8_t* in, size_t in_len,
                          uint8_t* out, size_t* out_len,
                          int from_bits, int to_bits, bool pad) {
    int acc = 0, bits = 0;
    *out_len = 0;
    int maxv = (1 << to_bits) - 1;
    for (size_t i = 0; i < in_len; i++) {
        acc = (acc << from_bits) | in[i];
        bits += from_bits;
        while (bits >= to_bits) {
            bits -= to_bits;
            out[(*out_len)++] = (acc >> bits) & maxv;
        }
    }
    if (pad) {
        if (bits) out[(*out_len)++] = (acc << (to_bits - bits)) & maxv;
    } else if (bits >= from_bits || ((acc << (to_bits - bits)) & maxv)) {
        return false;
    }
    return true;
}

// ── CKB lock script result ────────────────────────────────────────────────────
#define CKB_ARGS_HEX_MAX  130   // 64 bytes args max → 128 hex chars + null
struct CKBLockScript {
    char     code_hash_hex[65]; // 32 bytes → 64 hex chars + null
    char     hash_type[8];      // "type", "data", "data1", "data2"
    char     args_hex[CKB_ARGS_HEX_MAX];
    bool     is_mainnet;
};

static void to_hex(const uint8_t* bytes, size_t len, char* out) {
    static const char* HEX = "0123456789abcdef";
    for (size_t i = 0; i < len; i++) {
        out[i*2]   = HEX[bytes[i] >> 4];
        out[i*2+1] = HEX[bytes[i] & 0xf];
    }
    out[len*2] = 0;
}

// ── Main decode function ───────────────────────────────────────────────────────
bool ckb_decode_address(const char* addr_cstr, CKBLockScript* out) {
    memset(out, 0, sizeof(*out));
    String addr = String(addr_cstr);
    addr.toLowerCase();

    // Determine network
    if (addr.startsWith("ckb1"))      out->is_mainnet = true;
    else if (addr.startsWith("ckt1")) out->is_mainnet = false;
    else return false;

    // Split at separator '1' (last occurrence)
    int sep = addr.lastIndexOf('1');
    if (sep < 1 || sep + 7 > (int)addr.length()) return false;

    String hrp_str = addr.substring(0, sep);
    String data_str = addr.substring(sep + 1);

    // Decode data chars to 5-bit values
    uint8_t data5[256];
    size_t data5_len = data_str.length();
    if (data5_len > sizeof(data5)) return false;
    for (size_t i = 0; i < data5_len; i++) {
        int v = bech32_char_val(data_str[i]);
        if (v < 0) return false;
        data5[i] = (uint8_t)v;
    }

    // Verify checksum (last 6 data5 values)
    Bech32Enc enc;
    const char* hrp = hrp_str.c_str();
    size_t hrp_len = hrp_str.length();
    if (!bech32_verify_checksum(hrp, hrp_len, data5, data5_len, &enc)) return false;

    // Strip checksum (last 6 5-bit values)
    size_t payload5_len = data5_len - 6;

    // Convert 5-bit payload to bytes
    uint8_t payload[256];
    size_t  payload_len;
    if (!convert_bits(data5, payload5_len, payload, &payload_len, 5, 8, false)) return false;

    // ── Parse payload by format type ─────────────────────────────────────────
    if (enc == BECH32_BECH32M) {
        // CKB2021 full address: [0x00][code_hash 32B][hash_type 1B][args ...]
        if (payload_len < 34) return false;
        if (payload[0] != 0x00) return false;
        to_hex(payload + 1, 32, out->code_hash_hex);
        uint8_t ht = payload[33];
        switch (ht) {
            case 0x00: strcpy(out->hash_type, "data");  break;
            case 0x01: strcpy(out->hash_type, "type");  break;
            case 0x02: strcpy(out->hash_type, "data1"); break;
            case 0x04: strcpy(out->hash_type, "data2"); break;
            default:   strcpy(out->hash_type, "type");  break;
        }
        size_t args_len = payload_len - 34;
        if (args_len * 2 + 1 > CKB_ARGS_HEX_MAX) return false;
        to_hex(payload + 34, args_len, out->args_hex);

    } else {
        // Legacy bech32 address
        if (payload_len < 1) return false;
        uint8_t fmt = payload[0];

        if (fmt == 0x01) {
            // Short address: [0x01][code_hash_index 1B][args ...]
            // Map code_hash_index → well-known code hashes
            // 0x00 = secp256k1/blake160 (SECP256K1_BLAKE160_SIGHASH_ALL)
            // 0x01 = secp256k1/multisig
            // 0x02 = anyone-can-pay (ACP)
            static const char* KNOWN_HASHES[] = {
                "9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                "5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
                "d369597ff47f29febb9b5e3a9a7a35405db54d1b6f4c29f69b4de024eb1b3ff6"
            };
            if (payload[1] >= 3) return false;
            strcpy(out->code_hash_hex, KNOWN_HASHES[payload[1]]);
            strcpy(out->hash_type, "type");
            size_t args_len = payload_len - 2;
            if (args_len * 2 + 1 > CKB_ARGS_HEX_MAX) return false;
            to_hex(payload + 2, args_len, out->args_hex);

        } else if (fmt == 0x02) {
            // Full address (legacy): [0x02][code_hash 32B][args ...]
            if (payload_len < 33) return false;
            to_hex(payload + 1, 32, out->code_hash_hex);
            strcpy(out->hash_type, "data");
            size_t args_len = payload_len - 33;
            if (args_len * 2 + 1 > CKB_ARGS_HEX_MAX) return false;
            to_hex(payload + 33, args_len, out->args_hex);

        } else if (fmt == 0x04) {
            // Full address (type): [0x04][code_hash 32B][args ...]
            if (payload_len < 33) return false;
            to_hex(payload + 1, 32, out->code_hash_hex);
            strcpy(out->hash_type, "type");
            size_t args_len = payload_len - 33;
            if (args_len * 2 + 1 > CKB_ARGS_HEX_MAX) return false;
            to_hex(payload + 33, args_len, out->args_hex);

        } else {
            return false;
        }
    }
    return true;
}

// ── Build RPC JSON body for get_cells_capacity ────────────────────────────────
// Returns false if lock script is incomplete
bool ckb_build_capacity_rpc(const CKBLockScript* ls, char* out, size_t out_size) {
    if (strlen(ls->code_hash_hex) != 64) return false;
    snprintf(out, out_size,
        "{\"jsonrpc\":\"2.0\",\"id\":1,"
        "\"method\":\"get_cells_capacity\","
        "\"params\":[{\"script\":{"
        "\"code_hash\":\"0x%s\","
        "\"hash_type\":\"%s\","
        "\"args\":\"0x%s\""
        "},\"script_type\":\"lock\"}]}",
        ls->code_hash_hex,
        ls->hash_type,
        ls->args_hex
    );
    return true;
}

// ── Format shannons → CKB string (e.g. "1234.56789012") ──────────────────────
// capacity is hex string like "0x174876e800"
void ckb_format_capacity(const char* cap_hex, char* out, size_t out_size) {
    if (!cap_hex || cap_hex[0] == 0) { snprintf(out, out_size, "0.0"); return; }
    const char* p = (strncmp(cap_hex, "0x", 2) == 0) ? cap_hex + 2 : cap_hex;
    uint64_t shannons = (uint64_t)strtoull(p, nullptr, 16);
    uint64_t ckb      = shannons / 100000000ULL;
    uint32_t frac     = (uint32_t)(shannons % 100000000ULL);
    if (frac == 0) {
        snprintf(out, out_size, "%llu", (unsigned long long)ckb);
    } else {
        char frac_str[12];
        snprintf(frac_str, sizeof(frac_str), "%08u", frac);
        // Trim trailing zeros
        int end = 7;
        while (end > 0 && frac_str[end] == '0') frac_str[end--] = 0;
        snprintf(out, out_size, "%llu.%s", (unsigned long long)ckb, frac_str);
    }
}
