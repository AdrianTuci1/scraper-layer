import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import UserWorkflowSkeleton from './components/UserWorkflowSkeleton';
import UserWorkflows from './components/UserWorkflows';
import CreateWorkflowDialog from './components/CreateWorkflowDialog';

function WorkflowsPage() {
  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="flex justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">Manage your workflows</p>
        </div>
        <CreateWorkflowDialog />
      </div>
      <div className="h-full py-6">
        <Suspense fallback={<UserWorkflowSkeleton />}>
          <UserWorkflows />
        </Suspense>
      </div>
    </div>
  );
}

export default WorkflowsPage;

