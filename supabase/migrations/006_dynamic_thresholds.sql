-- =====================================================
-- Migration 006: Dynamic Fuyou Thresholds System
-- =====================================================
-- Enables dynamic threshold management for tax law changes
-- Supports 2025 reform (103→123万, 106万壁撤廃 etc.)

-- Create fuyou_thresholds table
CREATE TABLE IF NOT EXISTS fuyou_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Threshold identification
    kind TEXT NOT NULL CHECK (kind IN ('tax', 'social')),
    key TEXT NOT NULL, -- e.g., 'INCOME_TAX_103', 'SOCIAL_INSURANCE_106'
    
    -- Value and metadata  
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    yen INTEGER NOT NULL CHECK (yen > 0),
    label TEXT NOT NULL, -- e.g., '103万円の壁（所得税扶養控除）'
    description TEXT,
    
    -- Status flags
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false, -- fallback if no active found
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- admin user id
    
    -- Constraints
    UNIQUE(key, year, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX idx_fuyou_thresholds_active ON fuyou_thresholds (is_active, year) WHERE is_active = true;
CREATE INDEX idx_fuyou_thresholds_kind_year ON fuyou_thresholds (kind, year);
CREATE INDEX idx_fuyou_thresholds_key ON fuyou_thresholds (key);

-- Insert default thresholds (2024 values)
INSERT INTO fuyou_thresholds (kind, key, year, yen, label, description, is_active, is_default) VALUES
-- Tax thresholds
('tax', 'INCOME_TAX_103', 2024, 1030000, '103万円の壁（所得税扶養控除）', '所得税の扶養控除を受けられます。親の税金負担が軽くなります。', true, true),
('tax', 'SPOUSE_DEDUCTION_150', 2024, 1500000, '150万円の壁（配偶者特別控除）', '配偶者特別控除の上限です。学生以外で該当する場合があります。', true, true),

-- Social insurance thresholds  
('social', 'SOCIAL_INSURANCE_106', 2024, 1060000, '106万円の壁（社会保険）', '大企業勤務の場合の社会保険の扶養上限です。', true, true),
('social', 'SOCIAL_INSURANCE_130', 2024, 1300000, '130万円の壁（社会保険）', '一般的な社会保険の扶養上限です。', true, true);

-- Insert 2025 reform preview thresholds (inactive by default)
INSERT INTO fuyou_thresholds (kind, key, year, yen, label, description, is_active, is_default) VALUES
-- 2025 tax reform: 103万→123万 (example)
('tax', 'INCOME_TAX_123', 2025, 1230000, '123万円の壁（所得税扶養控除・改正後）', '2025年税制改正により103万円から引き上げ', false, false),
('tax', 'SPOUSE_DEDUCTION_150', 2025, 1500000, '150万円の壁（配偶者特別控除）', '配偶者特別控除の上限（2025年継続）', false, false),

-- 2025 social insurance: 106万円壁撤廃（example） 
('social', 'SOCIAL_INSURANCE_130', 2025, 1300000, '130万円の壁（社会保険・統一後）', '106万円の壁撤廃により130万円に統一', false, false);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE fuyou_thresholds ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can read active thresholds
CREATE POLICY "fuyou_thresholds_select_active" ON fuyou_thresholds
    FOR SELECT 
    USING (is_active = true);

-- Policy 2: Only authenticated users can read all thresholds  
CREATE POLICY "fuyou_thresholds_select_all" ON fuyou_thresholds
    FOR SELECT 
    TO authenticated
    USING (true);

-- Policy 3: Only service_role can insert/update/delete
CREATE POLICY "fuyou_thresholds_full_access" ON fuyou_thresholds
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_fuyou_thresholds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fuyou_thresholds_updated_at
    BEFORE UPDATE ON fuyou_thresholds
    FOR EACH ROW
    EXECUTE FUNCTION update_fuyou_thresholds_updated_at();

-- Function to get active thresholds for a specific year
CREATE OR REPLACE FUNCTION get_active_fuyou_thresholds(target_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()))
RETURNS TABLE (
    key TEXT,
    kind TEXT, 
    yen INTEGER,
    label TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.key,
        t.kind,
        t.yen,
        t.label,
        t.description
    FROM fuyou_thresholds t
    WHERE t.year = target_year 
      AND t.is_active = true
    ORDER BY t.yen ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate thresholds for a new year (admin use)
CREATE OR REPLACE FUNCTION activate_fuyou_thresholds_for_year(
    target_year INTEGER,
    threshold_keys TEXT[]
) RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER := 0;
BEGIN
    -- Deactivate all thresholds for the target year first
    UPDATE fuyou_thresholds 
    SET is_active = false 
    WHERE year = target_year;
    
    -- Activate specified thresholds
    UPDATE fuyou_thresholds 
    SET is_active = true 
    WHERE year = target_year 
      AND key = ANY(threshold_keys);
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users for read functions
GRANT EXECUTE ON FUNCTION get_active_fuyou_thresholds(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_fuyou_thresholds_for_year(INTEGER, TEXT[]) TO service_role;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE fuyou_thresholds IS 'Dynamic thresholds for fuyou (dependent) income limits. Supports annual tax law changes.';
COMMENT ON COLUMN fuyou_thresholds.kind IS 'Type of threshold: tax (income tax) or social (social insurance)';
COMMENT ON COLUMN fuyou_thresholds.key IS 'Unique identifier for the threshold type (e.g., INCOME_TAX_103)';
COMMENT ON COLUMN fuyou_thresholds.year IS 'Tax year this threshold applies to';
COMMENT ON COLUMN fuyou_thresholds.yen IS 'Threshold amount in yen';
COMMENT ON COLUMN fuyou_thresholds.is_active IS 'Whether this threshold is currently active for calculations';
COMMENT ON COLUMN fuyou_thresholds.is_default IS 'Fallback threshold if no active threshold found for the year';

COMMENT ON FUNCTION get_active_fuyou_thresholds(INTEGER) IS 'Returns all active thresholds for a given year, ordered by amount';
COMMENT ON FUNCTION activate_fuyou_thresholds_for_year(INTEGER, TEXT[]) IS 'Admin function to activate specific thresholds for a year';