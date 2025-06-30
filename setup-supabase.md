# Supabase Setup Guide for 扶養わかるんです

## Prerequisites
- Supabase account at [supabase.com](https://supabase.com)
- Node.js 18+ installed locally

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Set project name: `fuyou-wakarundesu`
5. Set database password (save this!)
6. Choose region closest to your users (Japan: `ap-northeast-1`)
7. Click "Create new project"

## Step 2: Get Project Credentials

1. Go to Settings → API in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Step 3: Configure Environment Variables

Create `.env.local` file in project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Moneytree (sandbox)
MONEYTREE_CLIENT_ID=your_moneytree_client_id
MONEYTREE_CLIENT_SECRET=your_moneytree_client_secret
MONEYTREE_REDIRECT_URI=http://localhost:3000/api/auth/moneytree/callback

# For production
NEXTAUTH_URL=https://your-app-domain.vercel.app
```

## Step 4: Run Database Migrations

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to SQL Editor in your Supabase dashboard
2. Run each migration file in order:

**Migration 1: Initial Schema**
```sql
-- Copy and paste contents of supabase/migrations/001_initial_schema.sql
```

**Migration 2: Moneytree Tokens**
```sql
-- Copy and paste contents of supabase/migrations/002_moneytree_tokens.sql
```

**Migration 3: Fixes and 2025 Updates**
```sql
-- Copy and paste contents of supabase/migrations/003_fix_trigger_and_2025_updates.sql
```

**Migration 4: Auth Integration**
```sql
-- Copy and paste contents of supabase/migrations/004_auth_integration.sql
```

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 5: Configure Authentication

1. Go to Authentication → Settings in Supabase dashboard
2. Configure providers as needed (Email, Google, etc.)
3. Set Site URL: `http://localhost:3000` (development)
4. Add Redirect URLs:
   - `http://localhost:3000/dashboard`
   - `https://your-domain.vercel.app/dashboard` (production)

## Step 6: Set up Row Level Security (RLS)

RLS is automatically enabled by the migrations, but verify:

1. Go to Table Editor in Supabase dashboard
2. Check each table has RLS enabled:
   - ✅ `user_profile`
   - ✅ `transactions` 
   - ✅ `user_stats`
   - ✅ `tax_parameters`
   - ✅ `user_moneytree_tokens`

## Step 7: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. Complete the onboarding flow
4. Check Supabase dashboard → Table Editor to see data

## Step 8: Moneytree Integration Setup

1. Register at [Moneytree Link](https://link.moneytree.jp/) for sandbox access
2. Create a new application
3. Set redirect URI: `http://localhost:3000/api/auth/moneytree/callback`
4. Add client credentials to `.env.local`

## Production Deployment

### Vercel Setup

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   MONEYTREE_CLIENT_ID=your_client_id
   MONEYTREE_CLIENT_SECRET=your_client_secret
   MONEYTREE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/moneytree/callback
   ```

3. Update Supabase auth settings with production URLs

### GitHub Actions Setup

Add these secrets to your GitHub repository:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID` 
- `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Verification Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] All 4 migrations executed successfully
- [ ] RLS enabled on all tables
- [ ] Authentication working
- [ ] Can complete onboarding flow
- [ ] Dashboard displays correctly
- [ ] Bank connection flow initiated (even if sandbox)

## Troubleshooting

### Common Issues

**"auth.uid() is null"**
- Check if user is logged in
- Verify RLS policies are correct
- Ensure JWT is being passed correctly

**Migration errors**
- Run migrations in order
- Check for syntax errors
- Verify permissions

**Connection errors**
- Double-check environment variables
- Ensure Supabase project is active
- Check network connectivity

### Useful SQL Queries

**Check user profile:**
```sql
SELECT * FROM user_profile WHERE user_id = auth.uid();
```

**Check user stats:**
```sql
SELECT * FROM user_stats WHERE user_id = auth.uid();
```

**View all transactions:**
```sql
SELECT * FROM transactions WHERE user_id = auth.uid() ORDER BY date DESC;
```

**Check tax parameters:**
```sql
SELECT * FROM tax_parameters ORDER BY effective_year DESC, key;
```

## Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Check browser console for errors
3. Verify environment variables
4. Test each migration individually