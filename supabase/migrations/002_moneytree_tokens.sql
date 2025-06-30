-- Moneytree tokens table
CREATE TABLE user_moneytree_tokens (
  user_id UUID PRIMARY KEY REFERENCES user_profile(user_id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_moneytree_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage own tokens" ON user_moneytree_tokens
  FOR ALL USING (auth.uid() = user_id);