#!/usr/bin/env python3
"""
Deploy auth function to remote server
Requires: pip install paramiko bcrypt
"""

import os
import sys
import time
import bcrypt
from paramiko import SSHClient, AutoAddPolicy

# Server configuration
HOST = "158.160.162.231"
USER = "root"
PASSWORD = "Xw1Utoce1!?!"
TARGET_DIR = "/var/www/universal-backend/python-gateway/functions/auth"

# Local files
FILES = {
    "index.py": "backend/auth/index.py",
    "requirements.txt": "backend/auth/requirements.txt",
    "tests.json": "backend/auth/tests.json"
}

def print_step(step, message):
    """Print formatted step message"""
    print(f"\n{'='*50}")
    print(f"STEP {step}: {message}")
    print('='*50)

def execute_command(ssh, command, description=""):
    """Execute SSH command and print output"""
    if description:
        print(f"→ {description}")
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')
    
    if output:
        print(output)
    if error and exit_code != 0:
        print(f"ERROR: {error}")
        return False
    return True

def main():
    print("🚀 Deploying Auth Function to Server")
    print(f"Host: {HOST}")
    print(f"Target: {TARGET_DIR}")
    
    # Check if paramiko is installed
    try:
        import paramiko
    except ImportError:
        print("\n❌ ERROR: paramiko not installed")
        print("Install it: pip install paramiko bcrypt")
        sys.exit(1)
    
    # Check if local files exist
    print("\n📁 Checking local files...")
    for remote_name, local_path in FILES.items():
        if not os.path.exists(local_path):
            print(f"❌ ERROR: File not found: {local_path}")
            sys.exit(1)
        print(f"✓ {local_path}")
    
    # Connect to server
    print("\n🔌 Connecting to server...")
    ssh = SSHClient()
    ssh.set_missing_host_key_policy(AutoAddPolicy())
    
    try:
        ssh.connect(HOST, username=USER, password=PASSWORD)
        print("✓ Connected successfully")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)
    
    try:
        # Step 1: Create directory
        print_step(1, "Creating directory structure")
        execute_command(ssh, f"mkdir -p {TARGET_DIR}", "Creating directory")
        
        # Step 2: Upload files
        print_step(2, "Uploading files")
        sftp = ssh.open_sftp()
        for remote_name, local_path in FILES.items():
            remote_path = f"{TARGET_DIR}/{remote_name}"
            print(f"→ Uploading {local_path} → {remote_path}")
            sftp.put(local_path, remote_path)
            print(f"✓ {remote_name} uploaded")
        sftp.close()
        
        # Step 3: Install dependencies
        print_step(3, "Installing Python dependencies")
        execute_command(
            ssh,
            f"cd {TARGET_DIR} && pip3 install -r requirements.txt",
            "Installing psycopg2-binary and bcrypt"
        )
        
        # Step 4: Generate bcrypt hash
        print_step(4, "Generating password hash")
        password = "Wqesad321"
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        print(f"Password: {password}")
        print(f"Hash: {password_hash}")
        
        # Step 5: Update database
        print_step(5, "Updating database")
        
        # Add password_hash column if not exists
        execute_command(
            ssh,
            f"sudo -u postgres psql -d universal_backend -c \"ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);\"",
            "Adding password_hash column"
        )
        
        # Update user password
        execute_command(
            ssh,
            f"sudo -u postgres psql -d universal_backend -c \"UPDATE users SET password_hash = '{password_hash}' WHERE username = 'suser';\"",
            "Updating suser password"
        )
        
        # Verify update
        print("\n→ Verifying user update:")
        execute_command(
            ssh,
            f"sudo -u postgres psql -d universal_backend -c \"SELECT id, username, LEFT(password_hash, 30) as hash_preview FROM users WHERE username = 'suser';\"",
            ""
        )
        
        # Step 6: Restart service
        print_step(6, "Restarting python-gateway service")
        execute_command(ssh, "systemctl restart python-gateway", "Restarting service")
        time.sleep(2)
        
        # Check service status
        print("\n→ Checking service status:")
        execute_command(ssh, "systemctl is-active python-gateway", "")
        
        # Step 7: Verify deployment
        print_step(7, "Verifying deployment")
        execute_command(ssh, f"ls -lh {TARGET_DIR}", "Directory contents:")
        
        # Print summary
        print("\n" + "="*50)
        print("✅ DEPLOYMENT SUCCESSFUL")
        print("="*50)
        print(f"\n📍 Location: {TARGET_DIR}")
        print(f"🔐 User: suser")
        print(f"🔑 Password: {password}")
        print(f"🌐 URL: https://function.centerai.tech/auth")
        print(f"\n💾 Hash stored in database: {password_hash[:30]}...")
        
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
