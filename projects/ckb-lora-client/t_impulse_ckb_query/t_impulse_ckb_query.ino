/*
 * CKB LoRa Query Client — LilyGO T-Impulse
 * =========================================
 * Wristband end-device that queries a CKB-enabled LoRa gateway
 * for the current block height and chain tip hash.
 *
 * Hardware:
 *   LilyGO T-Impulse (STM32L073RZ + S76G = SX1276 @ 915MHz)
 *
 * Protocol (our CKB LoRa protocol v1):
 *   Device → Gateway:  REQUEST packet
 *   Gateway → Device:  RESPONSE packet
 *
 * Packet format:
 *   [1]  magic     = 0xCB         (CKB identifier)
 *   [1]  version   = 0x01
 *   [1]  type      (see MSG_TYPE_*)
 *   [1]  seq       (sequence number, echoed in response)
 *   [4]  payload_len (LE uint32)
 *   [N]  payload
 *   [4]  crc32     (of header + payload)
 *
 * Request types:
 *   0x01  GET_BLOCK_HEIGHT   payload: none
 *   0x02  GET_CHAIN_TIP      payload: none
 *   0x03  VERIFY_TX          payload: tx_hash[32]
 *
 * Response types:
 *   0x81  BLOCK_HEIGHT_RSP   payload: height[8] + tip_hash[32]
 *   0x82  CHAIN_TIP_RSP      payload: tip_hash[32] + total_diff[32]
 *   0x83  VERIFY_TX_RSP      payload: confirmed[1] + block_height[8]
 *   0xE0  ERROR              payload: error_code[1]
 *
 * Platform: PlatformIO + STM32duino
 * Board: Nucleo-L073RZ (as per LilyGO T-Impulse docs)
 *
 * Dependencies (copy to ~/Arduino/libraries/ or platformio.ini):
 *   - arduino-LoRa by sandeepmistry  (with version 0x13 fix — see below)
 *
 * IMPORTANT: SX1276 in S76G module reports version 0x13, not 0x12.
 * Apply the fix in LoRa.cpp REG_VERSION check (see README Q&A).
 */

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>

/* ─── T-Impulse S76G SX1276 pin definitions ─────────────────────── */
#define LORA_SCK    PB3
#define LORA_MISO   PB4
#define LORA_MOSI   PB5
#define LORA_CS     PA15
#define LORA_RST    PC0
#define LORA_DIO0   PC13    /* interrupt — RX done / TX done */

/* ─── LoRa config ──────────────────────────────────────────────────
 * Match these EXACTLY on the gateway side.
 * AU915 band (change to 868E6 for EU868)
 */
#define LORA_FREQ       915E6
#define LORA_BW         125E3
#define LORA_SF         7           /* SF7 = fastest, ~5km range */
#define LORA_CR         5           /* Coding rate 4/5 */
#define LORA_SYNC_WORD  0xCB        /* CKB network sync word */
#define LORA_TX_POWER   17          /* dBm, max for SX1276 without PA_BOOST */
#define LORA_PREAMBLE   8

/* ─── Protocol constants ────────────────────────────────────────── */
#define MAGIC           0xCB
#define PROTO_VERSION   0x01

#define MSG_GET_HEIGHT  0x01
#define MSG_GET_TIP     0x02
#define MSG_VERIFY_TX   0x03
#define MSG_HEIGHT_RSP  0x81
#define MSG_TIP_RSP     0x82
#define MSG_VERIFY_RSP  0x83
#define MSG_ERROR       0xE0

#define TIMEOUT_MS      5000        /* wait up to 5s for response */
#define MAX_RETRIES     3

/* ─── Packet buffer ─────────────────────────────────────────────── */
#define PKT_MAX         64
uint8_t txbuf[PKT_MAX];
uint8_t rxbuf[PKT_MAX];

static uint8_t seq = 0;

/* ─── CRC32 (simple table-free implementation) ──────────────────── */
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

/* ─── Build a request packet ────────────────────────────────────── */
static size_t build_packet(uint8_t type, const uint8_t *payload,
                           uint8_t payload_len) {
    txbuf[0] = MAGIC;
    txbuf[1] = PROTO_VERSION;
    txbuf[2] = type;
    txbuf[3] = ++seq;
    txbuf[4] = payload_len;         /* payload_len fits in 1 byte for LoRa */
    txbuf[5] = 0;
    txbuf[6] = 0;
    txbuf[7] = 0;

    if (payload && payload_len > 0)
        memcpy(&txbuf[8], payload, payload_len);

    /* CRC over header + payload */
    uint32_t crc = crc32(txbuf, 8 + payload_len);
    txbuf[8 + payload_len + 0] = crc & 0xFF;
    txbuf[8 + payload_len + 1] = (crc >> 8) & 0xFF;
    txbuf[8 + payload_len + 2] = (crc >> 16) & 0xFF;
    txbuf[8 + payload_len + 3] = (crc >> 24) & 0xFF;

    return 8 + payload_len + 4;
}

/* ─── Send packet and wait for response ─────────────────────────── */
static int send_and_wait(uint8_t type, const uint8_t *payload,
                         uint8_t payload_len) {
    size_t pkt_len = build_packet(type, payload, payload_len);

    LoRa.beginPacket();
    LoRa.write(txbuf, pkt_len);
    LoRa.endPacket();   /* blocking send */

    Serial.printf("[TX] type=0x%02X seq=%d len=%d\n", type, seq, pkt_len);

    /* Wait for response */
    uint32_t t0 = millis();
    while (millis() - t0 < TIMEOUT_MS) {
        int rssi;
        int pkt = LoRa.parsePacket();
        if (pkt > 0 && pkt <= PKT_MAX) {
            int i = 0;
            while (LoRa.available())
                rxbuf[i++] = LoRa.read();

            rssi = LoRa.packetRssi();

            /* Validate magic + version + seq echo */
            if (rxbuf[0] != MAGIC || rxbuf[1] != PROTO_VERSION) {
                Serial.println("[RX] bad magic/version, ignoring");
                continue;
            }
            if (rxbuf[3] != seq) {
                Serial.println("[RX] seq mismatch, ignoring");
                continue;
            }

            /* Validate CRC */
            uint8_t plen = rxbuf[4];
            uint32_t rx_crc = (uint32_t)rxbuf[8+plen]
                            | ((uint32_t)rxbuf[8+plen+1] << 8)
                            | ((uint32_t)rxbuf[8+plen+2] << 16)
                            | ((uint32_t)rxbuf[8+plen+3] << 24);
            uint32_t calc_crc = crc32(rxbuf, 8 + plen);
            if (rx_crc != calc_crc) {
                Serial.println("[RX] CRC mismatch, ignoring");
                continue;
            }

            Serial.printf("[RX] type=0x%02X len=%d RSSI=%d\n",
                         rxbuf[2], pkt, rssi);
            return rxbuf[2];  /* return response type */
        }
    }
    return -1;  /* timeout */
}

/* ─── Query: GET_BLOCK_HEIGHT ───────────────────────────────────── */
static void query_block_height() {
    Serial.println("\n--- Querying CKB block height ---");

    for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        Serial.printf("Attempt %d/%d\n", attempt, MAX_RETRIES);

        int rsp = send_and_wait(MSG_GET_HEIGHT, nullptr, 0);

        if (rsp == MSG_HEIGHT_RSP) {
            /* payload: height[8 LE] + tip_hash[32] */
            uint8_t *p = &rxbuf[8];
            uint64_t height = (uint64_t)p[0]
                            | ((uint64_t)p[1] << 8)
                            | ((uint64_t)p[2] << 16)
                            | ((uint64_t)p[3] << 24)
                            | ((uint64_t)p[4] << 32)
                            | ((uint64_t)p[5] << 40)
                            | ((uint64_t)p[6] << 48)
                            | ((uint64_t)p[7] << 56);

            Serial.printf("✓ Block height: %llu\n", (unsigned long long)height);
            Serial.print("  Tip hash: 0x");
            for (int i = 0; i < 8; i++)  /* first 8 bytes for brevity */
                Serial.printf("%02x", p[8 + i]);
            Serial.println("...");
            return;

        } else if (rsp == MSG_ERROR) {
            Serial.printf("Gateway error: 0x%02X\n", rxbuf[8]);
        } else if (rsp < 0) {
            Serial.println("Timeout");
        }

        delay(500);
    }
    Serial.println("Failed after retries");
}

/* ─── Query: GET_CHAIN_TIP ──────────────────────────────────────── */
static void query_chain_tip() {
    Serial.println("\n--- Querying CKB chain tip ---");

    int rsp = send_and_wait(MSG_GET_TIP, nullptr, 0);

    if (rsp == MSG_TIP_RSP) {
        uint8_t *p = &rxbuf[8];
        Serial.print("✓ Tip hash:       0x");
        for (int i = 0; i < 32; i++) Serial.printf("%02x", p[i]);
        Serial.println();
        Serial.print("  Total diff:     0x");
        for (int i = 0; i < 8; i++) Serial.printf("%02x", p[32 + i]);  /* first 8 bytes */
        Serial.println("...");
    } else {
        Serial.println("Failed or timeout");
    }
}

/* ─── Query: VERIFY_TX ──────────────────────────────────────────── */
static void verify_tx(const uint8_t tx_hash[32]) {
    Serial.println("\n--- Verifying CKB transaction ---");
    Serial.print("  TX hash: 0x");
    for (int i = 0; i < 8; i++) Serial.printf("%02x", tx_hash[i]);
    Serial.println("...");

    int rsp = send_and_wait(MSG_VERIFY_TX, tx_hash, 32);

    if (rsp == MSG_VERIFY_RSP) {
        uint8_t confirmed = rxbuf[8];
        uint64_t blk = (uint64_t)rxbuf[9]
                     | ((uint64_t)rxbuf[10] << 8)
                     | ((uint64_t)rxbuf[11] << 16)
                     | ((uint64_t)rxbuf[12] << 24);
        if (confirmed) {
            Serial.printf("✓ CONFIRMED in block %llu\n",
                         (unsigned long long)blk);
        } else {
            Serial.println("✗ Not confirmed / not found");
        }
    } else {
        Serial.println("Failed or timeout");
    }
}

/* ─── Setup ─────────────────────────────────────────────────────── */
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\nCKB LoRa Client — T-Impulse");
    Serial.println("============================");

    /* Init SPI for S76G */
    SPI.setMOSI(LORA_MOSI);
    SPI.setMISO(LORA_MISO);
    SPI.setSCLK(LORA_SCK);
    SPI.begin();

    LoRa.setPins(LORA_CS, LORA_RST, LORA_DIO0);

    Serial.print("Initialising LoRa...");
    if (!LoRa.begin(LORA_FREQ)) {
        Serial.println(" FAILED");
        Serial.println("Check wiring and SX1276 version fix in LoRa.cpp (0x12 → 0x12||0x13)");
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
    Serial.printf("Freq: %.0fMHz  SF: %d  BW: %.0fkHz  Sync: 0x%02X\n",
                  LORA_FREQ / 1e6, LORA_SF, LORA_BW / 1e3, LORA_SYNC_WORD);
}

/* ─── Loop ──────────────────────────────────────────────────────── */
void loop() {
    /* Query block height every 30 seconds */
    query_block_height();
    delay(5000);

    query_chain_tip();
    delay(25000);

    /*
     * To verify a specific tx, call:
     *
     * uint8_t tx[32] = {0xab, 0xcd, ...};  // your tx hash bytes
     * verify_tx(tx);
     */
}
