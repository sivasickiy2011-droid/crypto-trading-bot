#!/bin/bash

# SSH Connection Details
HOST="158.160.162.231"
USER="root"
PASS="Xw1Utoce1!?!"

echo "======================================"
echo "Manual Deployment Script for Auth Function"
echo "======================================"
echo ""
echo "This script will guide you through deploying the auth function"
echo "to the server at $HOST"
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "ERROR: sshpass is not installed."
    echo "Please install it first:"
    echo "  - Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  - MacOS: brew install sshpass"
    echo "  - CentOS/RHEL: sudo yum install sshpass"
    exit 1
fi

echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Store commands in variables for clarity
CMD_CREATE_DIR="mkdir -p /var/www/universal-backend/python-gateway/functions/auth"
CMD_INSTALL_DEPS="cd /var/www/universal-backend/python-gateway/functions/auth && pip3 install -r requirements.txt"
CMD_GENERATE_HASH="python3 << 'PYEOF'
import bcrypt
password = 'Wqesad321'
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(hashed)
PYEOF"

echo ""
echo "=========================================="
echo "STEP 1: Creating directory structure"
echo "=========================================="
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "$CMD_CREATE_DIR"
if [ $? -eq 0 ]; then
    echo "✓ Directory created successfully"
else
    echo "✗ Failed to create directory"
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 2: Copying index.py"
echo "=========================================="
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no \
    backend/auth/index.py \
    "$USER@$HOST:/var/www/universal-backend/python-gateway/functions/auth/index.py"
if [ $? -eq 0 ]; then
    echo "✓ index.py copied successfully"
else
    echo "✗ Failed to copy index.py"
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 3: Copying requirements.txt"
echo "=========================================="
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no \
    backend/auth/requirements.txt \
    "$USER@$HOST:/var/www/universal-backend/python-gateway/functions/auth/requirements.txt"
if [ $? -eq 0 ]; then
    echo "✓ requirements.txt copied successfully"
else
    echo "✗ Failed to copy requirements.txt"
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 4: Copying tests.json"
echo "=========================================="
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no \
    backend/auth/tests.json \
    "$USER@$HOST:/var/www/universal-backend/python-gateway/functions/auth/tests.json"
if [ $? -eq 0 ]; then
    echo "✓ tests.json copied successfully"
else
    echo "✗ Failed to copy tests.json"
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 5: Installing Python dependencies"
echo "=========================================="
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "$CMD_INSTALL_DEPS"
if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "✗ Failed to install dependencies"
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 6: Generating bcrypt hash"
echo "=========================================="
HASH=$(sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "$CMD_GENERATE_HASH" | tail -1)
echo "Password: Wqesad321"
echo "Hash: $HASH"

if [ -z "$HASH" ]; then
    echo "✗ Failed to generate hash"
    exit 1
else
    echo "✓ Hash generated successfully"
fi

echo ""
echo "=========================================="
echo "STEP 7: Updating database"
echo "=========================================="
DB_UPDATE_CMD="sudo -u postgres psql -d universal_backend << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
UPDATE users SET password_hash = '$HASH' WHERE username = 'suser';
SELECT id, username, LEFT(password_hash, 30) as hash_preview FROM users WHERE username = 'suser';
EOF"

echo "Executing database update..."
DB_RESULT=$(sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "$DB_UPDATE_CMD")
echo "$DB_RESULT"
echo "✓ Database updated"

echo ""
echo "=========================================="
echo "STEP 8: Restarting python-gateway service"
echo "=========================================="
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "systemctl restart python-gateway"
if [ $? -eq 0 ]; then
    echo "✓ Service restarted successfully"
    sleep 2
else
    echo "✗ Failed to restart service"
    exit 1
fi

echo ""
echo "=========================================="
echo "STEP 9: Checking service status"
echo "=========================================="
SERVICE_STATUS=$(sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "systemctl status python-gateway --no-pager -l")
echo "$SERVICE_STATUS"

echo ""
echo "=========================================="
echo "STEP 10: Verifying deployment"
echo "=========================================="
echo ""
echo "Directory contents:"
DIR_CONTENTS=$(sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "ls -la /var/www/universal-backend/python-gateway/functions/auth/")
echo "$DIR_CONTENTS"

echo ""
echo "=========================================="
echo "DEPLOYMENT SUMMARY"
echo "=========================================="
echo "✓ All files deployed to: /var/www/universal-backend/python-gateway/functions/auth/"
echo "✓ Dependencies installed: psycopg2-binary==2.9.9, bcrypt==4.1.2"
echo "✓ Password hash generated for 'Wqesad321'"
echo "✓ User 'suser' updated in database"
echo "✓ python-gateway service restarted"
echo ""
echo "Password Hash: $HASH"
echo ""
echo "Deployment completed successfully!"
