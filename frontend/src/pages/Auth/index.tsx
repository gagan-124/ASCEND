import { AuthPageContainer } from './AuthPageContainer';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { SignupForm } from '@/features/auth/components/SignupForm';
import { RecoveryForm } from '@/features/auth/components/RecoveryForm';

export function LoginPage() {
  return (
    <AuthPageContainer>
      <LoginForm />
    </AuthPageContainer>
  );
}

export function SignupPage() {
  return (
    <AuthPageContainer>
      <SignupForm />
    </AuthPageContainer>
  );
}

export function ForgotPasswordPage() {
  return (
    <AuthPageContainer>
      <RecoveryForm />
    </AuthPageContainer>
  );
}
