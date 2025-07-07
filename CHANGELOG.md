# Changelog

All notable changes to the 扶養わかるんです (Fuyou Wakarundesu) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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