-- Fix the trigger function for user_profile updates
-- The original function had an incorrect call to update_user_stats()
DROP TRIGGER IF EXISTS trigger_update_user_stats_profile ON user_profile;
DROP FUNCTION IF EXISTS update_user_stats_on_profile_change();

CREATE OR REPLACE FUNCTION update_user_stats_on_profile_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate stats for the updated user
  WITH ytd_data AS (
    SELECT 
      COALESCE(SUM(amount), 0) as total_income
    FROM transactions 
    WHERE user_id = NEW.user_id
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM NOW())
  )
  INSERT INTO user_stats (user_id, ytd_income, remaining, remaining_hours, updated_at)
  SELECT 
    NEW.user_id,
    ytd_data.total_income,
    GREATEST(0, NEW.fuyou_line - ytd_data.total_income),
    CASE 
      WHEN NEW.hourly_wage > 0 THEN 
        GREATEST(0, (NEW.fuyou_line - ytd_data.total_income)::NUMERIC / NEW.hourly_wage)
      ELSE 0
    END,
    NOW()
  FROM ytd_data
  ON CONFLICT (user_id) 
  DO UPDATE SET
    ytd_income = EXCLUDED.ytd_income,
    remaining = EXCLUDED.remaining,
    remaining_hours = EXCLUDED.remaining_hours,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_update_user_stats_profile
  AFTER UPDATE OF fuyou_line, hourly_wage ON user_profile
  FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_profile_change();

-- Update tax parameters for 2025
UPDATE tax_parameters SET effective_year = 2025 WHERE effective_year = 2024;

-- Add new 2025 tax parameters if they don't exist
INSERT INTO tax_parameters (key, value, effective_year, description) VALUES
  ('fuyou_limit_general_2025', 1030000, 2025, '一般扶養控除の上限額（2025年）'),
  ('fuyou_limit_student_2025', 1300000, 2025, '勤労学生控除の上限額（2025年）'),
  ('insurance_threshold_2025', 1060000, 2025, '社会保険扶養の上限額（2025年）'),
  ('income_tax_threshold_2025', 1030000, 2025, '所得税扶養控除の上限額（2025年）')
ON CONFLICT (key) DO NOTHING;

-- Add helpful function to get current year tax parameters
CREATE OR REPLACE FUNCTION get_current_tax_parameter(param_key TEXT)
RETURNS INTEGER AS $$
DECLARE
  param_value INTEGER;
BEGIN
  SELECT value INTO param_value
  FROM tax_parameters 
  WHERE key = param_key || '_' || EXTRACT(YEAR FROM NOW())::TEXT
     OR (key = param_key AND effective_year = EXTRACT(YEAR FROM NOW()));
  
  -- Fallback to general parameter if year-specific not found
  IF param_value IS NULL THEN
    SELECT value INTO param_value
    FROM tax_parameters 
    WHERE key = param_key
    ORDER BY effective_year DESC
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(param_value, 1030000); -- Default fallback
END;
$$ LANGUAGE plpgsql;

-- Add function to calculate dynamic fuyou line based on user profile
CREATE OR REPLACE FUNCTION calculate_fuyou_line(
  p_is_student BOOLEAN,
  p_support_type TEXT,
  p_insurance TEXT,
  p_company_large BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
  base_limit INTEGER;
  insurance_limit INTEGER;
BEGIN
  -- Base limit calculation
  IF p_is_student THEN
    base_limit := get_current_tax_parameter('fuyou_limit_student');
  ELSE
    base_limit := get_current_tax_parameter('fuyou_limit_general');
  END IF;
  
  -- Insurance threshold consideration
  IF p_insurance = 'employee' AND p_company_large THEN
    insurance_limit := get_current_tax_parameter('insurance_threshold');
    -- Take the more restrictive limit
    base_limit := LEAST(base_limit, insurance_limit);
  END IF;
  
  RETURN base_limit;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-calculate fuyou_line on profile insert/update
CREATE OR REPLACE FUNCTION auto_calculate_fuyou_line()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fuyou_line := calculate_fuyou_line(
    NEW.is_student,
    NEW.support_type,
    NEW.insurance,
    NEW.company_large
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_fuyou_line
  BEFORE INSERT OR UPDATE ON user_profile
  FOR EACH ROW EXECUTE FUNCTION auto_calculate_fuyou_line();

-- Add unique constraint to prevent duplicate transactions
ALTER TABLE transactions 
ADD CONSTRAINT unique_user_transaction 
UNIQUE (user_id, date, amount, description);

-- Add some helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_profile_updated ON user_profile(updated_at);
CREATE INDEX IF NOT EXISTS idx_tax_parameters_year ON tax_parameters(effective_year, key);

-- Add updated_at trigger for user_profile
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profile_updated_at
  BEFORE UPDATE ON user_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tax_parameters_updated_at
  BEFORE UPDATE ON tax_parameters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();