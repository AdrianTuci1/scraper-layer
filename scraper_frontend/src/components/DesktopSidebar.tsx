import { Link, useLocation } from 'react-router-dom';

import { buttonVariants } from './ui/button';
import { routes } from '@/lib/data';
import UserAvailableCreditsBadge from './UserAvailableCreditsBadge';

function DesktopSidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="hidden relative md:block min-w-[280px] max-w-[280px] h-screen overflow-hidden w-full bg-primary/5 dark:bg-secondary/30 dark:text-foreground text-muted-foreground border-r-2 border-separate">
      <div className="flex items-center justify-center gap-2 border-b-[1px] border-separate p-4">
        <img src="/Document.png" alt="Flow Scrape" className="h-8 w-8" />
        <span className="text-2xl font-bold">Scraperlayer</span>
      </div>
      <div className="p-2">
        <UserAvailableCreditsBadge />
      </div>
      <div className="flex flex-col p-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            to={route.href}
            className={buttonVariants({
              variant:
                pathname === route.href || pathname.startsWith(route.href + '/') 
                  ? 'sidebarActiveitem' 
                  : 'sidebarItem',
            })}
          >
            <route.icon size={20} />
            {route.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DesktopSidebar;
