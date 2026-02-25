/*
 * CKB Address Scanner for LilyGO T-Deck
 * =======================================
 * Screen flow:
 *   [1] LORA SCAN  — sweep AU915 channels, discover CKB-LoRa nodes by RSSI + beacon
 *   [2] NODE SELECT — list found nodes with dBm/SNR bars, user picks one
 *   [3] MAIN       — scan QR → validate CKB address → query balance via selected node
 *
 * Hardware:
 *   T-Deck ESP32-S3 + SX1262 LoRa + ST7789 320×240 + BB Q10 keyboard
 *   GM861S barcode scanner → UART1 (GPIO 43/44)
 *
 * GM861S wiring:
 *   GM861S TX → GPIO 43  (T-Deck GPS_TX pin, repurposed)
 *   GM861S RX → GPIO 44  (T-Deck GPS_RX pin, repurposed)
 *   GM861S VCC → 3.3V, GND → GND
 *
 * Keyboard shortcuts (main screen):
 *   N     → edit RPC node URL
 *   Q     → go back to LoRa scan
 *   ENTER → confirm node URL edit
 */

#include <Arduino.h>
#include <Wire.h>
#include <TFT_eSPI.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <RadioLib.h>
#include "ckb_bech32.h"

// ── Board pins (T-Deck) ───────────────────────────────────────────────────────
#define BOARD_POWERON       10
#define BOARD_I2C_SDA       18
#define BOARD_I2C_SCL        8
#define BOARD_KEYBOARD_INT  46
#define BOARD_TFT_BL        42
#define SCANNER_RX          43
#define SCANNER_TX          44
#define KB_ADDR             0x55

// SX1262 pins
#define LORA_SCK            40
#define LORA_MISO           38
#define LORA_MOSI           41
#define LORA_CS              9
#define LORA_RST            17
#define LORA_DIO1           45
#define LORA_BUSY           13

// ── WiFi ──────────────────────────────────────────────────────────────────────
#define WIFI_SSID   "YOUR_SSID"
#define WIFI_PASS   "YOUR_PASSWORD"

// ── AU915 channel plan ────────────────────────────────────────────────────────
static const float AU915_CH[] = {
    915.2, 915.4, 915.6, 915.8,
    916.0, 916.2, 916.4, 916.6,
    916.8, 917.0, 917.2, 917.4,
    917.6, 917.8, 918.0, 918.2
};
#define NUM_CH       16
#define DWELL_MS    350    // ms to listen per channel
#define BEACON_FREQ 916.8  // Standard CKB-LoRa beacon channel

// CKB-LoRa beacon format: [0xCB][0x01][name 8B][block 4B LE]  = 14 bytes
#define BEACON_MAGIC_0  0xCB
#define BEACON_MAGIC_1  0x01

// ── Colours ───────────────────────────────────────────────────────────────────
#define C_BG      TFT_BLACK
#define C_HDR     0x1A3A
#define C_ACCENT  0x07FF
#define C_GREEN   0x07E0
#define C_RED     0xF800
#define C_YELLOW  0xFFE0
#define C_WHITE   TFT_WHITE
#define C_GREY    0x8410
#define C_DARK    0x2104
#define C_BAR_BG  0x2945
#define C_SEL     0x0233
#define C_FIELD   0x1082
#define C_FACTIVE 0x0339

// ── App state ─────────────────────────────────────────────────────────────────
enum Screen { SCR_SCAN, SCR_SELECT, SCR_MAIN };

struct LoRaNode {
    char     name[12];
    float    freq;
    int      rssi;
    float    snr;
    uint32_t blockNum;
    bool     isCKB;
};

TFT_eSPI        tft;
HardwareSerial  scanner(1);
SPIClass        loraSPI(HSPI);
SX1262          radio = new Module(LORA_CS, LORA_DIO1, LORA_RST, LORA_BUSY, loraSPI);

Screen    screen      = SCR_SCAN;
LoRaNode  nodes[8];
int       nodeCount   = 0;
int       selNode     = -1;
int8_t    chRSSI[NUM_CH];
int       scanIdx     = 0;
bool      scanDone    = false;

String    lastAddr    = "";
String    lastBal     = "";
bool      editRPC     = false;
String    rpcBuf      = "";
char      rpcURL[128] = "http://192.168.68.87:8114";

// ── Helpers ───────────────────────────────────────────────────────────────────
int rssiBar(int rssi, int maxW) {
    return map(constrain(rssi, -130, -30), -130, -30, 0, maxW);
}
uint16_t rssiCol(int rssi) {
    if (rssi > -70) return C_GREEN;
    if (rssi > -90) return C_YELLOW;
    return C_RED;
}

// ── LoRa ──────────────────────────────────────────────────────────────────────
bool loraInit() {
    loraSPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_CS);
    int s = radio.begin(BEACON_FREQ, 125.0, 7, 5,
                        RADIOLIB_SX126X_SYNC_WORD_PRIVATE, 22, 8);
    return (s == RADIOLIB_ERR_NONE);
}

// Listen on freq for DWELL_MS, return true if packet received
bool listenCh(float freq, uint8_t* buf, size_t* len, int* rssi, float* snr) {
    radio.standby();
    radio.setFrequency(freq);
    radio.setSpreadingFactor(7);
    radio.startReceive();
    unsigned long t = millis();
    while (millis() - t < DWELL_MS) {
        if (radio.available()) {
            uint8_t tmp[64]; size_t l = sizeof(tmp);
            if (radio.readData(tmp, l) == RADIOLIB_ERR_NONE) {
                l = radio.getPacketLength();
                memcpy(buf, tmp, min(l, (size_t)63));
                *len = l; *rssi = radio.getRSSI(); *snr = radio.getSNR();
                radio.standby();
                return true;
            }
        }
        delay(5);
    }
    radio.standby();
    // Return ambient RSSI even if no packet
    *rssi = radio.getRSSI(); *snr = 0; *len = 0;
    return false;
}

bool parseBeacon(uint8_t* buf, size_t len, LoRaNode* n) {
    if (len < 14 || buf[0] != BEACON_MAGIC_0 || buf[1] != BEACON_MAGIC_1) return false;
    memcpy(n->name, buf + 2, 8); n->name[8] = 0;
    n->blockNum = (uint32_t)buf[10] | ((uint32_t)buf[11] << 8) |
                  ((uint32_t)buf[12] << 16) | ((uint32_t)buf[13] << 24);
    n->isCKB = true;
    return true;
}

void upsertNode(LoRaNode* in) {
    for (int i = 0; i < nodeCount; i++) {
        if (strcmp(nodes[i].name, in->name) == 0) { nodes[i] = *in; return; }
    }
    if (nodeCount < 8) nodes[nodeCount++] = *in;
}

// ── Draw: Scan screen ─────────────────────────────────────────────────────────
void drawScan() {
    tft.fillScreen(C_BG);
    tft.fillRect(0, 0, 320, 26, C_HDR);
    tft.setTextColor(C_ACCENT); tft.setTextFont(2);
    tft.drawString("LoRa Node Scan  AU915", 6, 5);

    // Channel bar chart
    const int BAR_X = 8, BAR_W = 17, GAP = 2;
    const int BASE_Y = 185, MAX_H = 140;

    for (int i = 0; i < NUM_CH; i++) {
        int x = BAR_X + i * (BAR_W + GAP);
        int rssi = chRSSI[i];
        int h = (rssi != 0) ? rssiBar(-rssi, MAX_H) : 0;
        bool active = (i == scanIdx && !scanDone);

        tft.fillRect(x, BASE_Y - MAX_H, BAR_W, MAX_H, C_BAR_BG);
        if (h > 0) tft.fillRect(x, BASE_Y - h, BAR_W, h, active ? C_YELLOW : rssiCol(rssi));
        // Scanning stripe at top
        if (active) tft.fillRect(x, BASE_Y - MAX_H, BAR_W, 3, C_YELLOW);

        // RSSI label under bar
        if (rssi != 0) {
            tft.setTextFont(1); tft.setTextColor(C_GREY);
            tft.drawString(String(-rssi), x + 1, BASE_Y + 2);
        }
        // Freq label every 4
        if (i % 4 == 0) {
            tft.setTextFont(1); tft.setTextColor(0x4208);
            tft.drawString(String(AU915_CH[i], 1), x, BASE_Y + 14);
        }
    }

    // Status
    tft.setTextFont(1);
    if (!scanDone) {
        tft.setTextColor(C_WHITE);
        tft.drawString("Scanning " + String(AU915_CH[scanIdx], 1) +
                       " MHz  (" + String(scanIdx + 1) + "/" + String(NUM_CH) + ")",
                       6, 208);
    } else {
        tft.setTextColor(C_GREEN);
        tft.drawString(String(nodeCount) + " CKB node(s) found.  Press ENTER to continue",
                       6, 208);
        // Node badges
        for (int i = 0; i < min(nodeCount, 4); i++) {
            int bx = 6 + i * 78;
            tft.fillRoundRect(bx, 28, 74, 18, 3, C_SEL);
            tft.setTextColor(C_ACCENT);
            tft.drawString(String(nodes[i].name) + " " + String(nodes[i].rssi) + "dBm",
                           bx + 3, 32);
        }
    }
}

// ── Draw: Node select screen ──────────────────────────────────────────────────
#define ROW_H  40
#define LIST_Y 28

void drawSelect() {
    tft.fillScreen(C_BG);
    tft.fillRect(0, 0, 320, LIST_Y, C_HDR);
    tft.setTextColor(C_ACCENT); tft.setTextFont(2);
    tft.drawString("Select LoRa Node", 6, 5);
    tft.setTextColor(C_GREY); tft.setTextFont(1);
    tft.drawString("ENTER=select  W/S=scroll", 170, 9);

    if (nodeCount == 0) {
        tft.setTextColor(C_RED); tft.setTextFont(2);
        tft.drawString("No CKB nodes heard.", 60, 100);
        tft.setTextColor(C_GREY); tft.setTextFont(1);
        tft.drawString("ENTER to use WiFi RPC only", 80, 130);
        return;
    }

    int visible = min(nodeCount, 4);
    for (int i = 0; i < visible; i++) {
        LoRaNode& n = nodes[i];
        int y = LIST_Y + i * ROW_H;
        bool sel = (i == selNode);

        tft.fillRect(0, y, 320, ROW_H - 2, sel ? C_SEL : C_DARK);
        if (sel) tft.drawRect(0, y, 320, ROW_H - 2, C_ACCENT);

        // Name
        tft.setTextColor(sel ? C_ACCENT : C_WHITE); tft.setTextFont(2);
        tft.drawString(n.isCKB ? n.name : "??", 8, y + 4);

        // CKB badge
        if (n.isCKB) {
            tft.fillRoundRect(78, y + 5, 28, 14, 3, C_GREEN);
            tft.setTextColor(TFT_BLACK); tft.setTextFont(1);
            tft.drawString("CKB", 81, y + 9);
        }

        // Freq + block
        tft.setTextColor(C_GREY); tft.setTextFont(1);
        tft.drawString(String(n.freq, 1) + "MHz", 8, y + 24);
        if (n.blockNum) tft.drawString("blk " + String(n.blockNum), 75, y + 24);

        // RSSI bar (right side)
        int bx = 200, bw = 110, bh = 10;
        tft.fillRect(bx, y + 6, bw, bh, C_BAR_BG);
        tft.fillRect(bx, y + 6, rssiBar(n.rssi, bw), bh, rssiCol(n.rssi));
        tft.setTextColor(rssiCol(n.rssi)); tft.setTextFont(1);
        tft.drawString(String(n.rssi) + "dBm", bx + 2, y + 19);
        tft.setTextColor(C_GREY);
        tft.drawString("SNR:" + String(n.snr, 1), bx + 60, y + 19);
    }
}

// ── Draw: Main screen ─────────────────────────────────────────────────────────
void drawMainHdr() {
    tft.fillRect(0, 0, 320, 26, C_HDR);
    tft.setTextColor(C_ACCENT); tft.setTextFont(2);
    tft.drawString("CKB Scanner", 6, 5);
    if (selNode >= 0 && selNode < nodeCount) {
        LoRaNode& n = nodes[selNode];
        tft.setTextColor(rssiCol(n.rssi)); tft.setTextFont(1);
        tft.drawString(String(n.name) + " " + String(n.rssi) + "dBm SNR:" +
                       String(n.snr, 1), 155, 9);
    } else {
        tft.setTextColor(C_YELLOW); tft.setTextFont(1);
        tft.drawString("WiFi RPC", 230, 9);
    }
}

void drawRPCField() {
    tft.fillRoundRect(4, 28, 312, 22, 3, editRPC ? C_FACTIVE : C_FIELD);
    tft.drawRoundRect(4, 28, 312, 22, 3, editRPC ? C_ACCENT : C_GREY);
    tft.setTextColor(editRPC ? C_YELLOW : C_GREY); tft.setTextFont(1);
    String v = editRPC ? (rpcBuf + "|") : String(rpcURL);
    if (v.length() > 46) v = v.substring(0, 46);
    tft.drawString("RPC: " + v, 8, 35);
}

void drawResult() {
    tft.fillRect(0, 52, 320, 188, C_BG);

    if (lastAddr.length() == 0) {
        tft.setTextColor(C_GREY); tft.setTextFont(2);
        tft.drawString("Scan a CKB QR code", 66, 100);
        tft.setTextFont(1); tft.setTextColor(C_DARK);
        tft.drawString("N=edit RPC   Q=re-scan LoRa", 72, 130);
        return;
    }

    bool valid = (lastAddr.startsWith("ckb1") || lastAddr.startsWith("ckt1"))
                  && lastAddr.length() >= 40;

    if (!valid) {
        tft.fillCircle(160, 110, 30, C_RED);
        tft.setTextColor(C_WHITE); tft.setTextFont(4);
        tft.drawString("X", 148, 96);
        tft.setTextColor(C_RED); tft.setTextFont(2);
        tft.drawString("Not a CKB Address", 58, 152);
        tft.setTextColor(C_GREY); tft.setTextFont(1);
        String t = lastAddr.length() > 40 ? lastAddr.substring(0, 40) + "..." : lastAddr;
        tft.drawString(t, 8, 172);
        return;
    }

    bool mainnet = lastAddr.startsWith("ckb1");
    tft.setTextColor(C_ACCENT); tft.setTextFont(2);
    tft.drawString("CKB Address Detected", 6, 56);
    tft.fillRoundRect(210, 56, mainnet ? 70 : 66, 17, 3, mainnet ? C_GREEN : C_YELLOW);
    tft.setTextColor(TFT_BLACK); tft.setTextFont(1);
    tft.drawString(mainnet ? " MAINNET" : " TESTNET", 213, 61);

    // Address in two lines
    tft.setTextColor(C_WHITE); tft.setTextFont(1);
    int h = lastAddr.length() / 2;
    tft.drawString(lastAddr.substring(0, h), 6, 78);
    tft.drawString(lastAddr.substring(h),    6, 90);

    tft.drawFastHLine(4, 106, 312, C_DARK);

    // Balance
    tft.setTextFont(2);
    if (lastBal.startsWith("ERR")) {
        tft.setTextColor(C_RED);
        tft.drawString(lastBal, 6, 112);
    } else if (lastBal.length()) {
        // Large balance display
        tft.setTextColor(C_GREEN); tft.setTextFont(4);
        // Strip " CKB" suffix for the big number, redraw label separately
        int idx = lastBal.indexOf(" CKB");
        String num = (idx > 0) ? lastBal.substring(0, idx) : lastBal;
        tft.drawString(num, 6, 108);
        tft.setTextColor(C_GREY); tft.setTextFont(2);
        tft.drawString("CKByte", 6, 148);
    } else {
        tft.setTextColor(C_YELLOW);
        tft.drawString("Querying...", 6, 112);
    }
}

// ── CKB address validation ────────────────────────────────────────────────────
bool validCKB(const String& a) {
    if (a.length() < 40 || a.length() > 110) return false;
    if (!a.startsWith("ckb1") && !a.startsWith("ckt1")) return false;
    for (size_t i = 4; i < a.length(); i++) {
        char c = tolower(a[i]);
        if (!((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'))) return false;
    }
    return true;
}

// ── Balance query (WiFi RPC — full bech32 decode) ─────────────────────────────
// Returns formatted CKB string "1234.56" or "ERR:..."
String queryBalance(const String& addr) {
    if (WiFi.status() != WL_CONNECTED) return "ERR:No WiFi";

    // Decode address → lock script
    CKBLockScript ls;
    if (!ckb_decode_address(addr.c_str(), &ls)) {
        return "ERR:addr decode";
    }
    Serial.printf("[rpc] code_hash=0x%s hash_type=%s args=0x%s\n",
                  ls.code_hash_hex, ls.hash_type, ls.args_hex);

    // Build RPC body
    char body[512];
    if (!ckb_build_capacity_rpc(&ls, body, sizeof(body))) {
        return "ERR:rpc build";
    }

    HTTPClient http;
    http.begin(rpcURL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(6000);
    int code = http.POST(body);
    if (code != 200) { http.end(); return "ERR:HTTP " + String(code); }
    String resp = http.getString(); http.end();

    JsonDocument doc;
    if (deserializeJson(doc, resp)) return "ERR:JSON";
    if (doc["error"].is<JsonObject>()) {
        const char* msg = doc["error"]["message"] | "RPC error";
        return "ERR:" + String(msg).substring(0, 20);
    }

    const char* cap_hex = doc["result"]["capacity"] | "";
    if (strlen(cap_hex) == 0) return "0 CKB";

    char ckb_str[32];
    ckb_format_capacity(cap_hex, ckb_str, sizeof(ckb_str));
    return String(ckb_str) + " CKB";
}

// ── Keyboard ──────────────────────────────────────────────────────────────────
char readKB() {
    Wire.beginTransmission(KB_ADDR);
    if (Wire.endTransmission()) return 0;
    Wire.requestFrom(KB_ADDR, 1);
    return Wire.available() ? (char)Wire.read() : 0;
}

void handleKB(char c) {
    if (screen == SCR_SCAN) {
        if (c == '\n' || c == '\r') {
            scanDone = true;
            selNode = (nodeCount > 0) ? 0 : -1;
            screen = SCR_SELECT;
            drawSelect();
        }
    } else if (screen == SCR_SELECT) {
        if (c == 'w' || c == 'W') { if (selNode > 0) { selNode--; drawSelect(); } }
        if (c == 's' || c == 'S') { if (selNode < nodeCount - 1) { selNode++; drawSelect(); } }
        if (c == '\n' || c == '\r') {
            screen = SCR_MAIN;
            tft.fillScreen(C_BG);
            drawMainHdr(); drawRPCField(); drawResult();
        }
    } else if (screen == SCR_MAIN) {
        if (editRPC) {
            if (c == '\n' || c == '\r') {
                rpcBuf.toCharArray(rpcURL, sizeof(rpcURL));
                editRPC = false; rpcBuf = "";
                drawRPCField();
            } else if (c == 8 || c == 127) {
                if (rpcBuf.length()) rpcBuf.remove(rpcBuf.length() - 1);
                drawRPCField();
            } else if (c >= 32 && c < 127 && rpcBuf.length() < 60) {
                rpcBuf += c; drawRPCField();
            }
        } else {
            if (c == 'n' || c == 'N') {
                editRPC = true; rpcBuf = String(rpcURL); drawRPCField();
            }
            if (c == 'q' || c == 'Q') {
                // Re-scan LoRa
                screen = SCR_SCAN; scanIdx = 0; scanDone = false;
                nodeCount = 0; selNode = -1;
                memset(chRSSI, 0, sizeof(chRSSI));
                lastAddr = ""; lastBal = "";
                drawScan();
            }
        }
    }
}

// ── Scanner ───────────────────────────────────────────────────────────────────
String scanBuf = "";
unsigned long lastScanChar = 0;

void pollScanner() {
    if (screen != SCR_MAIN) return;
    while (scanner.available()) {
        char c = scanner.read();
        lastScanChar = millis();
        if (c == '\r' || c == '\n') {
            if (scanBuf.length()) {
                String s = scanBuf; scanBuf = "";
                s.trim();
                Serial.println("[scan] " + s);
                lastAddr = s; lastBal = "";
                drawResult();  // Show immediately (querying)
                if (validCKB(s)) {
                    lastBal = queryBalance(s);
                }
                drawResult();  // Show with result
            }
        } else { scanBuf += c; }
    }
    if (scanBuf.length() && millis() - lastScanChar > 250) {
        String s = scanBuf; scanBuf = "";
        s.trim();
        lastAddr = s; lastBal = "";
        drawResult();
        if (validCKB(s)) { lastBal = queryBalance(s); drawResult(); }
    }
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    pinMode(BOARD_POWERON, OUTPUT);
    digitalWrite(BOARD_POWERON, HIGH);
    delay(150);
    pinMode(BOARD_TFT_BL, OUTPUT);
    digitalWrite(BOARD_TFT_BL, HIGH);
    Wire.begin(BOARD_I2C_SDA, BOARD_I2C_SCL);

    tft.init();
    tft.setRotation(1);
    tft.fillScreen(C_BG);
    tft.setTextColor(C_ACCENT); tft.setTextFont(4);
    tft.drawString("CKB LoRa", 80, 80);
    tft.setTextColor(C_GREY); tft.setTextFont(2);
    tft.drawString("Initialising...", 90, 130);

    scanner.begin(9600, SERIAL_8N1, SCANNER_RX, SCANNER_TX);
    WiFi.begin(WIFI_SSID, WIFI_PASS);  // Background connect

    if (!loraInit()) {
        tft.setTextColor(C_RED); tft.setTextFont(2);
        tft.drawString("LoRa FAILED", 90, 155);
        delay(3000);
    }

    memset(chRSSI, 0, sizeof(chRSSI));
    screen = SCR_SCAN;
    delay(800);
    drawScan();
}

// ── Loop ──────────────────────────────────────────────────────────────────────
unsigned long lastKB = 0;

void loop() {
    // Keyboard
    if (millis() - lastKB > 80) {
        char k = readKB();
        if (k) handleKB(k);
        lastKB = millis();
    }

    // LoRa channel scan (one channel per loop iteration)
    if (screen == SCR_SCAN && !scanDone && scanIdx < NUM_CH) {
        uint8_t pkt[64]; size_t plen; int rssi; float snr;
        bool got = listenCh(AU915_CH[scanIdx], pkt, &plen, &rssi, &snr);
        chRSSI[scanIdx] = (int8_t)constrain(rssi, -128, 0);

        if (got && plen > 0) {
            LoRaNode n = {};
            n.freq = AU915_CH[scanIdx];
            n.rssi = rssi; n.snr = snr;
            if (parseBeacon(pkt, plen, &n)) {
                // Valid CKB-LoRa beacon
                upsertNode(&n);
                Serial.printf("[lora] Beacon from %s blk=%u rssi=%d\n",
                              n.name, n.blockNum, rssi);
            } else {
                // Unknown LoRa device — add as generic node
                if (rssi > -110) {  // Only if signal is somewhat usable
                    snprintf(n.name, sizeof(n.name), "NODE-%02X", scanIdx);
                    n.isCKB = false;
                    upsertNode(&n);
                }
            }
        }

        scanIdx++;
        drawScan();

        if (scanIdx >= NUM_CH) {
            scanDone = true;
            drawScan();
            // Auto-advance if exactly one CKB node found
            if (nodeCount == 1 && nodes[0].isCKB) {
                delay(1200);
                selNode = 0;
                screen = SCR_SELECT;
                drawSelect();
            }
        }
    }

    // Scanner polling (main screen only)
    pollScanner();
}
