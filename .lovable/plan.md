

# Plan: Make App Smoother with Enhanced Animations & Transitions

Add smooth transitions across the entire app — page transitions, component interactions, hover effects, loading states, and micro-animations.

---

## Changes

### 1. Global CSS Enhancements (`src/index.css`)
- Add smooth `transition` defaults to all interactive elements (buttons, cards, links)
- Add CSS `scroll-behavior: smooth` to html
- Add subtle transition to background/color changes for theme switching
- Add new utility classes: `animate-stagger-in` for staggered list entries

### 2. Tailwind Config (`tailwind.config.ts`)
- Add new keyframes: `slide-in-left`, `slide-in-bottom`, `float`, `shimmer`
- Add corresponding animation utilities
- Add stagger delay utilities

### 3. Page Transitions — AppLayout (`src/components/layout/AppLayout.tsx`)
- Wrap `<Outlet />` with a fade/slide transition container so page changes feel smooth

### 4. Landing Page (`src/pages/Index.tsx`)
- Already has good animations; minor polish — add `transition-all` to decorative blobs for theme switch smoothness

### 5. Login & Register Pages (`src/pages/Login.tsx`, `src/pages/Register.tsx`)
- Add `animate-scale-in` entry animation to the card
- Add subtle focus transitions on inputs

### 6. Dashboard (`src/pages/Dashboard.tsx`)
- Already uses `animate-fade-in` and `animate-slide-up` — keep as is, these are solid

### 7. Sidebar (`src/components/layout/AppSidebar.tsx`)
- Add hover transition effects to menu items (subtle scale + color shift)

### 8. Cards & Interactive Elements
- Add `transition-all duration-200` to Card components globally via CSS utility
- Add hover lift effect (`hover:-translate-y-0.5 hover:shadow-elevated`) as a reusable class

---

## Summary
- ~6 files modified
- No new dependencies
- Focus on CSS-level transitions + Tailwind animation utilities
- All changes are visual/cosmetic — no logic changes

