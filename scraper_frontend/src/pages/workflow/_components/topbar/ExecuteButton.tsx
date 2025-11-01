import { useWorkflows } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import useExecutionPlan from '@/hooks/useExecutionPlan';
import { useReactFlow } from '@xyflow/react';
import { PlayIcon } from 'lucide-react';
import { toast } from 'sonner';

function ExecuteButton({ workflowId }: { workflowId: string }) {
  const generateExecutionPlan = useExecutionPlan();
  const { execute, isExecuting } = useWorkflows();
  const { toObject } = useReactFlow();

  const handleExecute = () => {
    const plan = generateExecutionPlan();
    if (!plan) return;
    toast.loading('Starting execution...', { id: 'flow-execution' });
    execute(
      {
        id: workflowId,
        flowDefinition: JSON.stringify(toObject()),
      },
      {
        onSuccess: () => {
          toast.success('Execution Started', { id: 'flow-execution' });
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Something went wrong', {
            id: 'flow-execution',
          });
        },
      }
    );
  };

  return (
    <Button
      variant={'outline'}
      className="flex items-center gap-2"
      onClick={handleExecute}
      disabled={isExecuting}
    >
      <PlayIcon size={16} className="stroke-orange-400" /> Execute
    </Button>
  );
}

export default ExecuteButton;
