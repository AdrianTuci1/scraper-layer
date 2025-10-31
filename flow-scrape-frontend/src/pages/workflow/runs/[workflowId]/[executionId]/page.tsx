import { useWorkflowExecutions } from '@/hooks/useApi';
import { useParams } from 'react-router-dom';
import Topbar from '../../../_components/topbar/Topbar';
import ExecutionViewer from './_components/ExecutionViewer';
import { Loader2Icon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function ExecutionViewerPage() {
  const { executionId, workflowId } = useParams<{
    executionId: string;
    workflowId: string;
  }>();

  if (!executionId || !workflowId) {
    return <div>Missing execution or workflow ID</div>;
  }

  // Get execution from executions list
  const { data: executions, isLoading } = useWorkflowExecutions(workflowId);
  const execution = executions?.find((e: any) => e.id === executionId);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden">
        <Topbar
          workflowId={workflowId}
          title="Workflow run details"
          subtitle={`Execution Id: ${executionId}`}
          hideButtons
        />
        <div className="flex w-full items-center justify-center">
          <Loader2Icon className="h-10 w-10 animate-spin stroke-primary" />
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden">
        <Topbar
          workflowId={workflowId}
          title="Workflow run details"
          subtitle={`Execution Id: ${executionId}`}
          hideButtons
        />
        <div className="flex w-full items-center justify-center">
          <div>Execution not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Topbar
        workflowId={workflowId}
        title="Workflow run details"
        subtitle={`Execution Id: ${executionId}`}
        hideButtons
      />
      <section className="flex h-full overflow-auto">
        <ExecutionViewer execution={execution} />
      </section>
    </div>
  );
}

export default ExecutionViewerPage;
