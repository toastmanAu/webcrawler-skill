# Crypto Trade Dashboard — Build Status

## ✅ COMPLETE — running on port 9995

## Checkpoints
- [x] **SCAFFOLD DONE**
- [x] **PROVIDERS DONE**
- [x] **ANALYTICS DONE**
- [x] **UI DONE**
- [x] **COMPLETE — running on port 9995**

## Live Status
- Server: **http://pi5:9995/** ✅
- BTC: ~$71,470 live from CoinGecko
- OHLCV rows: 264,000 (90-day history, 124 assets)
- Assets ranked: 100 (top 100 non-stablecoin with Binance USDT pairs)
- Scheduler: benchmark every 2min ✅, universe every 10min ✅, metadata hourly ✅
- Ollama: Available at 192.168.68.79:11434 ✅
- Tests: 31/31 passing ✅
- Git: committed

## Sample Rankings (live)
- AR     A     score=78.6  RSI=51  mom7d=+16.6%
- EIGEN  A     score=78.0  RSI=79  mom7d=+22.2%
- SUI    A     score=76.5  RSI=48  mom7d=+13.7%
- XLM    A     score=75.1  RSI=53  mom7d=+12.7%
- DOGE   A     score=75.0  RSI=41  mom7d=+7.0%

## Deployment (systemd)
```bash
cd /home/phill/crypto-trade-dashboard
sudo cp crypto-dash.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now crypto-dash
sudo journalctl -fu crypto-dash
```

## Notes
- Test data (BTC/ETH/ADA with fixed scores) appears in DB from pytest run — will flush after 10min as new universe rankings overwrite
- CoinGecko free tier: 241 assets returned, 124 with Binance USDT pairs
- No API key needed for either data source
