import BreadcrumbHeader from '@/components/BreadcrumbHeader';
import DesktopSidebar from '@/components/DesktopSidebar';
import { ModeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { SignedIn, UserButton } from '@clerk/clerk-react';
import { Outlet, useLocation } from 'react-router-dom';

function DashboardLayout() {
  const location = useLocation();
  const isWorkflowEditor = location.pathname.startsWith('/dashboard/workflow/editor');

  return (
    <div className="flex h-screen">
      {!isWorkflowEditor && <DesktopSidebar />}
      <div className="flex flex-col flex-1 max-h-screen">
        <header className="flex items-center justify-between px-6 py-4 h-[50px] container">
          <BreadcrumbHeader />
          <div className="gap-2 flex items-center">
            <ModeToggle />
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </header>
        <Separator />
        <div className="flex-1 overflow-auto">
          <div className={isWorkflowEditor ? "text-accent-foreground" : "container py-4 text-accent-foreground"}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;

