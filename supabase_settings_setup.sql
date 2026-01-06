-- =====================================================
-- LIVE BET MENTOR - System Settings Setup
-- Dinamik WhatsApp ve Fiyat Yönetimi
-- =====================================================

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial values from current config.js
INSERT INTO system_settings (key, value) VALUES 
('whatsapp_number', '+905320000000'),
('price_pro', '29'),
('price_premium', '79'),
('price_currency', '€'),
('support_email', 'karabulut.hamza@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- RLS Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
DROP POLICY IF EXISTS "Public can view settings" ON system_settings;
CREATE POLICY "Public can view settings" ON system_settings FOR SELECT USING (true);

-- Only Admins can update settings
DROP POLICY IF EXISTS "Admins can update settings" ON system_settings;
CREATE POLICY "Admins can update settings" ON system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plan = 'admin')
);
