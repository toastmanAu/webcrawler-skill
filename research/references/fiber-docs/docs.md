Source: https://docs.fiber.world/docs
Saved: 2026-03-18

---

What is Fiber Network?
No Listed Requirements
Updated 2025-02-10
Stable

Fiber network is a peer-to-peer payment/swap network (like Lightning Network). We believe payment and swap are the two foundational primitives of finance. Fiber Network Node (FNN) is a reference node implementation of Fiber Network Protocol (FNP).

Features
Multiple assets support, e.g. stable coins, RGB++ assets issued on Bitcoin ledger, and UDT assets issued on CKB ledger;
Extremely low-cost micropayments, e.g. 0.0001 cent payment with 0.00000001 cent fee;
Instant swap between any asset pairs, as long as there's available channel paths;
Cross-network asset payment/swap, e.g. from Lightning network to Fiber network, and vice versa;
Watchtower support, make it easier for node operators;
Multi-hop payment, anyone can facilitate payments and earn payment fees by running a fiber node and becoming a hop on payment paths;
Low latency, e.g. 0.0001 cent payment in your p2p connection latency, e.g. 20ms;
High throughput, because transactions are only processed by involved peers, no network consensus required;
High privacy, your transactions are only seen by involved peers;
Based on more advanced cryptographic techniques to ensure security and privacy, e.g. uses PTLC not HTLC;
Composable with other contracts/scripts on CKB;
Roadmap
 Establishing connections with other fiber nodes
 Creating and closing fiber channel
 Payments over fiber channel (via [fiber-scripts])
 Cross-network asset transfer
 Web-browser friendly runtime
 Programmable conditional payment
 Advanced channel liquidity management
 Atomic multi-path payment

Run a Fiber Node

Learn how to run a Testnet node on your local machine