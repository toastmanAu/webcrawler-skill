# Research: telegram-bot-esp32-security-hardening

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/GyverLibs/FastBot/main/src/FastBot.h, https://raw.githubusercontent.com/GyverLibs/FastBot/main/src/FastBot.cpp, https://core.telegram.org/bots/api#getupdates, https://core.telegram.org/bots/faq#how-do-i-get-updates

---

Date: 2026-03-06

## Summary
This research analyzes the security posture of the NerdMiner CKB's Telegram OTA bot, which utilizes the FastBot library on ESP32. Key findings indicate that FastBot explicitly states it operates "without SSL" on standard libraries, raising significant concerns about Man-in-the-Middle (MITM) attacks on untrusted networks. While Telegram's API prevents replay of specific `update_id`s, an attacker with access to a whitelisted chat could re-send previously distributed `.bin` files. The library provides a `setToken` function for token rotation, but a secure procedure for a compromised, deployed device is not detailed. Additional authentication layers, such as user ID whitelisting or command-specific secrets, are feasible improvements. Telegram's API generally guarantees message ordering via `update_id`s, preventing arbitrary injection of updates into the past.

## Questions to Answer

### 1. Does FastBot use HTTPS for Telegram API calls on ESP32, and how is the cert validated?
Based on the `FastBot.h` header file, the library explicitly states: "Работает на стандартных библиотеках без SSL" (Works on standard libraries without SSL).

While the code snippet for ESP8266 with `FB_DYNAMIC` shows `BearSSL::WiFiClientSecure client; client.setInsecure();`, the corresponding section for ESP32 (`#else // ESP32 if (!_http->begin(req)) return 4;`) does not explicitly initialize `WiFiClientSecure` or call `setInsecure()`. Given the explicit comment about "без SSL" and the lack of explicit `WiFiClientSecure` or certificate validation calls for ESP32, it is highly probable that **FastBot does not use HTTPS for Telegram API calls on ESP32, or if it does, it does not perform certificate validation.** This makes the communication vulnerable to Man-in-the-Middle (MITM) attacks on untrusted networks.

### 2. Can an attacker replay a previously sent .bin file to trigger re-flash?
Telegram's `getUpdates` API, which FastBot uses via `req += F("&offset="); req += ID;` in `tickManual()`, is designed to prevent replay of *updates* (messages). The Telegram Bot API documentation states: "To confirm an update, use the `offset` parameter when calling `getUpdates` like this: `offset = update_id of last processed update + 1`. All updates with `update_id` less than or equal to offset will be marked as confirmed on the server and will no longer be returned."

This mechanism ensures that a specific Telegram `update_id` (representing a message or file upload) cannot be retrieved and processed by the bot more than once. Therefore, an attacker **cannot replay a previously sent Telegram *update*** to trigger a re-flash.

However, if an attacker gains control of a chat ID that is whitelisted for OTA updates, they could **send a *new* Telegram message containing the *same .bin file content*** that was previously sent. In this scenario, the Telegram API would treat it as a new update with a new `update_id`, and FastBot would process it as a legitimate OTA request, potentially triggering a re-flash with the old firmware. The `offset` mechanism only prevents re-processing the *same update*, not re-processing the *same file content* if delivered as a *new* update.

### 3. What's the procedure to rotate a compromised bot token on a deployed device?
The `FastBot` library provides a `setToken(const String& token)` method, which allows changing the bot token at runtime.

The procedure to rotate a compromised bot token on a deployed device would involve:
1.  Generating a new bot token via @BotFather in Telegram.
2.  Updating the deployed ESP32 device with this new token.

However, the provided content **does not detail a secure procedure for updating a *compromised* token on a *deployed* device.** If the token is compromised, an attacker could use the old token to interact with the bot. If the token is hardcoded into the firmware, a new OTA update with the new token embedded would be required. If the token is stored in non-volatile storage (e.g., NVS), a command could theoretically be sent to update it, but this assumes the legitimate owner can still send commands securely using the old, compromised token before an attacker does. Without a secure out-of-band mechanism or a robust in-band update process that authenticates the updater beyond just the token, rotating a compromised token on a deployed device remains a significant challenge.

### 4. Are there additional authentication layers beyond chat ID whitelisting worth implementing?
Yes, given that `FastBot` provides access to `userID` within the `FB_msg` structure (as noted in v2.11 updates: `usrID` and `ID` renamed to `userID` and `messageID`), several additional authentication layers are worth implementing:

1.  **User ID Whitelisting:** Beyond whitelisting the chat ID, the bot could maintain a whitelist of specific `userID`s that are authorized to send sensitive commands (like OTA updates). This adds a layer of defense, as even if an attacker gains access to a whitelisted chat, they would also need to impersonate an authorized user.
2.  **Command-Specific Authentication:** For critical commands like OTA, requiring a specific password, PIN, or a pre-shared secret phrase within the message text could serve as an additional authentication factor.
3.  **Rate Limiting:** Implementing rate limiting on the device itself for OTA update requests could mitigate brute-force attempts or accidental multiple re-flashes.
4.  **Cryptographic Signatures (Advanced):** For the highest level of assurance, the OTA `.bin` file or the command itself could be cryptographically signed by a trusted private key. The ESP32 device would then verify this signature using a pre-provisioned public key before initiating the update. This would protect against unauthorized firmware injection even if the Telegram channel is compromised.

### 5. Does Telegram's API guarantee message ordering / can updates be injected?
Yes, Telegram's API generally guarantees message ordering through the `update_id` mechanism. The `getUpdates` method, as described in the Telegram Bot API documentation, returns updates in a sequence based on their `update_id`. By using the `offset = update_id of last processed update + 1` parameter, the bot acknowledges and confirms updates, ensuring they are not returned again.

An attacker **cannot inject updates** with arbitrary `update_id`s into the past or manipulate the sequence of updates delivered by the Telegram server. The `update_id` is assigned by the Telegram server, and `getUpdates` will only return updates that the server has received and sequenced. An attacker can only send *new* messages (if they have access to a whitelisted chat), which will be assigned new `update_id`s by the Telegram server and processed in their natural order.

## Gaps / Follow-up

*   **HTTPS and Certificate Validation for ESP32:** The most significant gap is the explicit statement that FastBot operates "without SSL" and the lack of explicit HTTPS or certificate validation configuration for ESP32. This makes the OTA update process vulnerable to MITM attacks on untrusted networks. Further investigation is needed to confirm if `HTTPClient` on ESP32 defaults to any form of HTTPS, and if so, whether it performs certificate validation. If not, implementing `WiFiClientSecure` with proper certificate pinning or validation is a critical hardening step.
*   **Secure Bot Token Rotation Procedure:** While `setToken()` exists, a robust and secure procedure for rotating a compromised bot token on a deployed device (especially if physical access is limited or the attacker has control) is not outlined. This needs to be developed, potentially involving out-of-band mechanisms or a multi-factor authentication approach for token updates.
*   **Rate Limiting OTA Triggers:** The provided content does not detail any rate limiting mechanisms within FastBot or Telegram's API for receiving updates or downloading files. Implementing device-side rate limiting for OTA commands would be a valuable hardening measure to prevent abuse.

## Relevant Code/API Snippets

*   **FastBot's SSL Status:**
    ```cpp
    /* Работает на стандартных библиотетах без SSL */
    ```
*   **FastBot's ESP32 HTTP Client Initialization (lacks explicit SSL/cert config):**
    ```cpp
    #else // ESP32
    #include <WiFiClient.h>
    #include <HTTPClient.h>
    #ifndef FB_NO_OTA
    #include <Update.h>
    #endif
    #include <ArduinoJson.h>
    #endif // ================================
    // ...
    // In FastBot constructor:
    _http = new HTTPClient;
    // ...
    // In tickManual():
    #else // ESP32
    if (!_http->begin(req)) return 4; // ошибка подключения
    #endif
    ```
*   **FastBot's Token Setting:**
    ```cpp
    void setToken(const String& token) { _token = token; }
    ```
*   **FastBot's Chat ID Whitelisting:**
    ```cpp
    void setChatID(const String& chatID) { chatIDs = chatID; }
    void setChatID(int64_t id) { if (id) chatIDs = FB_64str(id); else chatIDs = ""; }
    ```
*   **Telegram API `getUpdates` Offset Mechanism:**
    ```
    offset = update_id of last processed update + 1
    ```
    (from `https://core.telegram.org/bots/faq#how-do-i-get-updates`)
*   **FastBot's `tickManual()` using `offset`:**
    ```cpp
    req += F("&offset="); req += ID;
    ```