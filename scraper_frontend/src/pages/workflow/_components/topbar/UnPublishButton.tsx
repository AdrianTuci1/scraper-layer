import { useWorkflows } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';

function UnPublishButton({ workflowId }: { workflowId: string }) {
  const { unpublish, isUnpublishing } = useWorkflows();

  const handleUnpublish = () => {
    toast.loading('Unpublishing workflow...', { id: workflowId });
    unpublish(workflowId, {
      onSuccess: () => {
        toast.success('Workflow unpublished', { id: workflowId });
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Something went wrong', {
          id: workflowId,
        });
      },
    });
  };

  return (
    <Button
      variant={'outline'}
      className="flex items-center gap-2"
      onClick={handleUnpublish}
      disabled={isUnpublishing}
    >
      <DownloadIcon size={16} className="stroke-orange-500" /> Unpublish
    </Button>
  );
}

export default UnPublishButton;
