import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { headerRoutes } from "@/lib/data";
import { MenuIcon, XIcon, ZapIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

function Navbar() {
  const { isSignedIn } = useAuth();
  const scrollIntoView = (ele: string) => {
    let element = document.getElementById(ele.substring(1));

    if (!element) return;
    element!.scrollIntoView({
      behavior: "smooth",
    });
  };

  const isMobile = useIsMobile();
  useEffect(() => {
    setIsMobileOpen(false);
  }, [isMobile]);

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter routes based on auth state
  const getNavRoutes = () => {
    if (isSignedIn) {
      return [
        ...headerRoutes.filter(route => route.href !== "/sign-in"),
        {
          title: "Dashboard",
          href: "/dashboard",
          className: "",
          button: true,
        },
      ];
    }
    return headerRoutes;
  };

  const routes = getNavRoutes();

  if (isMobile) {
    return (
      <div className="p-5 sticky top-0 left-0 z-50">
        {!isMobileOpen ? (
          <MenuIcon className="" onClick={() => setIsMobileOpen(true)} />
        ) : (
          <aside className="h-screen w-full box-border p-5 backdrop-blur-md absolute top-0 left-0 z-50">
            <XIcon onClick={() => setIsMobileOpen(false)} />
            <div className="mt-5 flex flex-col gap-5 h-full text-center items-center pt-60">
              {routes.map((route) =>
                route?.button ? (
                  <Button
                    key={route.href}
                    className="hover:bg-white group w-max"
                    asChild
                  >
                    <Link
                      className="text-lg font-light text-white group-hover:text-primary"
                      to={route.href}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {route.title}
                    </Link>
                  </Button>
                ) : (
                  <span
                    className="text-lg font-light hover:text-white cursor-pointer select-none"
                    key={route.href}
                    onClick={() => {
                      scrollIntoView(route.href);
                      setIsMobileOpen(false);
                    }}
                  >
                    {route.title}
                  </span>
                )
              )}
            </div>
          </aside>
        )}
      </div>
    );
  }

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center max-w-screen-xl mx-auto w-full text-primary py-10 sticky top-0 backdrop-blur-sm z-50">
      <Link className="flex items-center justify-center" to={isSignedIn ? "/dashboard" : "#"}>
        <ZapIcon className="h-8 w-8" />
        <span className="ml-2 text-white">Flow Scrape</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        {routes.map((route) =>
          route?.button ? (
            <Button 
              key={route.href}
              className="hover:bg-white group text-white hover:text-primary"
              asChild
            >
              <Link
                className="text-sm font-medium text-white group-hover:text-primary"
                to={route.href}
              >
                {route.title}
              </Link>
            </Button>
          ) : (
            <span
              className="text-sm font-medium hover:text-white cursor-pointer select-none"
              key={route.href}
              onClick={() => {
                scrollIntoView(route.href);
              }}
            >
              {route.title}
            </span>
          )
        )}
      </nav>
    </header>
  );
}

export default Navbar;
