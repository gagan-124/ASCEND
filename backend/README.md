# ASCEND AI Interview Coach — Backend Architecture

This directory contains the production-grade backend architecture, database schemas, authorization policies, and Supabase integration assets for the ASCEND platform.

## Directory Structure

```
/backend
  └── /supabase
      ├── /migrations
      │   └── 20261008000000_initial_schema.sql  # Initial database schema & RLS policies
      └── /functions                             # Supabase Edge Functions (serverless)
```

## Security & Architectural Constraints

1. **Isolation**: No database logic, server secrets, or Supabase management functions live in `/frontend`.
2. **Canonical Identity**: `auth.users(id)` is the single source of truth for user authentication and authorization.
3. **Database Security (RLS)**: Row Level Security is enabled on every table. Authorization is enforced at the PostgreSQL database level using `auth.uid() = user_id`.
4. **Secret Management**:
   - `SUPABASE_SERVICE_ROLE_KEY` and OAuth Client Secrets must **NEVER** be committed to source code or exposed to `/frontend`.
   - The frontend consumes only public configuration (`VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`).

## Authentication Architecture

- **Supported Providers**: Google OAuth, GitHub OAuth, Email/Password.
- **Deferred Provider**: Microsoft OAuth (explicitly out of scope).
- **Callback URL**: `https://<project-ref>.supabase.co/auth/v1/callback`
