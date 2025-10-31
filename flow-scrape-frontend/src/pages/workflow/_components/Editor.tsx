import { useWorkflow } from '@/hooks/useApi';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import FlowEditor from './FlowEditor';
import Topbar from './topbar/Topbar';
import TaskMenu from './TaskMenu';
import { FlowValidationContextProvider } from '@/components/context/FlowValidationContext';
import { WorkflowStatus } from '@/lib/types';
import { Loader2Icon } from 'lucide-react';

function EditorPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { data: workflow, isLoading } = useWorkflow(workflowId || '');

  if (isLoading || !workflowId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2Icon className="h-10 w-10 animate-spin stroke-primary" />
      </div>
    );
  }

  if (!workflow) {
    return <div>Workflow not found</div>;
  }

  return (
    <FlowValidationContextProvider>
      <ReactFlowProvider>
        <div className="flex flex-col h-[calc(100vh-50px)] w-full">
          <Topbar
            title="Workflow editor"
            subtitle={workflow.name}
            workflowId={workflow.id}
            isPublished={workflow.status === WorkflowStatus.PUBLISHED}
          />
          <section className="flex flex-1 overflow-hidden min-h-0">
            <TaskMenu />
            <FlowEditor workflow={workflow} />
          </section>
        </div>
      </ReactFlowProvider>
    </FlowValidationContextProvider>
  );
}

export default EditorPage;
