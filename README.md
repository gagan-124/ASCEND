# ASCEND — AI-Powered Interview Practice & Career Coaching Platform

ASCEND is an advanced AI-powered interview practice and career coaching application built with React, Vite, TypeScript, and Supabase.

## Repository Structure

```text
ASCEND/
├── frontend/             # React 19, Vite, TypeScript, Tailwind CSS v4, Zustand
├── backend/              # Supabase migrations, Edge Functions, repositories, services, types
├── docs/                 # Authoritative project rulebook & architecture documentation
└── README.md             # Top-level repository overview
```

## Stack Architecture

- **Frontend**: Single-page application for user interface, responsive layouts, audio/video device checks, real-time interview room UI, results deep-dive reports, candidate dashboard, ATS evaluator, and settings.
- **Backend & Database**: Supabase PostgreSQL database, Row Level Security (RLS) policies, database triggers, storage buckets (`avatars`, `resumes`), Edge Functions, and server-side data repositories.

## Quick Start

### Prerequisites
- Node.js 18+
- npm / npx

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` in `frontend/` and `backend/`:

```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend (.env)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Running Locally

```bash
# Start frontend development server
npm run dev

# Run typechecks across frontend and backend
npm run typecheck
```

## License

MIT
