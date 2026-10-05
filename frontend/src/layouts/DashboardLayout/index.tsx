import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/navigation';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}

