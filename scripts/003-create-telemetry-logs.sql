-- Create telemetry_logs table to store historical telemetry data
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  label VARCHAR(255),
  health_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_vehicle_id ON telemetry_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_created_at ON telemetry_logs(created_at DESC);

