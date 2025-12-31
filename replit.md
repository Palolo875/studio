# KairuFlow

## Overview
KairuFlow is an intelligent task management assistant application built with Next.js 16. It features an AI-powered task management system with energy-based scheduling, NLP processing, and productivity tracking.

## Project Structure
- `src/app/` - Next.js App Router pages
  - `dashboard/` - Main dashboard and sub-pages (bibliotheque, capture, evening, focus, settings, stats)
  - `onboarding/` - User onboarding flow
- `src/components/` - React components
  - `ui/` - Reusable UI components (shadcn/ui based)
  - `dashboard/` - Dashboard-specific components
  - `capture/`, `focus/`, `stats/` - Feature-specific components
- `src/lib/` - Core library code
  - `database/` - Dexie-based IndexedDB database
  - `nlp/` - Natural Language Processing for task extraction
  - `playlist/` - Smart task playlist generation
  - `taskEngine/` - Brain engine for task scoring and selection
  - `burnout/` - Burnout prevention engine
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `docs/` - Project documentation and phase specs
- `e2e/` - End-to-end tests (Playwright)

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: React hooks + IndexedDB (Dexie)
- **Testing**: Vitest (unit), Playwright (e2e)

## Development
- Dev server runs on port 5000
- Uses Turbopack for fast builds
- French language interface

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
