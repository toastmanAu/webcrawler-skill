# Run a Fiber Node

Source: https://docs.fiber.world/docs/quick-start/run-a-node  
Saved: 2026-03-18  
Version referenced: v0.6.1 (latest at time of save)

## Prerequisites
- Git + Rust/Cargo (if building from source)
- ckb-cli for key management

## 1. Get binary
```bash
git clone https://github.com/nervosnetwork/fiber.git
cd fiber && cargo build --release
# or download from: https://github.com/nervosnetwork/fiber/releases
```

## 2. Create node directory
```bash
mkdir /path/to/my-fnn
cp target/release/fnn /path/to/my-fnn
cp config/testnet/config.yml /path/to/my-fnn
cd /path/to/my-fnn
```

## 3. Set up keys
```bash
ckb-cli account new
# note the lock_arg from output
mkdir ckb
ckb-cli account export --lock-arg <lock_arg> --extended-privkey-path ./ckb/exported-key
head -n 1 ./ckb/exported-key > ./ckb/key
```

## 4. Start node
```bash
FIBER_SECRET_KEY_PASSWORD='yourpassword' RUST_LOG=info ./fnn -c config.yml -d .
```

## Upgrade process (safe)
1. List + close all channels via RPC
2. Stop node: `rm -rf /path/to/my-fnn/fiber/store`
3. Replace binary, restart

## Optional migration (keep channel state)
```bash
cp -r fiber/store fiber/store.backup
fnn-migrate -p fiber/store
# then replace binary + restart
```
