#!/bin/bash
# Crawl docs.fiber.world and save as local markdown reference
# Usage: bash crawl-fiber-docs.sh

OUT_DIR="$HOME/.openclaw/workspace/research/references/fiber-docs"
mkdir -p "$OUT_DIR"

PAGES=(
  "https://docs.fiber.world/docs"
  "https://docs.fiber.world/docs/getting-started"
  "https://docs.fiber.world/docs/getting-started/installation"
  "https://docs.fiber.world/docs/getting-started/configuration"
  "https://docs.fiber.world/docs/getting-started/running"
  "https://docs.fiber.world/docs/rpc"
  "https://docs.fiber.world/docs/rpc/authentication"
  "https://docs.fiber.world/docs/rpc/biscuit"
  "https://docs.fiber.world/docs/rpc/methods"
  "https://docs.fiber.world/docs/rpc/channels"
  "https://docs.fiber.world/docs/rpc/payments"
  "https://docs.fiber.world/docs/concepts"
  "https://docs.fiber.world/docs/concepts/channels"
  "https://docs.fiber.world/docs/concepts/payments"
  "https://docs.fiber.world/blog"
)

for URL in "${PAGES[@]}"; do
  SLUG=$(echo "$URL" | sed 's|https://docs.fiber.world/||' | tr '/' '-')
  OUT="$OUT_DIR/${SLUG}.md"
  echo "Fetching $URL → $OUT"
  # Use chromium headless to render JS then extract text
  timeout 15 chromium-browser \
    --headless=new \
    --no-sandbox \
    --disable-gpu \
    --dump-dom \
    "$URL" 2>/dev/null | \
    python3 -c "
import sys, re
html = sys.stdin.read()
# Strip scripts, styles, nav boilerplate
html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
html = re.sub(r'<nav[^>]*>.*?</nav>', '', html, flags=re.DOTALL)
html = re.sub(r'<header[^>]*>.*?</header>', '', html, flags=re.DOTALL)
html = re.sub(r'<footer[^>]*>.*?</footer>', '', html, flags=re.DOTALL)
# Strip remaining tags
text = re.sub(r'<[^>]+>', ' ', html)
text = re.sub(r'&[a-z]+;', ' ', text)
text = re.sub(r'[ \t]+', ' ', text)
text = re.sub(r'\n{3,}', '\n\n', text)
text = text.strip()
print(text[:8000])  # cap at 8KB per page
" > "$OUT" 2>/dev/null
  
  SIZE=$(wc -c < "$OUT" 2>/dev/null || echo 0)
  if [ "$SIZE" -lt 100 ]; then
    echo "  ⚠️  Too small ($SIZE bytes) — JS rendering may have failed"
    rm -f "$OUT"
  else
    echo "  ✓ Saved ${SIZE} bytes"
  fi
  sleep 1
done

echo ""
echo "Done. Saved to $OUT_DIR"
ls -lh "$OUT_DIR"
