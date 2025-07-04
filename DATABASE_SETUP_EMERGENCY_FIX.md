# 🚨 DATABASE SETUP EMERGENCY FIX

## 🔴 **CRITICAL ISSUE IDENTIFIED**
```
Error: "relation \"public.user_profile\" does not exist" "42P01"
```

**Root Cause**: Supabase database tables haven't been created yet.

## ⚡ **IMMEDIATE FIX (5 minutes)**

### **Step 1: Access Supabase SQL Editor**
1. Go to: https://supabase.com/dashboard/project/zbsjqsqytjjlbpchpacl
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### **Step 2: Run Database Setup Script**
1. Copy the entire contents of `scripts/setup-supabase-database.sql`
2. Paste into the SQL Editor
3. Click **"Run"** button

**Expected Result**: `Database setup completed successfully!`

### **Step 3: Verify Tables Created**
In SQL Editor, run this verification query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profile', 
  'user_monthly_income', 
  'transactions', 
  'user_stats', 
  'tax_parameters',
  'user_moneytree_tokens'
);
```

**Expected Result**: Should return 6 table names.

## 🔧 **WHAT THE SCRIPT CREATES**

### **Tables:**
- ✅ `user_profile` - User settings and configuration
- ✅ `user_monthly_income` - Monthly income tracking
- ✅ `transactions` - Bank deposit records
- ✅ `user_stats` - Calculated statistics
- ✅ `tax_parameters` - Tax calculation parameters
- ✅ `user_moneytree_tokens` - Bank API integration

### **Triggers:**
- ✅ Auto-create user profile on signup
- ✅ Auto-update statistics when income changes
- ✅ Row Level Security policies

### **Security:**
- ✅ RLS enabled on all tables
- ✅ Users can only access their own data
- ✅ Proper foreign key relationships

## 🧪 **AFTER DATABASE SETUP**

### **Test the Application:**
1. Refresh your browser: http://localhost:3000
2. The profile error should disappear
3. OAuth login should work properly
4. Dashboard should load without errors

## ⚠️ **TROUBLESHOOTING**

### **If Script Fails:**
1. **Permission Error**: Make sure you're using the project owner account
2. **Syntax Error**: Copy the entire script exactly as written
3. **Existing Tables**: Script includes `DROP TABLE IF EXISTS` to handle this

### **If Still Getting Errors:**
Run this diagnostic query in SQL Editor:
```sql
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

This will show which tables exist and their ownership.

## 🎯 **EXPECTED OUTCOME**

After running the database setup:
- ✅ No more "relation does not exist" errors
- ✅ OAuth login works completely
- ✅ Dashboard loads user data properly
- ✅ All app functionality restored

## 📞 **NEED HELP?**

If the database setup fails:
1. Check Supabase project permissions
2. Verify you're using the correct project (zbsjqsqytjjlbpchpacl)
3. Try running the script in smaller chunks if it times out

**This fix should resolve the database issue completely! 🚀**