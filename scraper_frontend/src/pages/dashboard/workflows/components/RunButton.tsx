import { useWorkflows } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { PlayIcon } from 'lucide-react';
import { toast } from 'sonner';

function RunButton({ workflowId }: { workflowId: string }) {
  const { execute, isExecuting } = useWorkflows();

  return (
    <Button
      variant={'outline'}
      size={'sm'}
      className="flex items-center gap-2"
      onClick={() => {
        toast.loading('Scheduling run...', { id: workflowId });
        execute(
          {
            id: workflowId,
          },
          {
            onSuccess: () => {
              toast.success('Workflow started', { id: workflowId });
            },
            onError: (error: Error) => {
              toast.error(error.message || 'Something went wrong', {
                id: workflowId,
              });
            },
          }
        );
      }}
      disabled={isExecuting}
    >
      <PlayIcon size={16} />
      Run
    </Button>
  );
}

export default RunButton;
