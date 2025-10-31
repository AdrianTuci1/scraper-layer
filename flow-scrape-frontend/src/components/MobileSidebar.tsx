import { routes } from '@/lib/data';
import { Link, useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Button, buttonVariants } from './ui/button';
import { MenuIcon } from 'lucide-react';
import Logo from './Logo';
import UserAvailableCreditsBadge from './UserAvailableCreditsBadge';

function MobileSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="block border-separate bg-background md:hidden">
      <nav className="flex container items-center justify-between px-8">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent
            className="w-[400px] sm:w-[540px] space-y-4"
            side="left"
          >
            <Logo />
            <UserAvailableCreditsBadge />
            <div className="flex flex-col gap-1">
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
                  onClick={() => setIsOpen((prev) => !prev)}
                >
                  <route.icon size={20} />
                  {route.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

export default MobileSidebar;
