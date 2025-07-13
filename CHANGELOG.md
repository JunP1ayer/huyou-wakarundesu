# Changelog

All notable changes to the 扶養わかるんです (Fuyou Wakarundesu) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-13

### Added
- **🎯 Adaptive Onboarding v3**: Complete 8-screen conditional navigation system
  - Age-aware threshold calculations (19-22 special student limits)
  - Insurance status tracking with future date planning
  - Multi-employer and other income detection
  - Bank connection setup with demo simulation
- **⚡ Real-time Allowance Engine**: Database-driven calculation system
  - PostgreSQL triggers for instant updates on income changes
  - `recalc_allowance()` function with tax wall logic integration
  - Event-driven architecture for all income sources
- **🏛️ 2025 Tax Reform Implementation**: Updated thresholds and calculations
  - Resident tax: ¥1,100,000 (updated from ¥1,030,000)
  - Income tax general: ¥1,230,000 (updated from ¥1,030,000)
  - Income tax student (19-22): ¥1,500,000 (special provision)
  - Social insurance: ¥1,300,000 (unchanged)
- **🤖 Bank Webhook & Deposit Classification**: Intelligent income detection
  - Fuzzy matching algorithm using Levenshtein distance
  - Job-based salary recognition with confidence scoring
  - Automatic event creation for classified income deposits
- **📊 Manual Income Tracking**: CRUD interface for non-automated income
  - Taxable/non-taxable classification
  - Category-based organization (salary, freelance, cash job, other)
  - Real-time Supabase integration with allowance updates
- **🔐 Production Security & Monitoring**: Enterprise-grade error tracking
  - Sentry integration with custom error contexts
  - LogRocket session replay (optional, privacy-focused)
  - Row Level Security (RLS) audit with automated testing
- **🚀 CI/CD & DevOps Pipeline**: Comprehensive automation
  - GitHub Actions with Node.js 18/20 matrix testing
  - Automated security audits and load testing
  - Vercel staging deployments with preview comments
  - Performance monitoring with Lighthouse CI
- **📚 Developer Experience**: Complete documentation and testing
  - Storybook component library with interactive demos
  - Load testing for 1000 deposits/min performance validation
  - TypeScript scripts for security and performance auditing
  - Comprehensive Jest test suite for tax calculations

### Enhanced
- **Database Schema**: Complete migration to support v3 onboarding
  - `profiles` table with adaptive threshold fields
  - `events` table for all income tracking
  - `manual_incomes` table for user-entered income
  - `jobs` table for employer-based classification
  - `bank_connections` and `deposits` for webhook integration
- **Tax Calculation Logic**: Age and status-aware threshold determination
  - `decideThreshold()` function with future insurance date support
  - Dynamic wall switching based on student age brackets
  - Danger level calculation (safe/warn/danger) with color coding
- **User Experience**: Legal compliance and disclaimer integration
  - Required tax office consultation disclaimers
  - Links to official National Tax Agency resources
  - Comprehensive error handling with user-friendly messages

### Security
- **Row Level Security (RLS)**: Complete database access control
  - Cross-user data access prevention
  - Automated security testing in CI pipeline
  - Profile, event, and income table protection
- **API Security**: Rate limiting and validation
  - Input sanitization for webhook endpoints
  - Service role key protection in CI/CD
  - CORS and security headers configuration

### Performance
- **Load Testing**: Validated 1000 deposits/min processing
  - <200ms average allowance update time
  - Concurrent webhook processing capability
  - Database trigger optimization for real-time updates
- **Monitoring**: Complete observability stack
  - Sentry performance monitoring with 10% production sampling
  - LogRocket session replay for debugging (optional)
  - GitHub Actions performance validation in CI

### Documentation
- **API Documentation**: Complete endpoint reference
- **Architecture Documentation**: High-level system design
- **Security Audit Reports**: RLS testing and validation procedures
- **Load Testing Reports**: Performance benchmarks and requirements

### Developer Tools
- **Scripts**: Automated testing and validation
  - `npm run rls-test`: Security audit automation
  - `npm run load-test`: Performance validation
  - `npm run security:audit`: Combined security testing
- **Storybook**: Interactive component documentation
  - Tax calculation demos with real scenarios
  - Onboarding step visualization
  - Dashboard component library

## [v0.9.0-onboarding] - 2025-01-07

### Added
- **Zero-to-Dev Onboarding Automation**: 3-step setup process (clone → npm run setup → npm run dev)
- **Environment Setup Scripts**: 
  - `scripts/setup-local-env.sh` - Automated environment configuration with Vercel fallback
  - `scripts/check-env.js` - Pre-dev validation hooks with quick mode
  - `.env.local.template` - Comprehensive environment template with setup instructions
- **Jest Test Coverage**: Environment validation tests in `__tests__/scripts/check-env.test.js`
- **Cross-Platform Support**: Compatible with macOS, Ubuntu, Windows/WSL, and GitHub Codespaces
- **Package.json Scripts**:
  - `npm run setup` - Automated setup with dependency installation and environment configuration
  - `npm run predev` - Pre-development environment validation hook

### Changed
- **CI/CD Node.js Version**: Updated GitHub Actions to use Node.js 18.20.2 (Lighthouse compatibility)
- **Package.json Engines**: Added Node.js >=18.20.0 requirement for version validation
- **README Quick Start**: Updated with v0.9.0 zero-to-dev onboarding flow

### Fixed
- **Build Compatibility**: Resolved next/headers import issues in client context
- **Server-Client Context**: Dynamic imports prevent bundling server-only modules in client builds
- **Environment Validation**: Robust validation with fallback mechanisms for missing configurations

### Technical Improvements
- **Automated Environment Setup**: Intelligent Vercel environment variable pulling with manual fallback
- **Pre-development Validation**: Prevents broken development environments before starting server
- **Cross-platform Compatibility**: Unified setup experience across different operating systems
- **Developer Experience**: Sub-1-minute setup time for new team members

### Infrastructure
- **GitHub Actions**: Enhanced CI pipeline with Node.js 18.20.2 for Lighthouse compatibility
- **Build Process**: Improved error handling and client-server context separation
- **Testing Framework**: Comprehensive Jest tests for environment validation logic

## Previous Releases

### [v2.0.0] - Google Design Principles Full Compliance
- Complete implementation of Google's 7 design principles
- Performance optimizations with 90+ Lighthouse scores
- Accessibility and internationalization improvements
- Privacy-first analytics implementation

### [v1.3.0] - Demo Mode Removal & Question UX Simplification
- Removed demo mode functionality
- Simplified onboarding from 5 to 4 user-friendly questions
- Enhanced validation and error messaging

---

## Contributing

When adding new features or making changes, please:
1. Update this CHANGELOG.md with your changes
2. Follow the semantic versioning guidelines
3. Include both user-facing and technical improvements
4. Document any breaking changes clearly