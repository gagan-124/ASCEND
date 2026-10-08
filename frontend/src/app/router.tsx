import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { InterviewLayout } from '@/layouts/InterviewLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { RouteLoader, AppSessionLoader } from '@/components/common';

import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { useInterviewStore } from '@/stores/interviewStore';

// Lazy-loaded Page Routes for initial bundle payload reduction
const LandingPage = lazy(() => import('@/pages/Landing').then((m) => ({ default: m.LandingPage })));
const OpeningPage = lazy(() => import('@/pages/Opening').then((m) => ({ default: m.OpeningPage })));
const ATSEvaluatorPage = lazy(() => import('@/pages/ATSEvaluator').then((m) => ({ default: m.ATSEvaluatorPage })));
const LoginPage = lazy(() => import('@/pages/Auth').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@/pages/Auth').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/Auth').then((m) => ({ default: m.ForgotPasswordPage })));
const OnboardingPage = lazy(() => import('@/pages/Onboarding').then((m) => ({ default: m.OnboardingPage })));
const InterviewSetupPage = lazy(() => import('@/pages/InterviewSetup').then((m) => ({ default: m.InterviewSetupPage })));
const InterviewRolesPage = lazy(() => import('@/pages/InterviewRoles').then((m) => ({ default: m.InterviewRolesPage })));
const InterviewRoomPage = lazy(() => import('@/pages/InterviewRoom').then((m) => ({ default: m.InterviewRoomPage })));
const ResultsPage = lazy(() => import('@/pages/Results').then((m) => ({ default: m.ResultsPage })));
const DashboardPage = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.DashboardPage })));
const ProfileSettingsPage = lazy(() => import('@/pages/ProfileSettings').then((m) => ({ default: m.ProfileSettingsPage })));
const PrivacyPage = lazy(() => import('@/pages/Legal').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('@/pages/Legal').then((m) => ({ default: m.TermsPage })));

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoader />}>{children}</Suspense>;
}

// Route Protection Shell Component
function ProtectedRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { isOnboarded, isLoaded } = useProfileStore();

  if (!isInitialized || (isAuthenticated && !isLoaded)) {
    return <AppSessionLoader statusText="Verifying security session..." />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

// Onboarding Protection Shell Component
function OnboardingRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { isOnboarded, isLoaded } = useProfileStore();

  if (!isInitialized || (isAuthenticated && !isLoaded)) {
    return <AppSessionLoader statusText="Loading profile state..." />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  if (isOnboarded) {
    return <Navigate to="/interview/setup" replace />;
  }
  return <Outlet />;
}

function InterviewSessionRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { sessionId } = useInterviewStore();
  const { interviewId } = useParams();

  if (!isInitialized) {
    return <AppSessionLoader statusText="Restoring interview workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  // Allow access if active sessionId exists or URL parameter contains interviewId
  if (!sessionId && !interviewId) {
    return <Navigate to="/interview/setup" replace />;
  }
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LazyRoute><LandingPage /></LazyRoute> },
      { path: 'opening', element: <LazyRoute><OpeningPage /></LazyRoute> },
      { path: 'ats-evaluator', element: <LazyRoute><ATSEvaluatorPage /></LazyRoute> },
      { path: 'privacy', element: <LazyRoute><PrivacyPage /></LazyRoute> },
      { path: 'terms', element: <LazyRoute><TermsPage /></LazyRoute> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LazyRoute><LoginPage /></LazyRoute> },
      { path: 'signup', element: <LazyRoute><SignupPage /></LazyRoute> },
      { path: 'forgot-password', element: <LazyRoute><ForgotPasswordPage /></LazyRoute> },
      { path: 'recovery', element: <LazyRoute><ForgotPasswordPage /></LazyRoute> },
    ],
  },
  {
    element: <OnboardingRoute />,
    children: [
      { path: '/onboarding', element: <LazyRoute><OnboardingPage /></LazyRoute> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/role',
        element: <Navigate to="/interview/roles" replace />,
      },
      {
        path: '/interview',
        element: <InterviewLayout />,
        children: [
          { index: true, element: <Navigate to="/interview/setup" replace /> },
          { path: 'setup', element: <LazyRoute><InterviewSetupPage /></LazyRoute> },
          { path: 'roles', element: <LazyRoute><InterviewRolesPage /></LazyRoute> },
          { path: 'preflight', element: <LazyRoute><InterviewRoomPage /></LazyRoute> },
          { path: 'room', element: <LazyRoute><InterviewRoomPage /></LazyRoute> },
          {
            element: <InterviewSessionRoute />,
            children: [
              { path: ':interviewId', element: <LazyRoute><InterviewRoomPage /></LazyRoute> },
            ],
          },
          { path: ':interviewId/results', element: <LazyRoute><ResultsPage /></LazyRoute> },
        ],
      },
      {
        path: '/results',
        element: <InterviewLayout />,
        children: [
          { index: true, element: <LazyRoute><ResultsPage /></LazyRoute> },
          { path: ':interviewId', element: <LazyRoute><ResultsPage /></LazyRoute> },
        ],
      },
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <LazyRoute><DashboardPage /></LazyRoute> },
        ],
      },
      {
        path: '/settings',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <LazyRoute><ProfileSettingsPage /></LazyRoute> },
        ],
      },
      {
        path: '/profile',
        element: <Navigate to="/settings" replace />,
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
