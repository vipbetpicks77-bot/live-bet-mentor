-- =====================================================
-- LIVE BET MENTOR - Supabase Database Setup (Updated)
-- Gelişmiş Üyelik Sistemi ve Plan Yönetimi
-- =====================================================

-- 1. Profiles tablosuna yeni kolonlar ekle
-- ===========================================

-- Üyelik durumu (pending, approved, rejected, expired)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Üyelik Planı (trial, pro, premium, admin)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial';

-- Üyelik başlangıç ve bitiş tarihleri
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP WITH TIME ZONE;

-- Onay bilgileri
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Ekstra bilgiler
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Mevcut kullanıcıları güncelle
-- ===========================================

-- Tüm onaylı kullanıcıları varsayılan olarak 'pro' yap
UPDATE profiles 
SET plan = 'pro'
WHERE status = 'approved' AND plan IS NULL;

-- Admin hesabını 'admin' planına çek
UPDATE profiles 
SET plan = 'admin',
    status = 'approved',
    subscription_end = NOW() + INTERVAL '100 years'
WHERE email = 'karabulut.hamza@gmail.com';


-- 3. Predictions tablosu (Değişiklik yok, kontrol amaçlı)
-- ===========================================

CREATE TABLE IF NOT EXISTS predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id TEXT,
    match_name TEXT,
    home_team TEXT,
    away_team TEXT,
    minute INTEGER,
    score_at_prediction TEXT,
    market TEXT,
    prediction TEXT,
    confidence INTEGER,
    source TEXT,
    dqs DECIMAL,
    xg_home DECIMAL,
    xg_away DECIMAL,
    consensus_count INTEGER,
    status TEXT DEFAULT 'PENDING',
    final_score TEXT,
    profit DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 4. AI Usage Logs Tablosu (YENİ)
-- ===========================================

CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    ai_reports_count INTEGER DEFAULT 0,
    smart_alerts_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON ai_usage_logs FOR SELECT USING (auth.uid() = user_id);
-- Allow access for upsert via application logic or service role
CREATE POLICY "Users can insert own usage" ON ai_usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON ai_usage_logs FOR UPDATE USING (auth.uid() = user_id);

-- 5. RLS Politikaları (Önceki ile aynı)
-- ===========================================
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own predictions" ON predictions;
CREATE POLICY "Users can view own predictions" ON predictions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own predictions" ON predictions;
CREATE POLICY "Users can insert own predictions" ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own predictions" ON predictions;
CREATE POLICY "Users can update own predictions" ON predictions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own predictions" ON predictions;
CREATE POLICY "Users can delete own predictions" ON predictions FOR DELETE USING (auth.uid() = user_id);

-- 6. İndeksler
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_logs(date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id);
