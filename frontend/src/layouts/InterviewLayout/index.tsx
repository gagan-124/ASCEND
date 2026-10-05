import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/navigation';

export function InterviewLayout() {
  const location = useLocation();

  // Explicitly opt out of the shared Navbar only in the active Interview Room
  const isInterviewRoom =
    location.pathname === '/interview/room' ||
    (location.pathname.startsWith('/interview/') &&
      location.pathname.split('/').length === 3 &&
      location.pathname !== '/interview/setup' &&
      location.pathname !== '/interview/roles');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {!isInterviewRoom && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
