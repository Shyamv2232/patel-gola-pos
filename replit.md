# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Patel Gola POS App

Mobile-friendly POS app for a gola (ice dish) stall called "Patel Gola". Built with Expo (React Native).

### Features
- **New Order**: Colorful flavor card grid, tap to select multiple flavors, then tap item type buttons (Stick Rs.40, Special Stick Rs.60, Dish Rs.100, Special Dish Rs.170) to set quantity. Add multiple items per order.
- **Active Orders**: View and manage all pending orders. Tap to edit, add more items, or complete.
- **Order History**: View completed orders by date (last 7 days). Export weekly data as text. Auto-delete old data.
- **Admin**: Add/remove/edit flavors with color picker. Update item type prices.

### Data Storage
- All data persisted locally using AsyncStorage (no backend needed)
- 15 default flavors: Blue Berry, Butter Scotch, Chocolate, Falsa, Jamun, Kala Khatta, Kachi Keri, Mango, Mava Malai, Orange, Pineapple, Rose, Rajbhog, Strawberry, Vanilla

### Key Files
- `artifacts/patel-gola/context/AppContext.tsx` — All state management
- `artifacts/patel-gola/constants/flavors.ts` — Data types and defaults
- `artifacts/patel-gola/constants/colors.ts` — Theme colors (vibrant orange/warm)
- `artifacts/patel-gola/app/(tabs)/` — Tab screens (index, orders, history, admin)
- `artifacts/patel-gola/app/order-detail.tsx` — Order editing modal

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
