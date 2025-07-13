# Testing Policy & Guidelines

## 🎯 Overview

This document defines testing standards, Flaky test policies, and quality gates for the 扶養わかるんです application.

## 📋 Testing Pyramid

### 1. Unit Tests (Jest)
- **Target Coverage**: 50% (gradual increase from current ~8.6%)
- **Focus**: Business logic, utility functions, data transformations
- **Files**: `__tests__/**/*.test.{ts,tsx}`
- **Command**: `npm test`

### 2. Integration Tests (Jest + React Testing Library)
- **Focus**: Component interactions, hooks, API integration
- **Files**: `__tests__/**/*.integration.test.{ts,tsx}`
- **Command**: `npm run test:integration`

### 3. E2E Tests (Playwright)
- **Focus**: Critical user journeys, cross-browser compatibility
- **Files**: `e2e/**/*.spec.ts`
- **Command**: `npm run test:e2e`

## 🚫 Flaky Test Policy

### Zero Tolerance for Flaky Tests
**Deadline**: All Flaky tests must be fixed or disabled within **14 days** of detection.

### Detection & Monitoring
- **Automated Detection**: Daily cron job runs E2E tests with `fail-on-flaky` enabled
- **Issue Creation**: Auto-generated GitHub Issues with `flaky-test` label
- **Tracking**: Issues must be resolved within 2 weeks or escalated

### Resolution Strategies
1. **Fix Root Cause**: Improve selectors, wait conditions, test data
2. **Environment Issues**: Address timing, network, or resource constraints  
3. **Test Quarantine**: Temporarily skip with `.only` + tracking issue
4. **Test Removal**: Remove if business value < maintenance cost

### Temporary Measures (Current)
- `failOnFlaky: false` in `playwright.config.ts` (until 2024-01-28)
- CI passes despite flaky tests, but detection continues
- **Exit Strategy**: Re-enable `failOnFlaky: true` after all current issues resolved

## 🛡️ Quality Gates

### Pull Request Requirements
- [ ] All unit tests pass (`npm test`)
- [ ] ESLint warnings < 50 (`npm run lint`)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] E2E tests pass (with flaky tolerance)
- [ ] Code review approved for `e2e/**` changes

### Release Requirements
- [ ] Coverage ≥ current baseline (no regression)
- [ ] Zero open `flaky-test` issues
- [ ] All critical E2E scenarios passing
- [ ] Performance regression checks

## 🔧 Test Development Guidelines

### E2E Test Best Practices
```typescript
// ✅ Good: Use role selectors
await page.getByRole('button', { name: 'Submit' }).click()

// ❌ Bad: Text selectors
await page.click('text=Submit')

// ✅ Good: Explicit waits
await page.waitForURL('**/dashboard', { timeout: 30000 })

// ❌ Bad: Implicit waits
await expect(page).toHaveURL('/dashboard')
```

### Selector Priority
1. **Role selectors**: `getByRole('button', { name: 'Submit' })`
2. **Test IDs**: `getByTestId('submit-button')`
3. **Labels**: `getByLabel('Email Address')`
4. **Text** (last resort): `getByText('Submit')`

### Wait Strategies
- **Navigation**: `page.waitForURL()`
- **Element visibility**: `expect(locator).toBeVisible()`
- **Network requests**: `page.waitForResponse()`
- **Custom conditions**: `page.waitForFunction()`

## 📊 Metrics & Monitoring

### Weekly Reports
- Coverage trend (target: +2% per sprint)
- Flaky test count (target: 0)
- Test execution time (target: <5 min total)
- CI success rate (target: >95%)

### Dashboard Links
- [Jest Coverage Report](../coverage/lcov-report/index.html)
- [Playwright Test Results](../test-results/)
- [GitHub Actions](https://github.com/JunP1ayer/huyou-wakarundesu/actions)

## 🚀 Roadmap

### Phase 1: Stabilization (2 weeks)
- [ ] Fix all current flaky tests
- [ ] Re-enable `failOnFlaky: true`
- [ ] Improve E2E test reliability

### Phase 2: Coverage Improvement (4 weeks)
- [ ] Unit test coverage: 8.6% → 25%
- [ ] Add boundary value tests
- [ ] Component integration tests

### Phase 3: Advanced Testing (6 weeks)
- [ ] Mutation testing with Stryker.js
- [ ] Performance testing integration
- [ ] Visual regression tests

## 🎯 Success Criteria

### Definition of Done
1. **No Flaky Tests**: Zero open issues with `flaky-test` label
2. **Coverage Target**: Minimum 25% unit test coverage
3. **CI Reliability**: >95% success rate over 30 days
4. **Test Speed**: Full E2E suite completes in <10 minutes

### Quality Metrics
- **Test Reliability**: No random failures
- **Maintainability**: Clear, readable test code
- **Coverage**: Meaningful tests, not just metrics
- **Speed**: Fast feedback loop for developers

---

## 📞 Contact & Support

**QA Lead**: @JunP1ayer  
**Testing Channel**: #qa-testing  
**Issue Reports**: Use `flaky-test` label in GitHub Issues

Last Updated: 2024-01-14