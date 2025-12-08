-- Add email notifications preference to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT false;

