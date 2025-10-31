import { useWorkflows } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { useReactFlow } from '@xyflow/react';
import { CheckIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

function SaveButton({ workflowId }: { workflowId: string }) {
  const { toObject } = useReactFlow();
  const { update, isUpdating } = useWorkflows();

  const handleSave = () => {
    const workflowDef = JSON.stringify(toObject());
    toast.loading('Saving Workflow', { id: 'save-workflow' });
    update(
      {
        id: workflowId,
        definition: workflowDef,
      },
      {
        onSuccess: () => {
          toast.success('Flow saved successfully', { id: 'save-workflow' });
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Something went wrong', {
            id: 'save-workflow',
          });
        },
      }
    );
  };

  return (
    <Button
      variant={'outline'}
      className="flex items-center gap-2"
      onClick={handleSave}
      disabled={isUpdating}
    >
      <CheckIcon size={16} className="stroke-green-400" />
      Save
    </Button>
  );
}

export default SaveButton;
