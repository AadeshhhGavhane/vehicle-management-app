-- Add phone notifications preference to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_notifications_enabled BOOLEAN DEFAULT false;

