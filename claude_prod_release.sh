# ===== claude_prod_release.sh =====
# 目的: release-prep/v0.1.0 を main にマージし、v0.1.0 GitHub Release & Vercel 本番デプロイを実行
# 実行: bash claude_prod_release.sh

claude --dangerously-skip-permissions <<'EOF'
ultra think
You are the DevOps lead for **扶養わかるんです。**  
Branch *release-prep/v0.1.0* is fully validated (CI green).  
Perform the **production release** workflow below.

────────────────────────────────────────
🎯  Release Tasks
────────────────────────────────────────
1. **Merge** `release-prep/v0.1.0` → `main`
   - Squash-merge & keep commit message:  
     "chore(release): v0.1.0 – adaptive onboarding, 2025 tax compliance, RLS hardened"
2. **Tag** `v0.1.0`
   - Annotated tag with CHANGELOG section
3. **GitHub Release**
   - Title: "扶養わかるんです。v0.1.0"
   - Body: paste **Release Preparation v0.1.0 – COMPLETE!** markdown
   - Attach Storybook static build (`storybook-static.zip`)
4. **Vercel Production Promotion**
   - Trigger redeploy on `main`
   - Alias `fuyou-wakarundesu.app` to newest build
5. **Slack / Discord Notification**  
   - Post to #launches: "v0.1.0 is live – https://fuyou-wakarundesu.app"
6. **Optional Mobile Build** (skip if env var `EAS_SKIP=true`)
   - Run `eas build --profile production --platform all`
   - Upload artifacts links in Release notes

────────────────────────────────────────
🖇  Expected output
────────────────────────────────────────
- Task checklist with ✅ / ❌
- Git commands executed
- Vercel deployment URL
- Any blocking errors / required manual steps
EOF