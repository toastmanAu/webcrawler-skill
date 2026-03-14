#!/bin/bash
# Setup SSH access to fiberquest Pi
# Run this on the fiberquest Pi: bash setup-fiberquest-ssh.sh

set -e

echo "Setting up SSH access for kernel..."

# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add the public key (single line, human-friendly)
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIP9GIVnWF08fEasX5go1UpceN8A0+5YrwSuePMn/IkE2 kernel@pi5-fiberquest
EOF

chmod 600 ~/.ssh/authorized_keys

echo "✅ SSH key added"
echo ""
echo "Verification:"
ls -la ~/.ssh/
echo ""
echo "Key count:"
wc -l ~/.ssh/authorized_keys
echo ""
echo "Done! Kernel can now SSH in."
