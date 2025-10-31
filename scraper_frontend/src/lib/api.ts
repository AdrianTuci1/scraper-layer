import axios, { type AxiosInstance, AxiosError } from 'axios';

// Create axios instance
// In development, use relative URL to leverage Vite proxy
// In production, use full URL
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In development, use relative path to use Vite proxy
  if (import.meta.env.DEV) {
    return '/api/v1';
  }
  // In production, use full URL
  return 'http://localhost:3000/api/v1';
};

const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from Clerk - we'll need to pass it from component
    // For now, we'll handle it in each API call
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { message?: string } }>) => {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Helper function to create authenticated request
export async function createAuthenticatedRequest<T>(
  requestFn: (token: string) => Promise<T>,
  getToken: () => Promise<string | null>
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new Error('Authentication required');
  }
  return requestFn(token);
}

// API functions
export const api = {
  // Workflows
  workflows: {
    list: async (token: string) => {
      const response = await apiClient.get('workflows', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    get: async (id: string, token: string) => {
      const response = await apiClient.get(`workflows/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    create: async (data: { name: string; description?: string }, token: string) => {
      const response = await apiClient.post('workflows', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    update: async (id: string, data: { definition: string }, token: string) => {
      const response = await apiClient.put(`workflows/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    delete: async (id: string, token: string) => {
      await apiClient.delete(`workflows/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    publish: async (id: string, flowDefinition: string, token: string) => {
      const response = await apiClient.post(
        `workflows/${id}/publish`,
        { flowDefinition },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data;
    },
    unpublish: async (id: string, token: string) => {
      const response = await apiClient.post(
        `workflows/${id}/unpublish`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data;
    },
    execute: async (
      id: string,
      token: string,
      flowDefinition?: string
    ) => {
      const response = await apiClient.post(
        `workflows/${id}/execute`,
        { flowDefinition },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data;
    },
    setCron: async (id: string, cron: string, token: string) => {
      const response = await apiClient.put(
        `workflows/${id}/cron`,
        { cron },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data;
    },
    removeCron: async (id: string, token: string) => {
      const response = await apiClient.delete(`workflows/${id}/cron`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    duplicate: async (
      id: string,
      data: { name: string; description?: string },
      token: string
    ) => {
      const response = await apiClient.post(`workflows/${id}/duplicate`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    executions: async (id: string, token: string) => {
      const response = await apiClient.get(`workflows/${id}/executions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    getExecution: async (executionId: string, token: string) => {
      // First find which workflow this execution belongs to
      // For now, we'll need to search through workflows
      // This is not ideal but backend doesn't have a direct endpoint
      // TODO: Add /executions/:id endpoint to backend
      const response = await apiClient.get(`workflows/executions/${executionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
  },

  // Credentials
  credentials: {
    list: async (token: string) => {
      const response = await apiClient.get('credentials', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    get: async (id: string, token: string) => {
      const response = await apiClient.get(`credentials/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    create: async (data: { name: string; value: string }, token: string) => {
      const response = await apiClient.post('credentials', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    delete: async (id: string, token: string) => {
      await apiClient.delete(`credentials/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },

  // Billing
  billing: {
    getCredits: async (token: string) => {
      const response = await apiClient.get('billing/credits', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data.credits;
    },
    setup: async (token: string) => {
      await apiClient.post(
        'billing/setup',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    purchase: async (packId: string, token: string) => {
      const response = await apiClient.post(
        'billing/purchase',
        { packId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data.checkoutUrl;
    },
    purchases: async (token: string) => {
      const response = await apiClient.get('billing/purchases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    invoice: async (id: string, token: string) => {
      const response = await apiClient.get(`billing/purchases/${id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data.invoiceUrl;
    },
  },
};

export default apiClient;

