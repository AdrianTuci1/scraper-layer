import { useAuth } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Hook pentru a obține token-ul și a face API calls
export function useApi() {
  const { getToken } = useAuth();

  const getTokenAsync = async () => {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    return token;
  };

  return { getToken: getTokenAsync };
}

// Hook pentru workflows
export function useWorkflows() {
  const { getToken } = useApi();
  const queryClient = useQueryClient();

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const token = await getToken();
      return api.workflows.list(token);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const token = await getToken();
      return api.workflows.create(data, token);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow created');
      // Navigate to editor - we'll handle this in the component
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create workflow');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      await api.workflows.delete(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete workflow');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      definition,
    }: {
      id: string;
      definition: string;
    }) => {
      const token = await getToken();
      return api.workflows.update(id, { definition }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update workflow');
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({
      id,
      flowDefinition,
    }: {
      id: string;
      flowDefinition: string;
    }) => {
      const token = await getToken();
      return api.workflows.publish(id, flowDefinition, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow published');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to publish workflow');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return api.workflows.unpublish(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow unpublished');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unpublish workflow');
    },
  });

  const executeMutation = useMutation({
    mutationFn: async ({
      id,
      flowDefinition,
    }: {
      id: string;
      flowDefinition?: string;
    }) => {
      const token = await getToken();
      return api.workflows.execute(id, token, flowDefinition);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowExecutions'] });
      toast.success('Workflow execution started');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to execute workflow');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: {
      id: string;
      name: string;
      description?: string;
    }) => {
      const token = await getToken();
      return api.workflows.duplicate(id, { name, description }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow duplicated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to duplicate workflow');
    },
  });

  const setCronMutation = useMutation({
    mutationFn: async ({ id, cron }: { id: string; cron: string }) => {
      const token = await getToken();
      return api.workflows.setCron(id, cron, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Schedule updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update schedule');
    },
  });

  const removeCronMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return api.workflows.removeCron(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Schedule removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove schedule');
    },
  });

  return {
    workflows: workflowsQuery.data || [],
    isLoading: workflowsQuery.isLoading,
    error: workflowsQuery.error,
    create: createMutation.mutate,
    delete: deleteMutation.mutate,
    update: updateMutation.mutate,
    publish: publishMutation.mutate,
    unpublish: unpublishMutation.mutate,
    execute: executeMutation.mutate,
    duplicate: duplicateMutation.mutate,
    setCron: setCronMutation.mutate,
    removeCron: removeCronMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    isPublishing: publishMutation.isPending,
    isUnpublishing: unpublishMutation.isPending,
    isExecuting: executeMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isSettingCron: setCronMutation.isPending,
    isRemovingCron: removeCronMutation.isPending,
  };
}

// Hook pentru a obține un workflow specific
export function useWorkflow(id: string) {
  const { getToken } = useApi();

  return useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const token = await getToken();
      return api.workflows.get(id, token);
    },
    enabled: !!id,
  });
}

// Hook pentru workflow executions
export function useWorkflowExecutions(
  workflowId: string,
  options?: { refetchInterval?: number | false }
) {
  const { getToken } = useApi();

  return useQuery({
    queryKey: ['workflowExecutions', workflowId],
    queryFn: async () => {
      const token = await getToken();
      return api.workflows.executions(workflowId, token);
    },
    enabled: !!workflowId,
    refetchInterval: options?.refetchInterval,
  });
}

// Hook pentru credentials
export function useCredentials() {
  const { getToken } = useApi();
  const queryClient = useQueryClient();

  const credentialsQuery = useQuery({
    queryKey: ['credentials'],
    queryFn: async () => {
      const token = await getToken();
      return api.credentials.list(token);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; value: string }) => {
      const token = await getToken();
      return api.credentials.create(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success('Credential created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create credential');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      await api.credentials.delete(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success('Credential deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete credential');
    },
  });

  return {
    credentials: credentialsQuery.data || [],
    isLoading: credentialsQuery.isLoading,
    error: credentialsQuery.error,
    create: createMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Hook pentru billing
export function useBilling() {
  const { getToken } = useApi();

  const creditsQuery = useQuery({
    queryKey: ['userAvailableCredits'],
    queryFn: async () => {
      const token = await getToken();
      return api.billing.getCredits(token);
    },
    refetchInterval: 30 * 1000,
  });

  const purchasesQuery = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const token = await getToken();
      return api.billing.purchases(token);
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packId: string) => {
      const token = await getToken();
      const checkoutUrl = await api.billing.purchase(packId, token);
      window.location.href = checkoutUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create purchase session');
    },
  });

  const invoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      const invoiceUrl = await api.billing.invoice(id, token);
      window.open(invoiceUrl, '_blank');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to fetch invoice');
    },
  });

  return {
    credits: creditsQuery.data,
    isLoadingCredits: creditsQuery.isLoading,
    purchases: purchasesQuery.data || [],
    isLoadingPurchases: purchasesQuery.isLoading,
    purchase: purchaseMutation.mutate,
    getInvoice: invoiceMutation.mutate,
    isPurchasing: purchaseMutation.isPending,
    isFetchingInvoice: invoiceMutation.isPending,
  };
}

