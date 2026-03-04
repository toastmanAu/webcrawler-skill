# Research: spore-dob-rendering-standards

**Date:** 2026-03-04  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/docs/core-concepts.md, https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/packages/core/src/codec/spore.ts, https://raw.githubusercontent.com/nervosnetwork/docs.nervos.org/develop/docs/dapp/spore-protocol.md, https://raw.githubusercontent.com/ckb-devrel/ckbfs/main/README.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0046-spore-protocol/0046-spore-protocol.md

---

Date: 2026-03-04

## Summary
The provided content, specifically the `spore.ts` codec definition, reveals the fundamental on-chain structure of Spore data. A Spore object primarily consists of a `contentType` (a string), `content` (raw bytes), and an optional `clusterId`. This structure allows for arbitrary content and content type specification. However, the available documentation does not define higher-level metadata standards (like name, description, or attributes) akin to ERC-721, nor does it detail how specific wallets (JoyID, Neuron) or explorers (CKB explorer) render `ckbfs://` URIs or Spore content.

## 1. Does JoyID wallet render ckbfs:// images natively, or does it need IPFS/HTTP?
The provided content does not contain any information about JoyID wallet, `ckbfs://` rendering, or its reliance on IPFS/HTTP. Therefore, I cannot answer this question based on the given sources.

## 2. Is there a Spore metadata standard for name, description, attributes (like ERC-721)?
Based on the `SporeData` molecule definition in `packages/core/src/codec/spore.ts`, the on-chain structure for a Spore includes `contentType`, `content`, and `clusterId`. There are no explicit fields defined for `name`, `description`, or `attributes` within this core Spore data structure, unlike the metadata standards seen in ERC-721 (which typically points to a JSON URI containing such fields). The `content` field holds raw bytes, and its interpretation depends on the `contentType`.

## 3. How does the CKB explorer (explorer.nervos.org) render Spore/DOB content?
The provided content does not contain any information about how `explorer.nervos.org` renders Spore or DOB content. Therefore, I cannot answer this question based on the given sources.

## 4. What content-types are well-supported across wallets — image/jpeg, image/png, image/svg+xml?
The `SporeData` molecule defines a `contentType` field as `blockchain.Bytes`, which is unpacked to a `string` (e.g., via `bufferToRawString`). This means the Spore protocol itself allows for any string to be specified as a content type. However, the provided content does not specify which *specific* content types (like `image/jpeg`, `image/png`, `image/svg+xml`) are well-supported across wallets. The protocol defines the *mechanism* to declare a content type, but not the *ecosystem's rendering capabilities*.

## 5. For the Founding Member DOB: what's the best content strategy to maximise wallet display compatibility?
The provided content does not offer any information regarding wallet display compatibility for specific content types or rendering strategies. The `spore.ts` file only defines the basic on-chain structure (`contentType`, `content`, `clusterId`). Therefore, I cannot recommend a content strategy to maximise wallet display compatibility based on the given sources.

## Gaps / Follow-up
The primary gap is the significant amount of missing documentation due to `[FETCH ERROR: HTTP Error 404: Not Found]` for most of the provided URLs. This includes:
*   `core-concepts.md`: Would likely explain the fundamental design and purpose of Spores.
*   `spore-protocol.md` (from `docs.nervos.org`): Would likely detail the protocol's specifications, including potential metadata standards or rendering guidelines.
*   `ckbfs/main/README.md`: Crucial for understanding `ckbfs://` URIs, their resolution, and how they are intended to be used with Spores.
*   `0046-spore-protocol.md` (RFC): Would provide the definitive technical specification for the Spore protocol, which should include metadata standards if they exist.

Specific follow-up questions that remain unanswered due to these gaps include:
*   How are `ckbfs://` URIs resolved and interpreted by wallets and explorers?
*   Is there an off-chain or secondary metadata standard (e.g., a JSON structure pointed to by a `ckbfs://` URI within the Spore's `content`) that defines `name`, `description`, and `attributes`?
*   What are the actual rendering capabilities and limitations of specific wallets (JoyID, Neuron) and the CKB explorer for various content types and `ckbfs://` content?
*   Are there any recommended best practices or common conventions for `contentType` values and `content` structures to ensure broad compatibility?
*   What is the intended use and structure of `clusterId`?

## Relevant Code/API Snippets

```typescript
// From https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/packages/core/src/codec/spore.ts

import { blockchain } from '@ckb-lumos/base';
import { BytesLike, molecule } from '@ckb-lumos/codec';
import { bufferToRawString, bytifyRawString } from '../helpers';

export const SporeData = molecule.table(
  {
    contentType: blockchain.Bytes,
    content: blockchain.Bytes,
    clusterId: blockchain.BytesOpt,
  },
  ['contentType', 'content', 'clusterId'],
);

export interface RawSporeData {
  contentType: string;
  content: Parameters<typeof SporeData.pack>[0]['content'];
  clusterId: Parameters<typeof SporeData.pack>[0]['clusterId'];
}

export function packRawSporeData(packable: RawSporeData) {
  return SporeData.pack({
    contentType: bytifyRawString(packable.contentType),
    content: packable.content,
    clusterId: packable.clusterId,
  });
}

export function unpackToRawSporeData(unpackable: BytesLike): RawSporeData {
  const unpacked = SporeData.unpack(unpackable);
  return {
    contentType: bufferToRawString(unpacked.contentType),
    content: unpacked.content,
    clusterId: unpacked.clusterId,
  };
}
```