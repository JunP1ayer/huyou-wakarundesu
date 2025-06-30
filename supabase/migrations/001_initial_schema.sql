-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profile table
CREATE TABLE user_profile (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_student BOOLEAN DEFAULT FALSE,
  support_type TEXT CHECK (support_type IN ('full', 'partial', 'none')),
  insurance TEXT CHECK (insurance IN ('national', 'employee', 'none')),
  company_large BOOLEAN DEFAULT FALSE,
  weekly_hours INTEGER DEFAULT 0,
  fuyou_line INTEGER DEFAULT 1030000, -- Default 103万円
  hourly_wage INTEGER DEFAULT 1200, -- Default 1,200円/hour
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table (bank deposits)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profile(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in yen
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stats table (cached calculations)
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES user_profile(user_id) ON DELETE CASCADE,
  ytd_income INTEGER DEFAULT 0, -- Year-to-date income in yen
  remaining INTEGER DEFAULT 0, -- Remaining income before limit
  remaining_hours NUMERIC(10,2) DEFAULT 0, -- Remaining work hours
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax parameters table (mutable by admin)
CREATE TABLE tax_parameters (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  effective_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tax parameters
INSERT INTO tax_parameters (key, value, effective_year, description) VALUES
  ('fuyou_limit_general', 1030000, 2024, '一般扶養控除の上限額'),
  ('fuyou_limit_student', 1300000, 2024, '勤労学生控除の上限額'),
  ('insurance_threshold', 1060000, 2024, '社会保険扶養の上限額'),
  ('income_tax_threshold', 1030000, 2024, '所得税扶養控除の上限額');

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_user_stats_updated ON user_stats(updated_at);

-- Function to update user_stats when transactions change
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate YTD income for the user
  WITH ytd_data AS (
    SELECT 
      COALESCE(SUM(amount), 0) as total_income
    FROM transactions 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM NOW())
  ),
  user_data AS (
    SELECT fuyou_line, hourly_wage
    FROM user_profile 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
  )
  INSERT INTO user_stats (user_id, ytd_income, remaining, remaining_hours, updated_at)
  SELECT 
    COALESCE(NEW.user_id, OLD.user_id),
    ytd_data.total_income,
    GREATEST(0, user_data.fuyou_line - ytd_data.total_income),
    CASE 
      WHEN user_data.hourly_wage > 0 THEN 
        GREATEST(0, (user_data.fuyou_line - ytd_data.total_income)::NUMERIC / user_data.hourly_wage)
      ELSE 0
    END,
    NOW()
  FROM ytd_data, user_data
  ON CONFLICT (user_id) 
  DO UPDATE SET
    ytd_income = EXCLUDED.ytd_income,
    remaining = EXCLUDED.remaining,
    remaining_hours = EXCLUDED.remaining_hours,
    updated_at = EXCLUDED.updated_at;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_user_stats_insert
  AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER trigger_update_user_stats_update
  AFTER UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER trigger_update_user_stats_delete
  AFTER DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Function to update user_stats when user_profile changes
CREATE OR REPLACE FUNCTION update_user_stats_on_profile_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_stats() WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats_profile
  AFTER UPDATE OF fuyou_line, hourly_wage ON user_profile
  FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_profile_change();

-- Enable Row Level Security
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_parameters ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON user_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profile
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view tax parameters" ON tax_parameters
  FOR SELECT TO authenticated USING (true);