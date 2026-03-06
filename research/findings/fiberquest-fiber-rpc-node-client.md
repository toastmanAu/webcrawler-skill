# Research: fiberquest-fiber-rpc-node-client

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/rpc.md, https://api.github.com/repos/nervosnetwork/fiber/contents/src/rpc, https://raw.githubusercontent.com/nervosnetwork/fiber/main/src/rpc/types.rs, https://raw.githubusercontent.com/nervosnetwork/fiber-scripts/main/README.md

---

## Research Note: fiberquest-fiber-rpc-node-client

**Date:** 2026-03-06

### Summary
The Fiber Network Node (FNN) is a reference implementation for the Fiber Network Protocol, a payment channel network on CKB. While the FNN supports RPC methods for channel management and payments, detailed JSON-RPC specifications and curl examples for specific methods like `open_channel`, `send_payment`, `list_channels`, and `close_channel` are not provided in the available content. There is no official Node.js Fiber client library, necessitating a custom implementation. The FNN RPC interface does not appear to require authentication based on the provided documentation, suggesting it's designed for localhost access. The specific format for payment invoices is also not detailed in the provided materials.

### Questions to Answer

#### 1. Exact curl examples for open_channel, send_payment, list_channels, close_channel that confirm working JSON format against a real fnn node

The provided content mentions RPC documentation at `crates/fiber-lib/src/rpc/README.md` for `list_channels` and `shutdown_channel` (which is likely `close_channel`). However, the *content* of `crates/fiber-lib/src/rpc/README.md` is not included in the provided source material. Therefore, exact curl examples confirming the working JSON format for `open_channel`, `send_payment`, `list_channels`, and `close_channel` cannot be provided from the given information.

#### 2. Any existing Node.js Fiber RPC clients or wrappers (npm packages, GitHub repos)

Based on the "Project Ground Truth" section, there is **no official Node.js Fiber client library**. The project explicitly states: "Key gap: no official Node.js Fiber client library exists — must build from Rust RPC source."

#### 3. Error response format — what does fnn return on invalid params?

The provided `nervosnetwork/fiber/main/README.md` does not contain any information or examples detailing the error response format that FNN returns on invalid parameters.

#### 4. Does fnn require authentication (API key, JWT) or is it open localhost-only?

The provided content does not mention any authentication mechanisms such as API keys or JWTs for the FNN RPC interface. The `FIBER_SECRET_KEY_PASSWORD` environment variable is mentioned for encrypting the wallet private key file when *starting* the node, not for authenticating RPC calls. Based solely on the provided information, the FNN RPC appears to be open localhost-only.

#### 5. Invoice format for send_payment — does it use BOLT11-style or CKB-native format?

The `nervosnetwork/fiber/main/README.md` links to `docs/specs/payment-invoice.md` for the "Invoice Protocol." However, the *content* of this document is not included in the provided source material. Therefore, the specific invoice format for `send_payment` (e.g., whether it uses BOLT11-style or a CKB-native format) cannot be determined from the given information. The `README.md` does mention "Cross-network asset payment/swap, e.g. from Lightning network to Fiber network, and vice versa," which might imply some compatibility or conversion, but the specific invoice format is not detailed.

### Gaps / Follow-up

1.  **Detailed RPC Documentation:** The most significant gap is the lack of the actual content for `crates/fiber-lib/src/rpc/README.md` and `docs/specs/payment-invoice.md`. Accessing these documents would directly answer questions regarding exact curl examples, JSON formats for RPC calls, and the invoice format.
2.  **Error Response Specification:** A clear specification of FNN's JSON-RPC error response format is needed for robust client implementation.
3.  **Authentication Confirmation:** While the provided content suggests localhost-only access without explicit authentication, it would be beneficial to confirm this definitively or understand if any implicit security measures are in place for RPC access.

### Relevant Code/API Snippets

No direct code or API snippets for the FNN RPC client or its JSON format could be extracted from the provided content due to the missing linked documentation.