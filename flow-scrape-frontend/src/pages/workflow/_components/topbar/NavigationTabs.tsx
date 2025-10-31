import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useLocation } from 'react-router-dom';

function NavigationTabs({ workflowId }: { workflowId: string }) {
  const location = useLocation();
  const pathname = location.pathname;

  // Extract active tab from pathname
  const activeValue = pathname.includes('/runs/') ? 'runs' : 'editor';

  return (
    <Tabs className="w-[400px]" value={activeValue}>
      <TabsList className="grid w-full grid-cols-2">
        <Link to={`/dashboard/workflow/editor/${workflowId}`}>
          <TabsTrigger value="editor" className="w-full">
            Editor
          </TabsTrigger>
        </Link>
        <Link to={`/dashboard/workflow/runs/${workflowId}`}>
          <TabsTrigger value="runs" className="w-full">
            Runs
          </TabsTrigger>
        </Link>
      </TabsList>
    </Tabs>
  );
}

export default NavigationTabs;
