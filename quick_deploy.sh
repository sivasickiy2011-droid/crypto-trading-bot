#!/bin/bash
set -e

HOST="158.160.162.231"
USER="root"
PASS="Xw1Utoce1!?!"
DIR="/var/www/universal-backend/python-gateway/functions/auth"

echo "🚀 Quick Deploy Auth Function"
echo "================================"

# Helper function
ssh_run() {
    sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "$1"
}

# Check sshpass
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass not installed. Install: brew install sshpass (Mac) or apt install sshpass (Linux)"
    exit 1
fi

# 1. Create directory
echo "📁 Creating directory..."
ssh_run "mkdir -p $DIR"

# 2. Copy files
echo "📤 Uploading files..."
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no backend/auth/index.py "$USER@$HOST:$DIR/"
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no backend/auth/requirements.txt "$USER@$HOST:$DIR/"
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no backend/auth/tests.json "$USER@$HOST:$DIR/"

# 3. Install dependencies
echo "📦 Installing dependencies..."
ssh_run "cd $DIR && pip3 install -r requirements.txt"

# 4. Generate hash and update DB
echo "🔐 Generating password hash..."
HASH=$(ssh_run "python3 -c \"import bcrypt; print(bcrypt.hashpw(b'Wqesad321', bcrypt.gensalt()).decode())\"")
echo "   Hash: $HASH"

echo "💾 Updating database..."
ssh_run "sudo -u postgres psql -d universal_backend -c \"ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);\""
ssh_run "sudo -u postgres psql -d universal_backend -c \"UPDATE users SET password_hash = '$HASH' WHERE username = 'suser';\""

echo "🔍 Verifying user..."
ssh_run "sudo -u postgres psql -d universal_backend -c \"SELECT id, username, LEFT(password_hash, 30) FROM users WHERE username = 'suser';\""

# 5. Restart service
echo "🔄 Restarting service..."
ssh_run "systemctl restart python-gateway"
sleep 2

echo "✅ Checking status..."
ssh_run "systemctl is-active python-gateway" || echo "⚠️  Service may not be active"

# 6. Verify
echo ""
echo "📋 Deployment Summary"
echo "================================"
ssh_run "ls -lh $DIR"
echo ""
echo "✅ Deployment complete!"
echo "   URL: https://function.centerai.tech/auth"
echo "   User: suser"
echo "   Password: Wqesad321"
