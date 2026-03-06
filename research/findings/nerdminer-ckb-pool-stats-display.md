# Research: nerdminer-ckb-pool-stats-display

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/BitMaker-hub/NerdMiner_v2/main/src/stratum.cpp, https://raw.githubusercontent.com/BitMaker-hub/NerdMiner_v2/main/src/stratum.h, https://raw.githubusercontent.com/BitMaker-hub/NerdMiner_v2/main/src/monitor.cpp, https://raw.githubusercontent.com/toastmanAu/NerdMiner_CKB/master/src/stratum.cpp, https://viabtc.com/tools/mining_api

---

Date: 2026-03-06

## Summary

Research into displaying live pool statistics on the NerdMiner CKB screen reveals that ViaBTC's public API documentation was inaccessible, preventing direct analysis of its capabilities for per-worker stats. The Stratum protocol, as implemented in NerdMiner CKB, sends `mining.submit` messages to the pool, and the pool's response to this message indicates whether a share was accepted or rejected. However, the provided NerdMiner CKB code does not currently parse these responses to track pool-side accepted/rejected shares. Instead, it tracks locally found shares. Information regarding screen real estate changes for the CYD display and alternative CKB mining pools with better APIs could not be determined from the provided content.

## Questions to Answer

### 1. Does ViaBTC expose a public REST API for per-worker stats (hashrate, shares, earnings)?

Based on the provided content, the link `https://viabtc.com/tools/mining_api` resulted in a `[FETCH ERROR: HTTP Error 404: Not Found]`. Therefore, the provided content does not confirm the existence or details of a public REST API from ViaBTC for per-worker statistics.

### 2. What stratum protocol messages carry accepted/rejected share counts?

The Stratum protocol messages that carry information about accepted or rejected shares are the *responses* to the `mining.submit` request. When a miner sends a `mining.submit` message, the pool responds with a JSON-RPC message containing a `result` field (typically `true` for accepted, `false` for rejected) and an optional `error` array for rejections.

For example, a successful submission might receive:
`{"id": <submit_id>, "result": true, "error": null}`

A rejected submission might receive:
`{"id": <submit_id>, "result": false, "error": [20, "Low difficulty share", null]}`

The provided `NerdMiner_v2/src/stratum.cpp` and `NerdMiner_CKB/master/src/stratum.cpp` both implement `tx_mining_submit` to send the submission. While they read the response line from the client (`client.readStringUntil('\n')`), the `parse_extract_id` function is used only to extract the `id` from the response, not to parse the `result` or `error` fields to determine share acceptance or rejection status.

### 3. How does NerdMiner v2 currently track shares accepted/rejected locally?

The `NerdMiner_v2/src/monitor.cpp` file declares `extern uint32_t shares;` and `extern uint32_t valids;`. These variables are used in the `getMiningData` function to report `data.completedShares = shares;` and `data.valids = valids;`.

The comment next to `extern uint32_t shares;` states `// increase if blockhash has 32 bits of zeroes`. This suggests `shares` is incremented when a locally found hash meets a certain difficulty threshold (e.g., the local difficulty, or a minimum share difficulty). The `valids` variable's comment is truncated, but it likely tracks shares that meet the pool's difficulty and are submitted.

However, based *only* on the provided `stratum.cpp` and `monitor.cpp` files, there is no explicit code shown that parses the `mining.submit` response from the pool to update `shares` or `valids` based on whether the *pool* accepted or rejected the submitted share. The tracking appears to be based on local calculations and conditions *before* or *during* submission, rather than direct feedback from the mining pool's `mining.submit` response.

### 4. What screen real estate changes are needed to show pool stats on the CYD display?

The provided content does not include any information about the display layout, UI components, or screen dimensions for the ESP32-2432S028R (CYD) display. Therefore, it is not possible to determine what screen real estate changes would be needed from the given content.

### 5. Is there a better pool with a more accessible API we should consider for CKB?

The provided content explicitly mentions that `ckb-stratum-proxy` handles "ViaBTC quirks (5-param notify, set_target)" and `NerdMiner_CKB/master/src/stratum.cpp` includes logic to parse the "ViaBTC CKB sends 5 params" format for `mining.notify`. This indicates that ViaBTC is currently being used and its specific protocol variations are handled.

However, the provided content does not list or compare other CKB mining pools or their API accessibility. While the ViaBTC API link provided resulted in a 404 error, the content does not offer alternatives or suggest "better" pools. Therefore, based solely on the provided information, it is not possible to recommend a better pool with a more accessible API.

## Gaps / Follow-up

1.  **ViaBTC API Documentation:** Further investigation is needed to find current and public ViaBTC API documentation for CKB mining pool statistics. The provided link was broken.
2.  **NerdMiner Local Share Tracking Logic:** The exact logic for incrementing `shares` and `valids` in NerdMiner v2 (and by extension, NerdMiner CKB) needs to be located, likely in `mining.h` or other related C/C++ files not provided, to fully understand how local shares are counted.
3.  **Stratum Response Parsing for Shares:** To display pool-side accepted/rejected shares, the `NerdMiner_CKB` code needs to be extended to parse the `result` field of the `mining.submit` response from the pool and update dedicated counters accordingly.
4.  **CYD Display UI/UX:** Detailed UI/UX design and screen real estate analysis for the ESP32-2432S028R (CYD) display are required to plan the integration of new pool statistics. This would involve examining existing display code and available screen space.
5.  **Alternative CKB Pools:** Research into other CKB mining pools (e.g., F2Pool, SparkPool, etc.) and their public API offerings would be necessary to identify alternatives to ViaBTC with potentially more accessible or feature-rich APIs.

## Relevant Code/API Snippets

**NerdMiner_v2/src/stratum.cpp (and similar in NerdMiner_CKB/master/src/stratum.cpp):**
```cpp
// Method Mining.submit
bool tx_mining_submit(WiFiClient& client, mining_subscribe mWorker, mining_job mJob, unsigned long nonce, unsigned long &submit_id) {
    char payload[BUFFER] = {0};
    // Submit
    id = getNextId(id);
    submit_id = id;
    sprintf(payload, "{\"id\":%u,\"method\":\"mining.submit\",\"params\":[\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"]}\n",
            id, mWorker.wName, mJob.job_id.c_str(), mWorker.extranonce2.c_str(), mJob.ntime.c_str(), String(nonce, HEX).c_str() );
    Serial.print(" Sending : ");
    Serial.print(payload);
    client.print(payload);
    //Serial.print(" Receiving: "); Serial.println(client.readStringUntil('\n')); // This line reads the response
    return true;
}

unsigned long parse_extract_id(const String &line) {
    DeserializationError error = deserializeJson(doc, line);
    if (error) return 0;
    if (!doc.containsKey("id")) return 0;
    unsigned long id = doc["id"];
    return id;
}
```
*Note: The `client.readStringUntil('\n')` call reads the pool's response, but `parse_extract_id` only extracts the ID, not the `result` or `error` fields indicating share acceptance/rejection.*

**NerdMiner_v2/src/monitor.cpp:**
```cpp
extern uint32_t shares; // increase if blockhash has 32 bits of zeroes
extern uint32_t valids; // increased if blockhash UPDATE_Global_min * 60 * 1000)){ // Comment truncated

mining_data getMiningData(unsigned long mElapsed) {
    mining_data data;
    // ... other data assignments ...
    data.completedShares = shares;
    data.valids = valids;
    // ...
    return data;
}
```
*Note: `shares` and `valids` are declared as `extern` and their incrementing logic is not present in the provided `monitor.cpp` or `stratum.cpp` files.*

**NerdMiner_CKB/master/src/stratum.cpp (ViaBTC specific parsing):**
```cpp
bool parse_mining_notify(String line, mining_job& mJob) {
    // ...
    size_t nparams = doc["params"].size();
    if (nparams >= 5 && doc["params"][2].is<uint32_t>()) {
        /* 5-param ViaBTC format */
        pow_hash_hex = (const char*)doc["params"][1];
        uint32_t height = (uint32_t)doc["params"][2];
        target_hex = (const char*)doc["params"][3];
        mJob.clean_jobs = doc["params"][4];
        Serial.printf(" [5-param] block_height: %u\n", height);
    } else {
        /* 4-param standard format */
        pow_hash_hex = (const char*)doc["params"][1];
        target_hex = (const char*)doc["params"][2];
        mJob.clean_jobs = doc["params"][3];
    }
    // ...
}
```
*Note: This snippet demonstrates specific handling for ViaBTC's `mining.notify` format, indicating current reliance on this pool.*