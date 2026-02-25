/*
 * CKB LoRa Gateway — ESP32-C6 + SX1276
 * ======================================
 * Listens for CKB LoRa protocol queries from end-devices (e.g. T-Impulse)
 * and responds with data from the local CKB light client.
 *
 * Hardware:
 *   ESP32-C6 dev board + SX1276 module
 *   SX1276 wiring:
 *     SCK  → GPIO 6
 *     MOSI → GPIO 7
 *     MISO → GPIO 2
 *     CS   → GPIO 10
 *     DIO0 → GPIO 3
 *     RST  → GPIO 4
 *     3.3V → 3.3V
 *     GND  → GND
 *
 * This is the gateway side — builds with ESP-IDF (main project)
 * or Arduino framework. This file is Arduino-style for quick prototyping.
 *
 * In production, the CKB data comes from ckb-light-esp running
 * in a FreeRTOS task. For this prototype, we use hardcoded/mock
 * values to test the LoRa protocol layer first.
 *
 * Platform: Arduino-ESP32 (ESP32-C6 support in arduino-esp32 v3.x)
 * OR compile as ESP-IDF component (main.c equivalent)
 */

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>

/* ─── SX1276 pins on ESP32-C6 ───────────────────────────────────── */
#define LORA_SCK    6
#define LORA_MISO   2
#define LORA_MOSI   7
#define LORA_CS     10
#define LORA_RST    4
#define LORA_DIO0   3

/* ─── LoRa config — MUST match T-Impulse exactly ───────────────── */
#define LORA_FREQ       915E6
#define LORA_BW         125E3
#define LORA_SF         7
#define LORA_CR         5
#define LORA_SYNC_WORD  0xCB
#define LORA_TX_POWER   17
#define LORA_PREAMBLE   8

/* ─── Protocol constants (same as client) ───────────────────────── */
#define MAGIC           0xCB
#define PROTO_VERSION   0x01

#define MSG_GET_HEIGHT  0x01
#define MSG_GET_TIP     0x02
#define MSG_VERIFY_TX   0x03
#define MSG_HEIGHT_RSP  0x81
#define MSG_TIP_RSP     0x82
#define MSG_VERIFY_RSP  0x83
#define MSG_ERROR       0xE0

#define PKT_MAX         128
uint8_t rxbuf[PKT_MAX];
uint8_t txbuf[PKT_MAX];

/* ─── CRC32 ─────────────────────────────────────────────────────── */
static uint32_t crc32_byte(uint32_t crc, uint8_t b) {
    crc ^= b;
    for (int i = 0; i < 8; i++)
        crc = (crc >> 1) ^ (0xEDB88320 & -(crc & 1));
    return crc;
}
static uint32_t crc32(const uint8_t *data, size_t len) {
    uint32_t crc = 0xFFFFFFFF;
    for (size_t i = 0; i < len; i++)
        crc = crc32_byte(crc, data[i]);
    return crc ^ 0xFFFFFFFF;
}

/* ─── Mock CKB state (replace with real ckb-light-esp data) ─────── */
/* In production these come from the CKB light client task via a mutex */
static uint64_t g_block_height = 18750000ULL;
static uint8_t  g_tip_hash[32] = {
    0x1a,0x2b,0x3c,0x4d,0x5e,0x6f,0x70,0x81,
    0x92,0xa3,0xb4,0xc5,0xd6,0xe7,0xf8,0x09,
    0x1a,0x2b,0x3c,0x4d,0x5e,0x6f,0x70,0x81,
    0x92,0xa3,0xb4,0xc5,0xd6,0xe7,0xf8,0x09,
};
static uint8_t  g_total_diff[32] = { 0 }; /* placeholder */

/* ─── Build and send response ────────────────────────────────────── */
static void send_response(uint8_t type, uint8_t seq,
                          const uint8_t *payload, uint8_t plen) {
    txbuf[0] = MAGIC;
    txbuf[1] = PROTO_VERSION;
    txbuf[2] = type;
    txbuf[3] = seq;             /* echo seq */
    txbuf[4] = plen;
    txbuf[5] = 0;
    txbuf[6] = 0;
    txbuf[7] = 0;

    if (payload && plen > 0)
        memcpy(&txbuf[8], payload, plen);

    uint32_t crc = crc32(txbuf, 8 + plen);
    txbuf[8+plen+0] = crc & 0xFF;
    txbuf[8+plen+1] = (crc >> 8) & 0xFF;
    txbuf[8+plen+2] = (crc >> 16) & 0xFF;
    txbuf[8+plen+3] = (crc >> 24) & 0xFF;

    /* Small delay before TX to let client settle into RX */
    delay(50);

    LoRa.beginPacket();
    LoRa.write(txbuf, 8 + plen + 4);
    LoRa.endPacket();

    Serial.printf("[TX] type=0x%02X seq=%d plen=%d\n", type, seq, plen);
}

/* ─── Handle incoming request ────────────────────────────────────── */
static void handle_request(uint8_t *pkt, int pkt_len) {
    if (pkt_len < 12) return;  /* minimum: 8 header + 0 payload + 4 CRC */

    if (pkt[0] != MAGIC || pkt[1] != PROTO_VERSION) {
        Serial.println("[RX] bad magic, ignoring");
        return;
    }

    uint8_t type = pkt[2];
    uint8_t seq  = pkt[3];
    uint8_t plen = pkt[4];

    /* Validate CRC */
    uint32_t rx_crc = (uint32_t)pkt[8+plen]
                    | ((uint32_t)pkt[8+plen+1] << 8)
                    | ((uint32_t)pkt[8+plen+2] << 16)
                    | ((uint32_t)pkt[8+plen+3] << 24);
    if (rx_crc != crc32(pkt, 8 + plen)) {
        Serial.println("[RX] CRC fail, ignoring");
        return;
    }

    int rssi = LoRa.packetRssi();
    float snr = LoRa.packetSnr();
    Serial.printf("[RX] type=0x%02X seq=%d RSSI=%d SNR=%.1f\n",
                 type, seq, rssi, snr);

    switch (type) {

    case MSG_GET_HEIGHT: {
        /* Response: height[8 LE] + tip_hash[32] = 40 bytes */
        uint8_t payload[40];
        payload[0] = g_block_height & 0xFF;
        payload[1] = (g_block_height >> 8) & 0xFF;
        payload[2] = (g_block_height >> 16) & 0xFF;
        payload[3] = (g_block_height >> 24) & 0xFF;
        payload[4] = (g_block_height >> 32) & 0xFF;
        payload[5] = (g_block_height >> 40) & 0xFF;
        payload[6] = (g_block_height >> 48) & 0xFF;
        payload[7] = (g_block_height >> 56) & 0xFF;
        memcpy(&payload[8], g_tip_hash, 32);
        send_response(MSG_HEIGHT_RSP, seq, payload, 40);
        Serial.printf("  → Sent height %llu\n",
                     (unsigned long long)g_block_height);
        break;
    }

    case MSG_GET_TIP: {
        /* Response: tip_hash[32] + total_diff[32] = 64 bytes */
        uint8_t payload[64];
        memcpy(&payload[0],  g_tip_hash,   32);
        memcpy(&payload[32], g_total_diff, 32);
        send_response(MSG_TIP_RSP, seq, payload, 64);
        Serial.println("  → Sent chain tip");
        break;
    }

    case MSG_VERIFY_TX: {
        if (plen < 32) {
            uint8_t err = 0x01;  /* bad request */
            send_response(MSG_ERROR, seq, &err, 1);
            return;
        }
        /*
         * TODO: look up tx_hash in CKB light client tx cache
         * For now: mock response — confirmed in block height-1
         */
        uint8_t payload[9];
        payload[0] = 0x01;  /* confirmed = true */
        uint64_t blk = g_block_height - 1;
        payload[1] = blk & 0xFF;
        payload[2] = (blk >> 8) & 0xFF;
        payload[3] = (blk >> 16) & 0xFF;
        payload[4] = (blk >> 24) & 0xFF;
        payload[5] = (blk >> 32) & 0xFF;
        payload[6] = (blk >> 40) & 0xFF;
        payload[7] = (blk >> 48) & 0xFF;
        payload[8] = (blk >> 56) & 0xFF;

        Serial.print("  Verifying tx: 0x");
        for (int i = 0; i < 8; i++)
            Serial.printf("%02x", pkt[8+i]);
        Serial.println("...");

        send_response(MSG_VERIFY_RSP, seq, payload, 9);
        break;
    }

    default:
        Serial.printf("  Unknown type 0x%02X\n", type);
        uint8_t err = 0x02;  /* unknown command */
        send_response(MSG_ERROR, seq, &err, 1);
        break;
    }
}

/* ─── Simulate CKB light client updates (mock) ──────────────────── */
/* In production: FreeRTOS task running ckb-light-esp updates these */
static void update_mock_chain() {
    static uint32_t last_update = 0;
    if (millis() - last_update > 6000) {  /* CKB ~6s block time */
        g_block_height++;
        /* Increment first byte of tip hash to simulate new block */
        g_tip_hash[0]++;
        last_update = millis();
    }
}

/* ─── Setup ─────────────────────────────────────────────────────── */
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\nCKB LoRa Gateway — ESP32-C6 + SX1276");
    Serial.println("======================================");

    SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_CS);
    LoRa.setPins(LORA_CS, LORA_RST, LORA_DIO0);

    Serial.print("Initialising LoRa...");
    if (!LoRa.begin(LORA_FREQ)) {
        Serial.println(" FAILED. Check SX1276 version fix (0x12 → 0x12||0x13)");
        while (1) delay(1000);
    }

    LoRa.setSignalBandwidth(LORA_BW);
    LoRa.setSpreadingFactor(LORA_SF);
    LoRa.setCodingRate4(LORA_CR);
    LoRa.setSyncWord(LORA_SYNC_WORD);
    LoRa.setTxPower(LORA_TX_POWER);
    LoRa.setPreambleLength(LORA_PREAMBLE);
    LoRa.enableCrc();

    Serial.println(" OK");
    Serial.printf("Listening on %.0fMHz SF%d BW%.0fkHz sync=0x%02X\n",
                  LORA_FREQ/1e6, LORA_SF, LORA_BW/1e3, LORA_SYNC_WORD);
    Serial.printf("Mock chain height: %llu\n",
                 (unsigned long long)g_block_height);
}

/* ─── Loop ──────────────────────────────────────────────────────── */
void loop() {
    update_mock_chain();

    int pkt_size = LoRa.parsePacket();
    if (pkt_size > 0 && pkt_size <= PKT_MAX) {
        int i = 0;
        while (LoRa.available())
            rxbuf[i++] = LoRa.read();
        handle_request(rxbuf, i);
    }
}
