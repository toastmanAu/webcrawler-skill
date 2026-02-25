#!/usr/bin/env python3
"""gemini-image.py <image_path> <prompt>
Analyse an image using Gemini 2.0 Flash via REST API.
Requires GEMINI_API_KEY env var.
"""
import base64, json, sys, os, urllib.request

KEY = os.environ.get('GEMINI_API_KEY')
if not KEY:
    print("ERROR: GEMINI_API_KEY not set", file=sys.stderr)
    sys.exit(1)

if len(sys.argv) < 3:
    print(f"Usage: {sys.argv[0]} <image_path> <prompt>", file=sys.stderr)
    sys.exit(1)

img_path, prompt = sys.argv[1], sys.argv[2]
with open(img_path, 'rb') as f:
    img_b64 = base64.b64encode(f.read()).decode()

# Detect mime type from extension
ext = img_path.rsplit('.', 1)[-1].lower()
mime = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'webp': 'image/webp'}.get(ext, 'image/jpeg')

payload = json.dumps({
    "contents": [{"parts": [
        {"text": prompt},
        {"inline_data": {"mime_type": mime, "data": img_b64}}
    ]}]
}).encode()

req = urllib.request.Request(
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={KEY}",
    data=payload,
    headers={"Content-Type": "application/json"}
)
try:
    r = json.loads(urllib.request.urlopen(req, timeout=30).read())
    print(r['candidates'][0]['content']['parts'][0]['text'])
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"ERROR {e.code}: {body}", file=sys.stderr)
    sys.exit(1)
