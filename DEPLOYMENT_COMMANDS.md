# Manual Deployment Commands for Auth Function

## Server Details
- **Host:** 158.160.162.231
- **User:** root
- **Password:** Xw1Utoce1!?!

## Option 1: Automated Deployment

```bash
# Make script executable
chmod +x deploy_auth_manual.sh

# Run deployment script
./deploy_auth_manual.sh
```

## Option 2: Manual Step-by-Step Commands

### 1. Create directory on server
```bash
sshpass -p 'Xw1Utoce1!?!' ssh -o StrictHostKeyChecking=no root@158.160.162.231 \
  "mkdir -p /var/www/universal-backend/python-gateway/functions/auth"
```

### 2. Copy index.py
```bash
sshpass -p 'Xw1Utoce1!?!' scp -o StrictHostKeyChecking=no \
  backend/auth/index.py \
  root@158.160.162.231:/var/www/universal-backend/python-gateway/functions/auth/index.py
```

### 3. Copy requirements.txt
```bash
sshpass -p 'Xw1Utoce1!?!' scp -o StrictHostKeyChecking=no \
  backend/auth/requirements.txt \
  root@158.160.162.231:/var/www/universal-backend/python-gateway/functions/auth/requirements.txt
```

### 4. Copy tests.json
```bash
sshpass -p 'Xw1Utoce1!?!' scp -o StrictHostKeyChecking=no \
  backend/auth/tests.json \
  root@158.160.162.231:/var/www/universal-backend/python-gateway/functions/auth/tests.json
```

### 5. Install dependencies
```bash
sshpass -p 'Xw1Utoce1!?!' ssh -o StrictHostKeyChecking=no root@158.160.162.231 \
  "cd /var/www/universal-backend/python-gateway/functions/auth && pip3 install -r requirements.txt"
```

### 6. Generate bcrypt hash
```bash
sshpass -p 'Xw1Utoce1!?!' ssh -o StrictHostKeyChecking=no root@158.160.162.231 \
  "python3 << 'PYEOF'
import bcrypt
password = 'Wqesad321'
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(f'Password hash: {hashed}')
PYEOF"
```

### 7. Update database (replace HASH with the output from step 6)
```bash
sshpass -p 'Xw1Utoce1!?!' ssh -o StrictHostKeyChecking=no root@158.160.162.231 \
  "sudo -u postgres psql -d universal_backend << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
UPDATE users SET password_hash = 'PASTE_HASH_HERE' WHERE username = 'suser';
SELECT id, username, LEFT(password_hash, 30) FROM users WHERE username = 'suser';
EOF"
```

### 8. Restart python-gateway service
```bash
sshpass -p 'Xw1Utoce1!?!' ssh -o StrictHostKeyChecking=no root@158.160.162.231 \
  "systemctl restart python-gateway"
```

### 9. Check service status
```bash
sshpass -p 'Xw1Utoce1!?!' ssh -o StrictHostKeyChecking=no root@158.160.162.231 \
  "systemctl status python-gateway --no-pager -l"
```

### 10. Verify deployment
```bash
sshpass -p 'Xw1Utoce1!?!' ssh -o StrictHostKeyChecking=no root@158.160.162.231 \
  "ls -la /var/www/universal-backend/python-gateway/functions/auth/"
```

## Option 3: Interactive SSH Session

```bash
# Connect to server
sshpass -p 'Xw1Utoce1!?!' ssh root@158.160.162.231

# Then run commands directly:
mkdir -p /var/www/universal-backend/python-gateway/functions/auth
cd /var/www/universal-backend/python-gateway/functions/auth

# Create index.py (you'll need to paste the content)
nano index.py

# Create requirements.txt
cat > requirements.txt << 'EOF'
psycopg2-binary==2.9.9
bcrypt==4.1.2
EOF

# Create tests.json (you'll need to paste the content)
nano tests.json

# Install dependencies
pip3 install -r requirements.txt

# Generate hash
python3 << 'PYEOF'
import bcrypt
password = 'Wqesad321'
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(f'Password hash: {hashed}')
PYEOF

# Update database (replace HASH)
sudo -u postgres psql -d universal_backend << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
UPDATE users SET password_hash = 'PASTE_HASH_HERE' WHERE username = 'suser';
SELECT id, username, LEFT(password_hash, 30) FROM users WHERE username = 'suser';
EOF

# Restart service
systemctl restart python-gateway
systemctl status python-gateway

# Verify
ls -la /var/www/universal-backend/python-gateway/functions/auth/
```

## Requirements

For automated deployment, you need `sshpass` installed:

- **Ubuntu/Debian:** `sudo apt-get install sshpass`
- **MacOS:** `brew install sshpass`
- **CentOS/RHEL:** `sudo yum install sshpass`

## Files to be deployed

1. **index.py** - Main auth handler with login, register, set_password actions
2. **requirements.txt** - Python dependencies (psycopg2-binary, bcrypt)
3. **tests.json** - Test cases for the function

## Expected Results

After successful deployment:
- Directory `/var/www/universal-backend/python-gateway/functions/auth/` should contain 3 files
- Dependencies should be installed in system Python
- User `suser` should have password hash for "Wqesad321"
- python-gateway service should be running (active)
