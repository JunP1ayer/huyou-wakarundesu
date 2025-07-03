# 扶養わかるんです (Fuyou Wakarundesu) - MVP v1.2

A mobile-first web application that helps Japanese users understand their dependent (扶養) income limits and track how much more they can earn without losing dependent status.

## 🚀 Features

- **Personalized Income Limits**: Calculate your specific 扶養 (dependent) income threshold based on student status, insurance type, and employment situation
- **Real-time Tracking**: See remaining income and work hours with visual progress indicators
- **Bank Integration**: Connect to Moneytree Link sandbox for automatic income tracking
- **Smart Alerts**: Warnings when approaching limits or risk zones (106万円 line)
- **Mobile-first Design**: Optimized for smartphone usage with intuitive Japanese UI

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Bank API**: Moneytree Link Sandbox (read-only deposits)
- **Deployment**: Vercel with GitHub Actions CI/CD

## 📐 Key Components

### 1. Onboarding Wizard
5-question setup flow:
- Student status (学生ですか？)
- Support type (扶養の種類)
- Insurance type (保険の種類)
- Company size (勤務先の規模)
- Weekly work hours (週の労働時間)

### 2. Dashboard
- Big numbers display: remaining income (あと◯円) and hours (あと◯時間)
- Color-coded progress bar: green (>30%), yellow (10-30%), red (<10%)
- Action cards for risk situations
- Bank connection status

### 3. Settings/Profile
- Re-run onboarding wizard
- Update hourly wage
- Manage bank account connections
- Profile information display

## 🗄️ Database Schema

### Core Tables
- `user_profile`: User configuration and 扶養 limits
- `transactions`: Bank deposit data from Moneytree
- `user_stats`: Cached calculations (YTD income, remaining amounts)
- `tax_parameters`: Configurable tax thresholds
- `user_moneytree_tokens`: OAuth tokens for bank integration

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- Supabase account
- Moneytree Link sandbox account
- Vercel account (for deployment)

### Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd fuyou-wakarundesu
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   MONEYTREE_CLIENT_ID=your_moneytree_client_id
   MONEYTREE_CLIENT_SECRET=your_moneytree_client_secret
   MONEYTREE_REDIRECT_URI=http://localhost:3000/api/auth/moneytree/callback
   ```

3. **Set up Supabase database**:
   - Create a new Supabase project
   - Run the migration files in order:
     ```sql
     -- Execute supabase/migrations/001_initial_schema.sql
     -- Execute supabase/migrations/002_moneytree_tokens.sql
     ```
   - Enable Row Level Security (RLS) policies are included in migrations

4. **Set up Moneytree Link**:
   - Register for Moneytree Link sandbox
   - Configure OAuth redirect URI: `http://localhost:3000/api/auth/moneytree/callback`
   - Add client credentials to environment variables

5. **Run development server**:
   ```bash
   npm run dev
   ```

### Production Deployment

1. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Set environment variables in Vercel dashboard
   - Enable automatic deployments on push to main branch

2. **Configure GitHub Secrets** (for CI/CD):
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 🔐 Security Considerations

- Row Level Security (RLS) enabled on all user data tables
- OAuth tokens encrypted and stored securely
- API routes protected with Supabase authentication
- Environment variables for sensitive configuration

## 📱 User Flow

1. **First Visit**: Onboarding wizard (5 questions) → Profile creation
2. **Dashboard**: View remaining income/hours → Connect bank (optional)
3. **Bank Sync**: OAuth flow → Automatic transaction import
4. **Ongoing**: Real-time updates, warnings, manual sync

## 🧮 Income Calculation Logic

The app calculates personalized limits based on:
- **General**: 103万円 (income tax threshold)
- **Student**: 130万円 (with 勤労学生控除)
- **Insurance**: 106万円 (social insurance threshold for large companies)
- **Company Size**: Affects social insurance thresholds

## 🔄 API Endpoints

- `POST /api/moneytree/connect` - Initiate bank connection
- `GET /api/auth/moneytree/callback` - OAuth callback handler
- `POST /api/moneytree/sync` - Manual transaction sync

## 🚨 Development Notes

- Mobile-first responsive design
- Japanese language UI
- Supabase Edge Functions for background processing
- Real-time database updates via triggers
- Error handling with user-friendly Japanese messages

## 📊 Monitoring

- Transaction sync logs
- User onboarding completion rates
- Bank connection success rates
- API response times

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Note**: This is an MVP (v1.2) focused on core functionality. Future enhancements may include:
- Push notifications for limit warnings
- Export functionality for tax reporting
- Integration with multiple bank APIs
- Advanced analytics and forecasting
