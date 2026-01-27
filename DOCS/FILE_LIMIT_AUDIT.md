Deprecated. Audit results are delivered via chat to avoid creating extra markdown artifacts.

---

### Phase 3: Low Priority (Week 4)

#### 3.1 Refactor performance-monitor-utils.ts (Optional)

**New Structure:**

```
src/lib/performance/
├── index.ts                     # Re-exports all modules
├── marks-and-measures.ts        # createPerformanceMark, measurePerformanceBetweenMarks (~100 lines)
├── frame-rate-monitor.ts        # monitorFrameRate, FrameRateStats (~100 lines)
├── memory-utils.ts              # getMemoryUsage, MemoryUsageStats (~50 lines)
├── web-vitals-tracker.ts        # trackWebVitals, WebVitalMetric types (~150 lines)
└── types.ts                     # Shared type definitions (~50 lines)
```

---

#### 3.2 Refactor sentence-templates.ts (Optional)

**Option A: Split by language**

```
src/lib/constants/sentence-templates/
├── index.ts                     # Main API and language router
├── en.ts                        # English templates
├── fr.ts                        # French templates
├── ja.ts                        # Japanese templates
├── th.ts                        # Thai templates
├── zh-cn.ts                     # Mandarin templates
└── zh-hk.ts                     # Cantonese templates
```

**Option B: Keep as-is with lazy loading**

- Accept data files as exception to 500-line rule
- Document in coding standards

---

## Verification Checklist

### Pre-Refactoring

- [ ] Create feature branch: `refactor/file-limit-compliance`
- [ ] Run baseline tests: `npm run test:e2e`
- [ ] Run ESLint: `npx eslint src/ --max-warnings 0`
- [ ] Document current import graph

### During Each File Refactor

- [ ] Stage changes incrementally: `git add -p`
- [ ] Run affected tests after each split
- [ ] Verify no circular dependencies
- [ ] Check bundle size impact

### Post-Refactoring

- [ ] All files ≤ 500 lines: Run audit command
- [ ] All tests pass: `npm run verify`
- [ ] No ESLint errors: `npx eslint src/ --max-warnings 0`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] Visual regression check
- [ ] Update imports in consuming files
- [ ] Document changes in PR description

---

## Commit Strategy

### Recommended Commit Sequence

```bash
# Phase 1.1: Accessibility Utils
git commit -m "refactor(a11y): extract keyboard utilities to keyboard-utils.ts"
git commit -m "refactor(a11y): extract focus management to focus-management.ts"
git commit -m "refactor(a11y): extract ARIA utilities to aria-utils.ts"
git commit -m "refactor(a11y): extract user preference checks to user-preferences.ts"
git commit -m "refactor(a11y): extract AccessibilityManager class"
git commit -m "refactor(a11y): convert runtime CSS to static file"
git commit -m "refactor(a11y): add barrel exports and update imports"
git commit -m "refactor(a11y): remove original accessibility-utils.ts"

# Phase 1.2: Sidebar
git commit -m "refactor(sidebar): extract SidebarContext and provider"
git commit -m "refactor(sidebar): extract core sidebar components"
git commit -m "refactor(sidebar): extract layout components"
git commit -m "refactor(sidebar): extract menu components"
git commit -m "refactor(sidebar): extract CVA variants"
git commit -m "refactor(sidebar): add barrel exports and update imports"
git commit -m "refactor(sidebar): remove original sidebar.tsx"

# Phase 2: CSS
git commit -m "refactor(styles): split main.css into modular stylesheets"

# Phase 3: Optional
git commit -m "refactor(perf): modularize performance monitoring utilities"
git commit -m "refactor(i18n): split sentence templates by language"
```

---

## Validation Commands

```powershell
# Audit for files over 500 lines
Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.css |
  ForEach-Object {
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    if ($lines -gt 500) {
      [PSCustomObject]@{File=$_.FullName.Replace("$PWD\", ""); Lines=$lines}
    }
  } | Sort-Object Lines -Descending

# Run full verification
npm run verify

# Run E2E tests
npm run test:e2e

# Check ESLint
npx eslint src/ --max-warnings 0

# Check TypeScript
npx tsc --noEmit
```

---

## Estimated Effort

| Phase     | Files                        | Estimated Hours | Risk                  |
| --------- | ---------------------------- | --------------- | --------------------- |
| 1.1       | accessibility-utils.ts       | 4-6 hours       | Medium                |
| 1.2       | sidebar.tsx                  | 3-4 hours       | Low (already planned) |
| 2.1       | main.css                     | 2-3 hours       | Low                   |
| 3.1       | performance-monitor-utils.ts | 2 hours         | Very Low              |
| 3.2       | sentence-templates.ts        | 1 hour          | Very Low              |
| **Total** |                              | **12-16 hours** |                       |

---

## Success Metrics

1. **Zero files exceed 500 lines** in `src/` directory
2. **All tests pass** with no regressions
3. **No increase in bundle size** (within 5% tolerance)
4. **Improved import graph** with no circular dependencies
5. **ESLint clean** with zero warnings

---

## Related Documentation

- [copilot-instructions.md](../.github/copilot-instructions.md) - Coding standards
- [game-config.ts](../src/lib/constants/game-config.ts) - Game tuning constants
- PR #246 - Initial audit branch
