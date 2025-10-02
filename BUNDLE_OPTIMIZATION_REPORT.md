# Bundle Optimization Report

## Analysis Date

January 2, 2025

## Current Issues

### Build Warnings

- **vendor-react bundle**: 1.4 MB (exceeds 1000 kB recommendation by 400 kB)
- **Total bundle size**: Significantly larger than necessary due to unused dependencies

## Unused Dependencies Identified

### Large Libraries (REMOVE - High Priority)

These are completely unused and add significant bloat:

1. **d3** (~200+ KB) - Data visualization library, not imported anywhere
2. **three** (~600+ KB) - 3D graphics library, not imported anywhere  
3. **recharts** (~150+ KB) - Only used in unused `src/components/ui/chart.tsx`
4. **@tanstack/react-query** (~50+ KB) - Not imported anywhere
5. **@octokit/core** + **octokit** (~100+ KB combined) - GitHub API clients, not imported

### Medium Libraries (REMOVE - Medium Priority)

6. **cmdk** - Only used in unused `src/components/ui/command.tsx`
7. **vaul** - Only used in unused `src/components/ui/drawer.tsx`
8. **input-otp** - Only used in unused `src/components/ui/input-otp.tsx`
9. **marked** - Markdown parser, not imported anywhere
10. **uuid** - UUID generator, not imported anywhere
11. **requirements** - Unknown purpose, not imported anywhere

### Unused UI Components

These components are never imported by the actual game:

- `src/components/ui/chart.tsx` (uses recharts)
- `src/components/ui/command.tsx` (uses cmdk)
- `src/components/ui/drawer.tsx` (uses vaul)
- `src/components/ui/input-otp.tsx` (uses input-otp)
- `src/components/TargetDistributionMonitor.tsx` (development tool, never used)

## Estimated Bundle Size Reduction

Removing these dependencies could reduce bundle size by **~1.2-1.5 MB** (approximately 45-55% reduction)

## Dependencies to Keep

These are actually used by the game:

- React 19 + react-dom (core)
- @radix-ui/* (UI components actually used)
- framer-motion (animations)
- lucide-react (icons)
- @phosphor-icons/react (icons)
- class-variance-authority, clsx, tailwind-merge (styling utilities)
- next-themes (theme management)
- react-error-boundary (error handling)
- react-hook-form, zod (form handling - may need review)
- embla-carousel-react (carousel functionality)
- date-fns (date utilities)
- sonner (toast notifications)

## Recommended Actions

1. ✅ **Remove unused dependencies from package.json**
2. ✅ **Delete unused UI component files**
3. **Review and potentially remove:**
   - Form handling libraries (react-hook-form, zod) if forms aren't used
   - @hookform/resolvers if forms aren't used
   - Carousel library if not needed
   - Some Radix UI components that might not be used

4. **Consider code splitting:**
   - Lazy load debug components
   - Dynamic imports for larger features
   - Separate vendor chunks more granularly

## Implementation Priority

### Phase 1 (Immediate) - Remove Completely Unused

- Remove: d3, three, @octokit/core, octokit, marked, uuid, requirements, @tanstack/react-query

### Phase 2 (High Priority) - Remove Unused UI Components

- Remove: recharts, cmdk, vaul, input-otp
- Delete corresponding UI component files

### Phase 3 (Medium Priority) - Audit Remaining

- Review Radix UI components usage
- Review form handling libraries
- Review other utilities

## Expected Results

- Faster build times
- Smaller bundle size (target: under 800 KB for main vendor chunk)
- Faster page load times
- Better user experience on slower connections
- Passes bundle size warnings
