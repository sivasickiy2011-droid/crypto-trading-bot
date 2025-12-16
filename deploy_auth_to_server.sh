#!/bin/bash

# SSH credentials
SSH_HOST="158.160.162.231"
SSH_USER="root"
SSH_PASS="Xw1Utoce1!?!"
TARGET_DIR="/var/www/universal-backend/python-gateway/functions/auth"

echo "======================================"
echo "Deploying auth function to server"
echo "======================================"

# Function to execute commands via SSH
ssh_exec() {
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$1"
}

# Function to copy files via SCP
scp_copy() {
    sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no "$1" "$SSH_USER@$SSH_HOST:$2"
}

echo ""
echo "Step 1: Creating directory on server..."
ssh_exec "mkdir -p $TARGET_DIR"

echo ""
echo "Step 2: Copying files to server..."
scp_copy "backend/auth/index.py" "$TARGET_DIR/index.py"
scp_copy "backend/auth/requirements.txt" "$TARGET_DIR/requirements.txt"
scp_copy "backend/auth/tests.json" "$TARGET_DIR/tests.json"

echo ""
echo "Step 3: Installing dependencies..."
ssh_exec "cd $TARGET_DIR && pip3 install -r requirements.txt"

echo ""
echo "Step 4: Generating bcrypt hash for password 'Wqesad321'..."
HASH=$(ssh_exec "python3 << 'PYEOF'
import bcrypt
password = 'Wqesad321'
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(hashed)
PYEOF")

echo "Generated hash: $HASH"

echo ""
echo "Step 5: Updating user in database..."
ssh_exec "sudo -u postgres psql -d universal_backend << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
UPDATE users SET password_hash = '$HASH' WHERE username = 'suser';
SELECT id, username, LEFT(password_hash, 30) as hash_preview FROM users WHERE username = 'suser';
EOF"

echo ""
echo "Step 6: Restarting python-gateway service..."
ssh_exec "systemctl restart python-gateway"
sleep 2
ssh_exec "systemctl status python-gateway --no-pager -l"

echo ""
echo "======================================"
echo "Verification"
echo "======================================"

echo ""
echo "Directory contents:"
ssh_exec "ls -la $TARGET_DIR"

echo ""
echo "Done!"
