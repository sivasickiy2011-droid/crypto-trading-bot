-- Rename owner user to suser
UPDATE users SET username = 'suser' WHERE username = 'owner';
