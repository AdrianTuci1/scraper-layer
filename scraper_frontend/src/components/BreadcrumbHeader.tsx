import { useLocation } from 'react-router-dom';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import MobileSidebar from './MobileSidebar';

function BreadcrumbHeader() {
  const location = useLocation();
  const pathname = location.pathname;
  // Filter out empty strings and 'dashboard' prefix
  const paths = pathname === '/' 
    ? [] 
    : pathname?.split('/').filter(Boolean).filter(path => path !== 'dashboard');

  return (
    <div className="flex items-center flex-start">
      <MobileSidebar />
      <Breadcrumb>
        <BreadcrumbList>
          {paths.map((path, index) => (
            <Fragment key={`${path}-${index}`}>
              <BreadcrumbItem>
                <BreadcrumbLink className="capitalize" href={`/dashboard/${paths.slice(0, index + 1).join('/')}`}>
                  {path}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {index !== paths.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

export default BreadcrumbHeader;
