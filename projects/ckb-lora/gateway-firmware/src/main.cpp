/*
 * CKB-LoRa Single Channel Gateway
 * Hardware: Heltec WiFi LoRa 32 (SX1276)
 * Role: Receives LoRa packets → forwards to ChirpStack Gateway Bridge via UDP
 *       Implements minimal Semtech UDP packet forwarder protocol v2
 *
 * ChirpStack sees this as a standard UDP packet forwarder gateway.
 * Point ChirpStack Gateway Bridge at this device's IP, port 1700.
 *
 * AU915: single channel 916.8 MHz, SF7, BW125 (good starting point)
 * Change LORA_FREQUENCY to match your end devices.
 */

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>
#include "heltec.h"

// ── WiFi config ──────────────────────────────────────────────────────────────
#define WIFI_SSID       "YOUR_SSID"
#define WIFI_PASS       "YOUR_PASSWORD"

// ── ChirpStack Gateway Bridge (Pi5 on LAN) ───────────────────────────────────
#define CS_HOST         "192.168.68.82"   // Pi5 IP
#define CS_PORT         1700              // Semtech UDP port

// ── LoRa radio config (AU915 single channel) ─────────────────────────────────
#define LORA_FREQUENCY  916800000         // 916.8 MHz — AU915 ch8 uplink
#define LORA_SF         7                 // Spreading Factor 7 (fastest)
#define LORA_BW         125E3             // 125 kHz bandwidth
#define LORA_CR         5                 // Coding rate 4/5

// Heltec WiFi LoRa 32 SX1276 pins
#define LORA_SCK        5
#define LORA_MISO       19
#define LORA_MOSI       27
#define LORA_SS         18
#define LORA_RST        14
#define LORA_DIO0       26

// ── Gateway EUI (6-byte MAC → 8-byte EUI64) ──────────────────────────────────
// This identifies your gateway to ChirpStack
// Will be auto-derived from WiFi MAC at runtime
uint8_t gwEUI[8];

// ── Semtech UDP packet forwarder protocol ────────────────────────────────────
// https://github.com/Lora-net/packet_forwarder/blob/master/PROTOCOL.TXT
#define PKT_PUSH_DATA   0x00
#define PKT_PUSH_ACK    0x01
#define PKT_PULL_DATA   0x02
#define PKT_PULL_RESP   0x03
#define PKT_PULL_ACK    0x04
#define PKT_TX_ACK      0x05
#define PROTOCOL_VER    2

WiFiUDP udp;
IPAddress csIP;
uint16_t seqno = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────

// Build gateway EUI from WiFi MAC
void buildGwEUI() {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    gwEUI[0] = mac[0]; gwEUI[1] = mac[1]; gwEUI[2] = mac[2];
    gwEUI[3] = 0xFF;   gwEUI[4] = 0xFE;
    gwEUI[5] = mac[3]; gwEUI[6] = mac[4]; gwEUI[7] = mac[5];
}

String gwEUIStr() {
    char buf[17];
    snprintf(buf, sizeof(buf), "%02X%02X%02X%02X%02X%02X%02X%02X",
        gwEUI[0], gwEUI[1], gwEUI[2], gwEUI[3],
        gwEUI[4], gwEUI[5], gwEUI[6], gwEUI[7]);
    return String(buf);
}

// Base64 encode (needed for LoRa payload in JSON)
static const char b64chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
String base64Encode(const uint8_t* data, size_t len) {
    String out;
    out.reserve(((len + 2) / 3) * 4);
    for (size_t i = 0; i < len; i += 3) {
        uint32_t b = ((uint32_t)data[i] << 16);
        if (i+1 < len) b |= ((uint32_t)data[i+1] << 8);
        if (i+2 < len) b |= data[i+2];
        out += b64chars[(b >> 18) & 0x3F];
        out += b64chars[(b >> 12) & 0x3F];
        out += (i+1 < len) ? b64chars[(b >> 6) & 0x3F] : '=';
        out += (i+2 < len) ? b64chars[b & 0x3F] : '=';
    }
    return out;
}

// ── Send PULL_DATA to keep downlink path open ─────────────────────────────────
void sendPullData() {
    uint8_t buf[12];
    buf[0] = PROTOCOL_VER;
    buf[1] = (seqno >> 8) & 0xFF;
    buf[2] = seqno & 0xFF;
    buf[3] = PKT_PULL_DATA;
    memcpy(buf + 4, gwEUI, 8);
    seqno++;
    udp.beginPacket(csIP, CS_PORT);
    udp.write(buf, 12);
    udp.endPacket();
}

// ── Forward received LoRa packet to ChirpStack via PUSH_DATA ─────────────────
void forwardPacket(uint8_t* payload, int payloadLen, int rssi, float snr) {
    // Build JSON rxpk array per Semtech UDP protocol
    String b64 = base64Encode(payload, payloadLen);
    unsigned long now = millis();

    // tmst: gateway timestamp in microseconds
    uint32_t tmst = (uint32_t)(now * 1000UL);

    // Approximate RF metadata for AU915 single channel
    char rxpk[512];
    snprintf(rxpk, sizeof(rxpk),
        "{\"rxpk\":[{"
        "\"time\":\"\","       // ISO8601 — omit, gateway doesn't have RTC
        "\"tmst\":%lu,"
        "\"freq\":916.8,"      // MHz
        "\"chan\":0,"
        "\"rfch\":0,"
        "\"stat\":1,"
        "\"modu\":\"LORA\","
        "\"datr\":\"SF%dBW125\","
        "\"codr\":\"4/5\","
        "\"lsnr\":%.1f,"
        "\"rssi\":%d,"
        "\"size\":%d,"
        "\"data\":\"%s\""
        "}]}",
        tmst, LORA_SF, snr, rssi, payloadLen, b64.c_str()
    );

    // Build PUSH_DATA packet: [version][token hi][token lo][identifier][gwEUI 8B][JSON]
    size_t jsonLen = strlen(rxpk);
    size_t totalLen = 12 + jsonLen;
    uint8_t* pkt = (uint8_t*)malloc(totalLen);
    if (!pkt) return;

    pkt[0] = PROTOCOL_VER;
    pkt[1] = (seqno >> 8) & 0xFF;
    pkt[2] = seqno & 0xFF;
    pkt[3] = PKT_PUSH_DATA;
    memcpy(pkt + 4, gwEUI, 8);
    memcpy(pkt + 12, rxpk, jsonLen);
    seqno++;

    udp.beginPacket(csIP, CS_PORT);
    udp.write(pkt, totalLen);
    udp.endPacket();
    free(pkt);

    Serial.printf("[gw] → ChirpStack: %d bytes payload, RSSI=%d SNR=%.1f\n",
                  payloadLen, rssi, snr);
}

// ── Handle incoming UDP (ACKs + downlinks) ────────────────────────────────────
void handleUDP() {
    int n = udp.parsePacket();
    if (n < 4) return;

    uint8_t buf[256];
    n = udp.read(buf, sizeof(buf));
    if (n < 4) return;

    uint8_t pktType = buf[3];
    if (pktType == PKT_PUSH_ACK) {
        Serial.println("[gw] ← PUSH_ACK");
    } else if (pktType == PKT_PULL_ACK) {
        Serial.println("[gw] ← PULL_ACK");
    } else if (pktType == PKT_PULL_RESP) {
        // Downlink from ChirpStack → transmit via LoRa
        // buf[4..] = JSON txpk
        Serial.printf("[gw] ← PULL_RESP (downlink) %d bytes\n", n);
        // TODO: parse txpk JSON and transmit — implement when needed
    }
}

// ── Display ──────────────────────────────────────────────────────────────────
void updateDisplay(int pktCount, int rssi) {
    Heltec.display->clear();
    Heltec.display->setFont(ArialMT_Plain_10);
    Heltec.display->drawString(0, 0,  "CKB-LoRa Gateway");
    Heltec.display->drawString(0, 12, "916.8MHz SF7 AU915");
    Heltec.display->drawString(0, 24, "→ " + String(CS_HOST));
    Heltec.display->drawString(0, 36, "Pkts: " + String(pktCount));
    if (rssi != 0)
        Heltec.display->drawString(0, 48, "Last RSSI: " + String(rssi) + " dBm");
    Heltec.display->display();
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    Heltec.begin(true, true, true, true, LORA_FREQUENCY);

    Heltec.display->clear();
    Heltec.display->drawString(0, 0, "CKB-LoRa Gateway");
    Heltec.display->drawString(0, 16, "Connecting WiFi...");
    Heltec.display->display();

    // WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print("[gw] WiFi connecting");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500); Serial.print(".");
    }
    Serial.printf("\n[gw] WiFi connected: %s\n", WiFi.localIP().toString().c_str());

    buildGwEUI();
    Serial.printf("[gw] EUI: %s\n", gwEUIStr().c_str());

    // Resolve ChirpStack IP
    WiFi.hostByName(CS_HOST, csIP);
    Serial.printf("[gw] ChirpStack: %s:%d\n", csIP.toString().c_str(), CS_PORT);

    udp.begin(1700);

    // LoRa radio config
    LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
    LoRa.setSPIFrequency(8E6);
    if (!LoRa.begin(LORA_FREQUENCY)) {
        Serial.println("[gw] LoRa init failed!");
        while (1);
    }
    LoRa.setSpreadingFactor(LORA_SF);
    LoRa.setSignalBandwidth(LORA_BW);
    LoRa.setCodingRate4(LORA_CR);
    LoRa.enableCrc();
    LoRa.receive();  // Continuous receive mode

    Serial.println("[gw] Ready — listening on 916.8 MHz SF7");
    updateDisplay(0, 0);
}

// ── Main loop ─────────────────────────────────────────────────────────────────
unsigned long lastPull = 0;
int pktCount = 0;

void loop() {
    // Send PULL_DATA every 10s to keep downlink path open
    if (millis() - lastPull > 10000) {
        sendPullData();
        lastPull = millis();
    }

    // Handle UDP from ChirpStack
    handleUDP();

    // Check for received LoRa packet
    int pktSize = LoRa.parsePacket();
    if (pktSize > 0) {
        uint8_t payload[256];
        int len = 0;
        while (LoRa.available() && len < (int)sizeof(payload)) {
            payload[len++] = LoRa.read();
        }
        int rssi = LoRa.packetRssi();
        float snr = LoRa.packetSnr();

        Serial.printf("[gw] ← LoRa packet: %d bytes RSSI=%d SNR=%.1f\n", len, rssi, snr);

        forwardPacket(payload, len, rssi, snr);
        pktCount++;
        updateDisplay(pktCount, rssi);
    }
}
