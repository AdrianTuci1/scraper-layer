import { useWorkflows } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import useExecutionPlan from '@/hooks/useExecutionPlan';
import { useReactFlow } from '@xyflow/react';
import { UploadIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

function PublishButton({ workflowId }: { workflowId: string }) {
  const generateExecutionPlan = useExecutionPlan();
  const { publish, isPublishing } = useWorkflows();
  const { toObject } = useReactFlow();

  const handlePublish = () => {
    const plan = generateExecutionPlan();
    if (!plan) return;
    toast.loading('Publishing workflow...', { id: workflowId });
    publish(
      {
        id: workflowId,
        flowDefinition: JSON.stringify(toObject()),
      },
      {
        onSuccess: () => {
          toast.success('Workflow published', { id: workflowId });
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Something went wrong', {
            id: workflowId,
          });
        },
      }
    );
  };

  return (
    <Button
      variant={'outline'}
      className="flex items-center gap-2"
      onClick={handlePublish}
      disabled={isPublishing}
    >
      <UploadIcon size={16} className="stroke-green-400" /> Publish
    </Button>
  );
}

export default PublishButton;
