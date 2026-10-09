import { AuthPageContainer } from './AuthPageContainer';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { SignupForm } from '@/features/auth/components/SignupForm';
import { RecoveryForm } from '@/features/auth/components/RecoveryForm';

export { AuthCallbackPage } from './AuthCallbackPage';

export function LoginPage() {
  return (
    <AuthPageContainer enableFlicker={true}>
      <LoginForm />
    </AuthPageContainer>
  );
}

export function SignupPage() {
  return (
    <AuthPageContainer enableFlicker={false}>
      <SignupForm />
    </AuthPageContainer>
  );
}

export function ForgotPasswordPage() {
  return (
    <AuthPageContainer enableFlicker={false}>
      <RecoveryForm />
    </AuthPageContainer>
  );
}

