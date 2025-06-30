-- Ensure proper integration with Supabase Auth
-- This migration sets up the connection between auth.users and user_profile

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profile (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to be more explicit about auth
DROP POLICY IF EXISTS "Users can view own profile" ON user_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profile;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can manage own tokens" ON user_moneytree_tokens;

-- Better RLS policies
CREATE POLICY "Enable read access for users on their own profile" ON user_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable update access for users on their own profile" ON user_profile
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable insert access for users on their own profile" ON user_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for users on their own profile" ON user_profile
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Enable read access for users on their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for users on their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for users on their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for users on their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Enable read access for users on their own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for users on their own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for users on their own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Moneytree tokens policies
CREATE POLICY "Enable full access for users on their own tokens" ON user_moneytree_tokens
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tax parameters - allow all authenticated users to read
CREATE POLICY "Enable read access for authenticated users on tax parameters" ON tax_parameters
  FOR SELECT TO authenticated USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Allow the trigger function to access auth schema
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;