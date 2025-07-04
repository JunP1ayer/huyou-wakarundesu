-- Migration: Profile Completion System Redesign
-- Adds mandatory profile completion tracking and simplifies income model

-- Add profile completion tracking columns
ALTER TABLE user_profile 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS birth_year INTEGER,
ADD COLUMN IF NOT EXISTS student_type TEXT CHECK (student_type IN ('university', 'vocational', 'high_school', 'graduate', 'other')),
ADD COLUMN IF NOT EXISTS monthly_income_target INTEGER; -- Monthly target income in yen

-- Update existing user_profile structure for new UX flow
ALTER TABLE user_profile 
ALTER COLUMN support_type SET DEFAULT 'unknown',
ALTER COLUMN insurance SET DEFAULT 'unknown',
ALTER COLUMN company_large SET DEFAULT NULL;

-- Add monthly income tracking table (simplified 1-12 month model)
CREATE TABLE IF NOT EXISTS user_monthly_income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  income_amount INTEGER NOT NULL DEFAULT 0, -- Amount in yen
  is_estimated BOOLEAN DEFAULT FALSE, -- If this is an estimate/prediction
  input_method TEXT CHECK (input_method IN ('manual', 'bank_api', 'estimated')) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- RLS for monthly income
ALTER TABLE user_monthly_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own monthly income" ON user_monthly_income
  FOR ALL USING (auth.uid() = user_id);

-- Function to calculate YTD income from monthly data
CREATE OR REPLACE FUNCTION calculate_ytd_income(target_user_id UUID, target_year INTEGER)
RETURNS INTEGER AS $$
DECLARE
  ytd_total INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(income_amount), 0) INTO ytd_total
  FROM user_monthly_income
  WHERE user_id = target_user_id 
    AND year = target_year
    AND month <= EXTRACT(MONTH FROM CURRENT_DATE);
  
  RETURN ytd_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if profile is complete
CREATE OR REPLACE FUNCTION is_profile_complete(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record user_profile%ROWTYPE;
  is_complete BOOLEAN := FALSE;
BEGIN
  SELECT * INTO profile_record 
  FROM user_profile 
  WHERE user_id = target_user_id;
  
  -- Profile is complete if all required fields are filled
  IF profile_record.user_id IS NOT NULL AND
     profile_record.birth_year IS NOT NULL AND
     profile_record.student_type IS NOT NULL AND
     profile_record.support_type != 'unknown' AND
     profile_record.insurance != 'unknown' AND
     profile_record.monthly_income_target > 0 THEN
    is_complete := TRUE;
  END IF;
  
  RETURN is_complete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update profile_completed flag
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completed := is_profile_complete(NEW.user_id);
  
  -- Set completion timestamp if just completed
  IF NEW.profile_completed = TRUE AND OLD.profile_completed = FALSE THEN
    NEW.profile_completed_at := NOW();
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_completion ON user_profile;
CREATE TRIGGER trigger_update_profile_completion
  BEFORE UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion();

-- Update existing profiles to calculate completion status
UPDATE user_profile 
SET profile_completed = is_profile_complete(user_id),
    updated_at = NOW();

-- Grant necessary permissions
GRANT ALL ON user_monthly_income TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_ytd_income(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_profile_complete(UUID) TO authenticated;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_monthly_income_user_year ON user_monthly_income(user_id, year);
CREATE INDEX IF NOT EXISTS idx_user_profile_completion ON user_profile(user_id, profile_completed);

-- Comments for documentation
COMMENT ON TABLE user_monthly_income IS 'Simplified monthly income tracking (Jan-Dec only)';
COMMENT ON COLUMN user_profile.profile_completed IS 'Automatically calculated based on required field completion';
COMMENT ON COLUMN user_profile.onboarding_step IS 'Current step in onboarding process (0=not started, 4=completed)';
COMMENT ON COLUMN user_profile.student_type IS 'Type of student for more specific guidance';
COMMENT ON FUNCTION is_profile_complete(UUID) IS 'Returns true if all mandatory profile fields are completed';