#!/bin/bash
# Free image generation via Pollinations.ai — no API key needed
# Usage: gen-image.sh "your prompt" [output.jpg] [width] [height]

PROMPT="${1:-a cute lobster}"
OUT="${2:-/tmp/generated.jpg}"
WIDTH="${3:-1024}"
HEIGHT="${4:-1024}"

ENCODED=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$PROMPT")
URL="https://image.pollinations.ai/prompt/${ENCODED}?width=${WIDTH}&height=${HEIGHT}&nologo=true&model=flux"

echo "Generating: $PROMPT"
echo "URL: $URL"
curl -sL --max-time 60 -o "$OUT" "$URL" && echo "Saved to: $OUT" || echo "Failed"
