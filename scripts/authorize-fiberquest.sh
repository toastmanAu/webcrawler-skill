#!/bin/bash
# Simple SSH key authorization server
# Run on current Pi (this machine) to allow FiberQuest Pi to auth itself
# Usage: bash authorize-fiberquest.sh

set -e

PORT=9999
KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP9GIVnWF08fEasX5go1UpceN8A0+5YrwSuePMn/IkE2 kernel@pi5-fiberquest"

echo "Starting SSH key authorization server on port $PORT"
echo "FiberQuest Pi can fetch the key with:"
echo "  curl http://192.168.68.X:9999/auth | bash"
echo ""

# Simple HTTP server that returns the auth script
python3 << 'PYEOF'
import http.server
import socketserver
import json

PORT = 9999
KEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP9GIVnWF08fEasX5go1UpceN8A0+5YrwSuePMn/IkE2 kernel@pi5-fiberquest"

class AuthHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/auth':
            # Return bash script to add key
            script = f"""#!/bin/bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '{KEY}' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✅ Kernel SSH access authorized"
"""
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(script.encode())
            print(f"[{self.client_address[0]}] Served auth script")
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # Suppress default logging, we'll do our own
        pass

with socketserver.TCPServer(("", PORT), AuthHandler) as httpd:
    print(f"Server running on port {PORT}...")
    print("Press Ctrl+C to stop")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutdown.")
PYEOF
