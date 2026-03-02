# Research: bitchat-ble-transport

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nicktindall/cyclon.p2p-rtc-io/refs/heads/master/README.md, https://raw.githubusercontent.com/hackerhouse-opensource/bitchat-esp32/main/README.md, https://raw.githubusercontent.com/hackerhouse-opensource/bitchat-esp32/main/bitchat_esp32.ino, https://raw.githubusercontent.com/h2zero/NimBLE-Arduino/master/README.md, https://raw.githubusercontent.com/h2zero/NimBLE-Arduino/master/examples/NimBLE_Server/NimBLE_Server.ino, https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/src/bitchat/bitchat_mesh.h

---

## Research Topic: bitchat-ble-transport

## Summary
The `bitchat-esp32` implementation, built on Zephyr OS and ESP-IDF, demonstrates a BLE mesh discovery and communication pattern. It acts as both a BLE Central (scanning for peers and initiating connections) and a BLE Peripheral (advertising itself and accepting connections). Data reception appears to leverage GATT notifications, as indicated by "notifications enabled" in the logs. MTU negotiation is active, with a successful exchange resulting in an MTU of 508. The NimBLE-Arduino library is identified as a suitable stack for ESP32, offering server and client capabilities, and its `NimBLE_Server.ino` example provides a foundation for advertising, connection management, and characteristic notification.

## Questions to Answer

### 1. Does BitChat Android use BLE central, peripheral, or both simultaneously?
The provided content describes `bitchat-esp32`, not BitChat Android. Therefore, I cannot definitively answer whether **BitChat Android** uses BLE central, peripheral, or both simultaneously based *solely* on the provided text.

However, the `bitchat-esp32` implementation itself demonstrates capabilities for both roles:
*   **Central Role:** It performs active scans (`[Scan] Starting active scan for peers... [BLE] Scanning started (mesh discovery)`), discovers peers (`[Mesh] BitChat peer found: 45:94:67:55:98:33 (random)`), and initiates connections (`[Mesh] Connecting to 45:94:67:55:98:33 (random)... [Mesh] Connection initiated successfully`).
*   **Peripheral Role:** When `stealth off` is commanded, it starts advertising (`[BLE] Advertising started (non-stealth mode)`), making itself discoverable and connectable by other peers.

Given that `bitchat-esp32` is designed to interact with other BitChat peers (presumably including Android), it is highly probable that the BitChat protocol expects peers to be capable of both Central and Peripheral roles for mesh networking.

### 2. What's the exact GATT notify flow for mesh relay (write vs notify vs indicate)?
Based on the `bitchat-esp32` logs, **notifications** are explicitly used for receiving data:
*   `[GATT] Subscription CCC write complete (notifications enabled)`
*   `[GATT] Waiting for incoming handshake from peer...`
*   `[PKT] len=164 type=MSG ttl=7 ts=1769109372454 flags=0x02 payload=78 sender=0xee6f7ff7e7533f58` (followed by packet hex dump)
*   `[RX] Encrypted type=33 len=18 from 0xee6f7ff7e7533f58`

This indicates that when `bitchat-esp32` acts as a client to a peer's GATT server, it subscribes to notifications on a characteristic (handle `0x00bf`) to receive incoming messages and handshake data.

For **sending/relaying data** from `bitchat-esp32` to other peers, the mechanism is not explicitly detailed as `WRITE`, `NOTIFY`, or `INDICATE` in the provided `bitchat-esp32` logs for *outgoing* mesh relay packets. The log does show `[00:00:50.999,000] bitchat_crypto: Sent handshake message 1 (e)`, which implies data is sent, but the GATT operation (write, notify, indicate) is not specified.

The `NimBLE_Server.ino` example demonstrates a server sending notifications using `pChr->notify();` on a characteristic with `NIMBLE_PROPERTY::NOTIFY`. It also shows characteristics with `NIMBLE_PROPERTY::WRITE`. A mesh relay would typically involve both: writing to a characteristic on a peer acting as a GATT server, and notifying from a characteristic when acting as a GATT server to a connected peer.

### 3. NimBLE-Arduino: minimum sketch to advertise + accept connections + relay data?
A minimum sketch to advertise, accept connections, and send notifications (a form of relay from a server perspective) using NimBLE-Arduino can be derived from the `NimBLE_Server.ino` example.

**Core steps:**
1.  **Include NimBLE:** `#include "NimBLEDevice.h"`
2.  **Initialize BLE:** `NimBLEDevice::init("YourDeviceName");`
3.  **Create Server:** `pServer = NimBLEDevice::createServer();`
4.  **Set Server Callbacks (Optional but recommended):** Implement `NimBLEServerCallbacks` for `onConnect`, `onDisconnect`, `onMTUChange`, etc., and set them: `pServer->setCallbacks(&serverCallbacks);`
5.  **Create Service(s):** `NimBLEService* pService = pServer->createService("YOUR_SERVICE_UUID");`
6.  **Create Characteristic(s):** `NimBLECharacteristic* pCharacteristic = pService->createCharacteristic("YOUR_CHAR_UUID", NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::NOTIFY);`
    *   Set initial value: `pCharacteristic->setValue("Hello World");`
    *   Set characteristic callbacks (optional): `pCharacteristic->setCallbacks(&chrCallbacks);`
7.  **Start Service(s):** `pService->start();`
8.  **Get Advertising Instance:** `NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();`
9.  **Set Advertising Name & Service UUIDs:**
    *   `pAdvertising->setName("YourDeviceName");`
    *   `pAdvertising->addServiceUUID(pService->getUUID());`
10. **Start Advertising:** `pAdvertising->start();`
11. **Send Notifications (in loop or event-driven):**
    *   Check for connected clients: `if (pServer->getConnectedCount()) { ... }`
    *   Update characteristic value: `pCharacteristic->setValue("New Data");`
    *   Notify connected clients: `pCharacteristic->notify();`

**Relevant Code Snippets (from `NimBLE_Server.ino`):**
```cpp
#include "NimBLEDevice.h"

// ServerCallbacks class (for onConnect, onDisconnect, onMTUChange)
class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override {
        Serial.printf("Client address: %s\n", connInfo.getAddress().toString().c_str());
        // Optional: Update connection parameters
        pServer->updateConnParams(connInfo.getConnHandle(), 24, 48, 0, 180);
    }
    void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override {
        Serial.printf("Client disconnected - start advertising\n");
        NimBLEDevice::startAdvertising(); // Restart advertising after disconnect
    }
    void onMTUChange(uint16_t MTU, NimBLEConnInfo& connInfo) override {
        Serial.printf("MTU updated: %u for connection ID: %u\n", MTU, connInfo.getConnHandle());
    }
};
static ServerCallbacks serverCallbacks; // Instance of callbacks

// CharacteristicCallbacks class (for onRead, onWrite, onStatus, onSubscribe)
class CharacteristicCallbacks : public NimBLECharacteristicCallbacks {
    void onRead(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override {
        Serial.printf("%s : onRead(), value: %s\n", pCharacteristic->getUUID().toString().c_str(), pCharacteristic->getValue().c_str());
    }
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override {
        Serial.printf("%s : onWrite(), value: %s\n", pCharacteristic->getUUID().toString().c_str(), pCharacteristic->getValue().c_str());
    }
    void onSubscribe(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo, uint16_t subValue) override {
        // Handle subscription status (0: unsubscribed, 1: notifications, 2: indications)
        Serial.printf("Client %s %s to %s\n", connInfo.getAddress().toString().c_str(), 
                      (subValue == 0 ? "unsubscribed" : "subscribed"), 
                      std::string(pCharacteristic->getUUID()).c_str());
    }
};
static CharacteristicCallbacks chrCallbacks; // Instance of callbacks

void setup() {
    Serial.begin(115200);
    Serial.printf("Starting NimBLE Server\n");

    NimBLEDevice::init("NimBLE-Server"); // Initialize BLE with device name
    pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(&serverCallbacks);

    // Create a service
    NimBLEService* pService = pServer->createService("BAAD"); // Example UUID
    
    // Create a characteristic with READ, WRITE, NOTIFY properties
    NimBLECharacteristic* pCharacteristic = pService->createCharacteristic(
        "F00D", // Example UUID
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::NOTIFY
    );
    pCharacteristic->setValue("Initial Data");
    pCharacteristic->setCallbacks(&chrCallbacks);

    pService->start(); // Start the service

    NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
    pAdvertising->setName("NimBLE-Server");
    pAdvertising->addServiceUUID(pService->getUUID());
    pAdvertising->start(); // Start advertising
    Serial.printf("Advertising Started\n");
}

void loop() {
    // Example of sending notifications every 2 seconds if clients are connected
    delay(2000);
    if (pServer->getConnectedCount()) {
        NimBLEService* pSvc = pServer->getServiceByUUID("BAAD");
        if (pSvc) {
            NimBLECharacteristic* pChr = pSvc->getCharacteristic("F00D");
            if (pChr) {
                // Update value and notify
                static int count = 0;
                std::string value = "Data: " + std::to_string(count++);
                pChr->setValue(value);
                pChr->notify(); // Send notification
                Serial.printf("Notified: %s\n", value.c_str());
            }
        }
    }
}
```

### 4. Any existing ESP32 BitChat implementations or forks?
Yes, there is an existing ESP32 BitChat implementation provided in the source content:
*   `hackerhouse-opensource/bitchat-esp32`
The `README.md` for this project explicitly states: "A minimal implementation of bitchat for use on ESP32-C6 based devices."

The other URLs provided (`cyclon.p2p-rtc-io` and `ckb-light-esp`) resulted in `HTTP Error 404: Not Found`, so their content could not be analyzed.

### 5. MTU negotiation — what does NimBLE default to, what does BitChat Android expect?
*   **BitChat ESP32 MTU:** The `bitchat-esp32` logs show a successful MTU negotiation: `[MTU] Exchange successful: MTU=508 for 45:94:67:55:98:33 (random)`. This indicates that the `bitchat-esp32` implementation (and likely its peer, which could be BitChat Android) successfully negotiated an MTU of 508 bytes.
*   **NimBLE Default MTU:** The provided `NimBLE-Arduino/README.md` does not explicitly state the default MTU for NimBLE. It mentions that `src/nimconfig.h` can be changed to customize NimBLE, which might include MTU settings. Without access to `nimconfig.h`, the default cannot be determined from the provided content.
*   **BitChat Android Expectation:** The content does not explicitly state what BitChat Android *expects* as a minimum or maximum MTU. However, since `bitchat-esp32` successfully negotiated an MTU of 508 with a peer (which could be Android), it implies that 508 bytes is a supported and utilized MTU size within the BitChat ecosystem.

## Gaps / Follow-up
1.  **BitChat Android BLE Role:** The provided content focuses on `bitchat-esp32`. To confirm BitChat Android's BLE Central/Peripheral role, documentation or code for the Android application would be needed.
2.  **Outgoing Mesh Relay GATT Operation:** While incoming data uses notifications, the specific GATT operation (Write, Notify, Indicate) used by `bitchat-esp32` for *sending* mesh relay packets to other peers is not explicitly detailed in the logs. Further analysis of the `bitchat-esp32` source code would be required.
3.  **NimBLE Default MTU:** Access to the `nimconfig.h` file within the NimBLE-Arduino library would be needed to determine the default MTU value.
4.  **BitChat GATT Service/Characteristic UUIDs:** The `bitchat-esp32` log mentions `[GATT] Discovered bitchat char handle: 0x00bf`, but the specific UUIDs for the BitChat service and characteristics are not provided. This information is crucial for implementing a compatible client/server.
5.  **Packet Codec Integration:** The research goal mentions wiring `bitchat_mesh.cpp` into actual BLE. While the BLE transport layer is discussed, the specific integration points for the packet codec and relay engine with NimBLE's characteristic read/write/notify callbacks are not detailed.

## Relevant Code/API Snippets

**NimBLE-Arduino Server Setup (from `NimBLE_Server.ino`):**
```cpp
#include "NimBLEDevice.h"

static NimBLEServer* pServer;

// Server Callbacks
class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override {
        Serial.printf("Client address: %s\n", connInfo.getAddress().toString().c_str());
        pServer->updateConnParams(connInfo.getConnHandle(), 24, 48, 0, 180); // Connection parameters
    }
    void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override {
        Serial.printf("Client disconnected - start advertising\n");
        NimBLEDevice::startAdvertising(); // Restart advertising
    }
    void onMTUChange(uint16_t MTU, NimBLEConnInfo& connInfo) override {
        Serial.printf("MTU updated: %u for connection ID: %u\n", MTU, connInfo.getConnHandle());
    }
};
static ServerCallbacks serverCallbacks;

// Characteristic Callbacks
class CharacteristicCallbacks : public NimBLECharacteristicCallbacks {
    void onRead(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override {
        Serial.printf("%s : onRead(), value: %s\n", pCharacteristic->getUUID().toString().c_str(), pCharacteristic->getValue().c_str());
    }
    void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override {
        Serial.printf("%s : onWrite(), value: %s\n", pCharacteristic->getUUID().toString().c_str(), pCharacteristic->getValue().c_str());
    }
    void onSubscribe(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo, uint16_t subValue) override {
        // Handle subscription status (0: unsubscribed, 1: notifications, 2: indications)
        // ...
    }
};
static CharacteristicCallbacks chrCallbacks;

void setup(void) {
    NimBLEDevice::init("NimBLE-Server"); // Initialize BLE
    pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(&serverCallbacks);

    NimBLEService* pBaadService = pServer->createService("BAAD"); // Create a service
    NimBLECharacteristic* pFoodCharacteristic = pBaadService->createCharacteristic(
        "F00D", 
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::NOTIFY // Properties
    );
    pFoodCharacteristic->setValue("Fries");
    pFoodCharacteristic->setCallbacks(&chrCallbacks);
    pBaadService->start(); // Start the service

    NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
    pAdvertising->setName("NimBLE-Server");
    pAdvertising->addServiceUUID(pBaadService->getUUID());
    pAdvertising->start(); // Start advertising
}

void loop() {
    // Example of sending notifications
    if (pServer->getConnectedCount()) {
        NimBLEService* pSvc = pServer->getServiceByUUID("BAAD");
        if (pSvc) {
            NimBLECharacteristic* pChr = pSvc->getCharacteristic("F00D");
            if (pChr) {
                pChr->notify(); // Send notification
            }
        }
    }
}
```

**BitChat ESP32 MTU Negotiation Log:**
```
[MTU] Exchange successful: MTU=508 for 45:94:67:55:98:33 (random)
```

**BitChat ESP32 Notification Enablement Log:**
```
[GATT] Subscription CCC write complete (notifications enabled)
```

Date: 2026-03-03