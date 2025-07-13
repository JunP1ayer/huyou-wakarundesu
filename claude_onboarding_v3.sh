#!/bin/bash
# ===== claude_onboarding_v3.sh =====
# 目的: 扶養わかるんです。MVP を 2025 改正税制に完全準拠させる
# 実行: bash claude_onboarding_v3.sh

claude --dangerously-skip-permissions <<'EOF'
ultra think
You are the lead TypeScript/Next.js engineer on the FinTech app **「扶養わかるんです。」**  
Local repo (Next.js + Supabase) is already set up.  
Implement the **Adaptive Onboarding v3 + Real-time Allowance Engine** per the latest tax revisions (2025).

────────────────────────────────────────
🎯 **Deliverables (single PR)**
────────────────────────────────────────

### A. Adaptive Onboarding Wizard (max 8 steps, branch pruning)

| Step ID | Screen | Field(s) | 出現条件 |
|---------|--------|----------|-----------|
| 0 | **ScreenDOB**          | dob (calendar) | always |
| 1 | **ScreenStudent**      | student: boolean | age 19-22 |
| 2 | **ScreenInsurance**    | insurance_status: `"parent"` / `"self"` | always |
| 3 | **ScreenOtherInc**     | other_income: boolean | insurance_status = "parent" |
| 4 | **ScreenMultiPay**     | multi_pay: boolean | insurance_status = "parent" |
| 5 | **ScreenFutureIns**    | future_self_ins_date: date? | insurance_status = "parent" |
| 6 | **ScreenJobs**         | jobs[] (multi-autoComplete) | insurance_status = "parent" |
| 7 | **ScreenBankLink**     | ≥1 MoneyTap account | insurance_status = "parent" |

> Use `getNextStep(answers)` with the branch rules above.  
> If `insurance_status === "self"` **or** `future_self_ins_date` is past, skip Steps 3-7 and land on Dashboard in **Independent Mode** (no残額ゲージ).

### B. Updated Tax Walls & Helper

```ts
export const WALLS = {
  resident:       1_100_000,  // 住民税 非課税 2025-
  incomeGeneral:  1_230_000,  // 所得税 一般扶養 2025-
  incomeStudent:  1_500_000,  // 所得税 特定扶養 19-22 歳
  socialInsurance:1_300_000   // 社保被扶養
} as const;
```

*Implement `decideThreshold({dob, student, insurance_status, future_self_ins_date, eventDate})` that:*

1. Switches to `WALLS.socialInsurance` once `insurance_status === "self"` **or** today ≥ `future_self_ins_date`.
2. Uses `WALLS.incomeStudent` if age 19-22 **and** student === true.
3. Falls back to `WALLS.incomeGeneral`.
4. Tracks `residentAllowance = WALLS.resident`.

### C. Event-driven threshold recalculation

*Table `events`*

| id | user_id | type (`"leave_school"` / `"join_social_insurance"` / `"return_school"`) | happened_on |

*Hook* — on insert/update of `events` ➜ trigger `recalcAllowance(user_id)` for the current & remaining months.

### D. Real-time Allowance Engine

1. `/api/bank/webhook` → `classifyDeposit(evt)`

   * Fuzzy-join with `jobs[]`
   * Period≈30±3d & CV<0.2 → tag `"salary"`
   * Else `needs_review = true`
2. `recalcAllowance(userId)`

   ```
   const {currentWall, residentWall} = decideThreshold(...);
   const sumSalary = Σ salary deposits YTD (excluding needs_review && nonTaxableTag);
   const remaining = currentWall - sumSalary;
   update profiles.remaining_allowance + dangerLevel;
   ```
3. Supabase realtime → Dashboard gauge instant update (safe<90%, warn 90-99%, danger ≥100%).

### E. Manual-Input Flow

If `multi_pay === true` **or** `other_income === true`:

* Unlock `ManualIncomeCard` under Dashboard.
* CRUD in table `manual_incomes` (amount, paid_on, taxable:boolean).

### F. UI / DX

* Storybook stories for new screens.
* Jest: `decideThreshold`, `classifyDeposit`, event re-calc edge cases.
* `pnpm dev` starts Next.js + MoneyTap sandbox + webhook simulator.

────────────────────────────────────────
↩︎ **RESPONSE Format**
────────────────────────────────────────

1. High-level task breakdown (with ETAs)
2. DB schema diff (SQL)
3. How to run local webhook & event tests
4. Any open questions / assumptions

EOF