# ASCEND Frontend

Feature-oriented React + Vite + TypeScript web application for the ASCEND platform.

## Architectural Boundaries

- **`src/app/`**: Root initialization, router, providers.
- **`src/components/`**: Shared presentation primitives strictly (`ui/`, `branding/`, `navigation/`, `feedback/`).
- **`src/features/`**: Bounded product capabilities (`auth/`, `interview/`, `resume/`, `integrity/`, `evaluation/`, `dashboard/`, `news/`).
- **`src/layouts/`**: Shell layouts (`PublicLayout/`, `AuthLayout/`, `InterviewLayout/`, `DashboardLayout/`).
- **`src/pages/`**: Route entry containers.
- **`src/services/`**: Communication layer (native `fetch` client, realtime WebSocket, media APIs).
- **`src/stores/`**: Zustand client-side global state.
- **`src/styles/`**: Design tokens (`theme.css`, `globals.css`, `animations.css`).

See [`docs/ASCEND_PROJECT_RULEBOOK.md`](file:///c:/Users/gagan/OneDrive/Documents/AI_COACH/docs/ASCEND_PROJECT_RULEBOOK.md) for master guidelines.
