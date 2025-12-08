-- Add telemetry fields to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status VARCHAR(10) DEFAULT 'off' CHECK (status IN ('on', 'off'));
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS label VARCHAR(255);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_telemetry_at TIMESTAMP WITH TIME ZONE;

-- Create index for telemetry lookups by unique_code
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
