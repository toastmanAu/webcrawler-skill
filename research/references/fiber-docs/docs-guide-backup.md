Source: https://docs.fiber.world/docs/guide/backup
Saved: 2026-03-18

---

Fiber Node Backup Guide

How to backup and restore Fiber node data

Requirements
by gpBlockchain
Updated 2025-06-10
Latest
Fiber Node
v0.6.1

This guide explains how to securely back up Fiber node data to safeguard funds, maintain node identity, and ensure smooth migration or upgrades. Never store plaintext private keys, as they risk theft if exposed.

1. Why Back Up?

Backups protect:

Funds: The encrypted private key (ckb/key) and its password (FIBER_SECRET_KEY_PASSWORD) are critical for accessing funds. Losing either makes funds unrecoverable.
Node Identity: The network ID key (fiber/sk) allows other nodes to recognize your node. Losing it disrupts network communication.

Warning: Always stop the node before backing up to prevent data corruption, which could cause errors or loss of funds.

2. Backing Up Node Data

Back up the entire node directory (node1), which includes:

ckb/key (encrypted private key)
fiber/sk (network ID key)
fiber/store (database files)
config.yml (configuration)

Steps:

Stop the Node:
# Check for running node processes
ps aux | grep fnn
# Example output: ckb 3585187 0.7 2.4 756932 194052 ? Sl May07 71:52 ./fnn -c ./node1/config.yml -d ./node1
# Terminate it (replace 3585187 with your process ID)
kill 3585187
Create Backup:
tar -zcvf node1.tar.gz node1
Store Securely: Save node1.tar.gz and the FIBER_SECRET_KEY_PASSWORD in an offline, encrypted environment (e.g., an encrypted drive or password manager).

Note: A future update will allow backups without stopping the node. Check release notes for updates.

3. Restoring Node Data

Steps:

Extract Backup:
tar -zxvf node1.tar.gz
Start Node:
FIBER_SECRET_KEY_PASSWORD='YOUR_PASSWORD' ./fnn -c ./node1/config.yml -d ./node1

Warning: Using the wrong password will trigger a startup error (Secret key file error: decryption failed). Double-check the password before starting.

4. Handling Forgotten Passwords

If you lose the FIBER_SECRET_KEY_PASSWORD but have a plaintext private key (not recommended), you can reset the password.

Steps:

Extract Backup:
tar -zxvf node1.tar.gz
Remove Encrypted Key:
rm -rf node1/ckb
Add Plaintext Key:
mkdir node1/ckb
echo "YOUR_PLAINTEXT_KEY" > node1/ckb/key
Start Node with New Password:
FIBER_SECRET_KEY_PASSWORD='NEW_PASSWORD' ./fnn -c ./node1/config.yml -d ./node1
Secure the Key: The ckb/key file will be re-encrypted with the new password. Store the new password securely.

Build a Game with Fiber

A simple JavaScript game example with Fiber micro-payments

Fiber Network Glossary

Simple and non-technical explanations of key Fiber Network terminology