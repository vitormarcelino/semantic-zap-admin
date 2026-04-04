# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## SemanticZap — Admin Frontend

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
- No test runner is configured yet.

## Stack (actual versions)
- Next.js 16.2.2 (App Router) + React 19
- TypeScript strict
- Tailwind CSS v4 (uses `@tailwindcss/postcss`, not v3 config)
- shadcn/ui (components in `src/components/ui/` — do not edit manually)
- lucide-react for icons (20×20 standalone, 16px in sidebar; stroke-width 1.5, stroke-linecap round)
- Zustand v5 for global state
- TanStack Query v5 for async data
- Recharts v3 for charts
- framer-motion for animations

## Design System
- **Theme:** dark-first — background `#0F1117`, surface `#181C26`, cards `#1F2535`
- **Primary color:** `#00D060` (WhatsApp green)
- **Typography:** DM Sans (UI text) + JetBrains Mono (technical data, IDs, numbers)
  - Note: `layout.tsx` currently uses Geist fonts (boilerplate default) — swap to DM Sans / JetBrains Mono when building real pages
- **Border radius:** `rounded-lg` (12px) for cards, `rounded-md` (8px) for buttons and badges
- **Borders:** 0.5px, `border-white/8`
- Use CSS variables or Tailwind theme classes — no inline styles

## Conventions
- Server Components by default; add `'use client'` only when necessary (interactivity, hooks, browser APIs)
- File names: `kebab-case.tsx`; component names: `PascalCase`
- No emoji icons — always use lucide-react SVGs
- Colors via Tailwind classes or CSS variables from the theme — never raw hex in JSX

## Planned folder structure (not yet built)
```
src/
  app/              # App Router — layouts and pages
  components/
    ui/             # shadcn/ui generated — do not edit
    layout/         # Sidebar, Header, Shell
    agents/         # AgentCard, AgentStatusBadge, AgentStats
    common/         # Badge, MetricCard, FlowIndicator
  hooks/            # useAgents, useConversations, useWebhooks
  lib/              # utils, API client, constants
  stores/           # Zustand stores
  types/            # Global TypeScript types
```
