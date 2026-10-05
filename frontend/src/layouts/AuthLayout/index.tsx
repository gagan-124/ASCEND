import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Outlet />
    </div>
  );
}
