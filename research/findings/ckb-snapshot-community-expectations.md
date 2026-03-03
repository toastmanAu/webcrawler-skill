# Research: ckb-snapshot-community-expectations

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/run-ckb-with-docker.md, https://github.com/nervosnetwork/ckb/discussions, https://github.com/nervosnetwork/ckb/issues, https://docs.nervos.org/

---

## Research Note: ckb-snapshot-community-expectations

**Date:** 2026-03-03

### Summary
The provided web content offers limited specific details regarding CKB community preferences for snapshot compression formats, existing community-hosted snapshot solutions, or versioning strategies. While the official Nervos CKB documentation points to a "Run a Node" section, the specifics of how users bootstrap new mainnet nodes (e.g., full sync vs. snapshot usage) are not detailed in the provided snippets. Information on snapshot practices from other blockchain projects (Bitcoin, Ethereum, Substrate) is also absent from the CKB-specific sources.

### 1. What compression formats (e.g., zstd, lz4, gz) are commonly used or preferred by the CKB community for node snapshots?
The provided content does not mention any specific compression formats (e.g., zstd, lz4, gz) that are commonly used or preferred by the CKB community for node snapshots.

### 2. Are there any existing, community-hosted CKB snapshots available, and if so, where are they hosted and what are their characteristics (size, update frequency, format)?
The provided content does not mention any existing, community-hosted CKB snapshots, nor does it provide details about their hosting, characteristics (size, update frequency, format). The "Community Projects" section on `docs.nervos.org` lists applications, tools, and initiatives but does not specifically mention snapshot hosting.

### 3. What versioning strategies (e.g., date-based filenames, "latest" symlinks/redirects) do other blockchain projects (Bitcoin, Ethereum, Substrate) use for their snapshots, and which would be most suitable for CKB?
The provided content is exclusively focused on Nervos CKB and does not contain any information regarding the versioning strategies used by other blockchain projects like Bitcoin, Ethereum, or Substrate for their snapshots. Therefore, it is not possible to determine which strategy would be most suitable for CKB based on the given sources.

### 4. How do CKB users currently bootstrap new nodes?
The provided content indicates that the Nervos CKB documentation includes a "Run a Node" section, which covers "Install, configure, and operate CKB nodes" (`https://docs.nervos.org/`). However, the specifics of the bootstrapping process (e.g., whether it involves a full sync from genesis, downloading a pre-synced data directory, or using a specific tool) are not detailed within the provided snippets.

For developing dApps on the CKB Devnet, users are instructed to "Run the command below in your terminal to start developing dApps on the CKB Devnet immediately":
```bash
npm install -g @offckb/cli
```
(Source: `https://docs.nervos.org/`)

The `https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/run-ckb-with-docker.md` document, which might have contained relevant bootstrapping instructions, resulted in an HTTP 404 error and could not be accessed.

### Gaps / Follow-up
*   **Snapshot Compression & Hosting:** The provided content lacks any specific information on preferred compression formats or the existence and characteristics of community-hosted CKB snapshots. Further investigation into CKB community forums, Discord channels, or older documentation might be necessary.
*   **Mainnet Node Bootstrapping Details:** While a "Run a Node" section is mentioned, the actual steps and common practices for bootstrapping a *mainnet* CKB node (e.g., full sync duration, recommended hardware, or if pre-synced data is commonly used) are not detailed. The `run-ckb-with-docker.md` file, which was inaccessible, might have contained this information.
*   **Versioning Strategies:** To answer the question about versioning strategies from other blockchain projects, external research beyond the provided CKB content is required.
*   **GitHub Discussions/Issues Content:** The provided snippets for `github.com/nervosnetwork/ckb/discussions` and `github.com/nervosnetwork/ckb/issues` were only navigation headers. Accessing the actual content of these discussions and issues could reveal community preferences or existing solutions related to snapshots.

### Relevant Code/API Snippets
*   **CKB Devnet dApp Development CLI:**
    ```bash
    npm install -g @offckb/cli
    ```
    (Source: `https://docs.nervos.org/`)