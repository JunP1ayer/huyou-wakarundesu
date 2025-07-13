# ===== claude_release_prep.sh =====
# 目的: 扶養わかるんです。v0.1.0 を本番投入できる "リリース品質" へ仕上げる
# 実行: bash claude_release_prep.sh

claude --dangerously-skip-permissions <<'EOF'
ultra think
You are the DevOps & Full-stack engineer for the FinTech app **「扶養わかるんです。」**.  
Adaptive Onboarding v3 + Real-time Allowance Engine is already merged locally.  
Your mission: harden the project for **production release** (checklist below).

────────────────────────────────────────
🎯 **Deliverables (single PR titled release-prep/v0.1.0)**
────────────────────────────────────────

### 1. CI / CD
1.1 **GitHub Actions**  
  * Workflow: `ci.yml`  
    - Jobs: _install → lint → unit → e2e → storybook → build_  
    - Matrix: \`node: 18, 20\`  
    - Cache: pnpm + playwright  
  * Inject secrets: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MIXPANEL_TOKEN`

1.2 **Preview Deploy**  
  * Add `vercel-staging.yml` – deploy `release-*` branches to **staging** alias  
  * Comment PR with preview URL

### 2. Supabase Security Audit
2.1 **RLS Test Script** (`scripts/rls-smoke.ts`)  
  - Attempt cross-uid read/write → expect 403  
  - Run in CI after unit tests

### 3. Load / Perf Testing
3.1 **Webhook Load Test** (`scripts/load-webhook.ts`)  
  - Fire 1 000 deposits/min for 5 min with random jobIds  
  - Assert `profiles.remaining_allowance` updates < 200 ms avg

### 4. Monitoring & Error Tracking
4.1 **Sentry**  
  - Add `@sentry/nextjs` with minimal config  
  - Capture API route errors & unhandled rejections

4.2 **LogRocket (optional toggle)**  
  - Wrap `<App>` when `NEXT_PUBLIC_LOGROCKET_ID` present

### 5. UX / Legal
5.1 **Disclaimer**  
  - Add `<LegalFooter>` to Dashboard & Onboarding Complete  
  - Copy: "最終判断は税務署にご確認ください"

### 6. Docs
6.1 **CHANGELOG.md** – section `## [0.1.0] - YYYY-MM-DD`  
6.2 **docs/README.md** – API endpoints, webhook simulator, CI commands  
6.3 **docs/ARCHITECTURE.md** – high-level diagram (PlantUML)

### 7. Response Format
Return a **Markdown** summary containing:
- 🗂 Task list & ETA
- 🛠️ GitHub Actions snippet
- 🔐 Secret names expected in repo settings
- 🗃 SQL diff for any RLS tweaks
- 🏃 Local commands: `pnpm rls-test`, `pnpm load-test`, `pnpm storybook`

EOF