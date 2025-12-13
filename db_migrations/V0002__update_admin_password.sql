-- Update admin password to bcrypt hash for 'admin123'
-- Generated with: bcrypt.hashpw(b'admin123', bcrypt.gensalt(rounds=12))
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIB.NLqW7e' 
WHERE username = 'admin';
