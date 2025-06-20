import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Mock data for development
const MOCK_PHASES: Phase[] = [
  {
    id: 'phase1',
    name: 'Research & Development',
    subcomponents: [
      {
        id: 'sub1',
        title: 'Basic Research',
        step: 'Initial research phase',
        hint: 'Focus on fundamental research',
        frequencyPercent: 30,
        timePercent: 25
      },
      {
        id: 'sub2',
        title: 'Applied Research',
        step: 'Applied research phase',
        hint: 'Focus on practical applications',
        frequencyPercent: 40,
        timePercent: 35
      }
    ]
  },
  {
    id: 'phase2',
    name: 'Testing & Validation',
    subcomponents: [
      {
        id: 'sub3',
        title: 'Prototype Testing',
        step: 'Test phase',
        hint: 'Validate prototype functionality',
        frequencyPercent: 20,
        timePercent: 25
      },
      {
        id: 'sub4',
        title: 'Performance Analysis',
        step: 'Analysis phase',
        hint: 'Analyze performance metrics',
        frequencyPercent: 10,
        timePercent: 15
      }
    ]
  }
];

// Types
export interface Phase {
  id: string;
  name: string;
  subcomponents: Subcomponent[];
}

export interface Subcomponent {
  id: string;
  title: string;
  step: string;
  hint: string;
  frequencyPercent: number;
  timePercent: number;
}

export interface ApiError extends Error {
  isOptimisticError?: boolean;
  optimisticData?: any;
  status?: number;
  config?: any;
  retryCount?: number;
  code?: string;
  response?: {
    status: number;
  };
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Retry interceptor
const retryInterceptor = async (error: ApiError) => {
  const config = error.config;
  if (!config) return Promise.reject(error);

  // Initialize retry count if not set
  config.retryCount = (config.retryCount || 0) + 1;

  // Check if we should retry
  if (config.retryCount <= MAX_RETRIES) {
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config.retryCount));
    return api(config);
  }

  return Promise.reject(error);
};

// API client
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add retry interceptor
api.interceptors.response.use(
  response => response,
  retryInterceptor
);

// Error handling interceptor
api.interceptors.response.use(
  response => response,
  (error: ApiError) => {
    console.error('API Error:', error);
    // If we're in development and the server is not available or returns 404, return mock data
    if (process.env.NODE_ENV === 'development' && (error.code === 'ERR_NETWORK' || error.response?.status === 404)) {
      console.warn('Server not available or endpoint not found, using mock data');
      // Return a mock response that matches the expected structure
      return {
        data: MOCK_PHASES,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config
      };
    }
    return Promise.reject(error);
  }
);

// Phase and Subcomponent API functions with optimistic updates
export const phaseApi = {
  // Get phases for a business and year
  getPhases: async (businessId: string, year: number): Promise<Phase[]> => {
    try {
      const response = await api.get<Phase[]>(`/businesses/${businessId}/years/${year}/phases`);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      if (process.env.NODE_ENV === 'development' && (apiError.code === 'ERR_NETWORK' || apiError.response?.status === 404)) {
        // Return mock data in development when server is not available
        return MOCK_PHASES;
      }
      throw apiError;
    }
  },

  // Save phase data with optimistic update
  savePhase: async (businessId: string, year: number, phaseId: string, data: Partial<Phase>): Promise<Phase> => {
    try {
      const response = await api.put<Phase>(`/businesses/${businessId}/years/${year}/phases/${phaseId}`, data);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      if (process.env.NODE_ENV === 'development' && (apiError.code === 'ERR_NETWORK' || apiError.response?.status === 404)) {
        // Return mock data in development when server is not available
        const mockPhase = MOCK_PHASES.find(p => p.id === phaseId) || {
          id: phaseId,
          name: data.name || 'Mock Phase',
          subcomponents: []
        };
        return { ...mockPhase, ...data };
      }
      apiError.isOptimisticError = true;
      apiError.optimisticData = data;
      throw apiError;
    }
  },
};

export const subcomponentApi = {
  // Get subcomponents for a phase
  getSubcomponents: async (businessId: string, year: number, phaseId: string): Promise<Subcomponent[]> => {
    try {
      const response = await api.get<Subcomponent[]>(`/businesses/${businessId}/years/${year}/phases/${phaseId}/subcomponents`);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      if (process.env.NODE_ENV === 'development' && (apiError.code === 'ERR_NETWORK' || apiError.response?.status === 404)) {
        // Return mock data in development when server is not available
        const mockPhase = MOCK_PHASES.find(p => p.id === phaseId);
        return mockPhase?.subcomponents || [];
      }
      throw apiError;
    }
  },

  // Save subcomponent data with optimistic update
  saveSubcomponent: async (
    businessId: string,
    year: number,
    phaseId: string,
    subcomponentId: string,
    data: Partial<Subcomponent>
  ): Promise<Subcomponent> => {
    try {
      const response = await api.put<Subcomponent>(
        `/businesses/${businessId}/years/${year}/phases/${phaseId}/subcomponents/${subcomponentId}`,
        data
      );
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      if (process.env.NODE_ENV === 'development' && (apiError.code === 'ERR_NETWORK' || apiError.response?.status === 404)) {
        // Return mock data in development when server is not available
        const mockPhase = MOCK_PHASES.find(p => p.id === phaseId);
        const mockSubcomponent = mockPhase?.subcomponents.find(s => s.id === subcomponentId) || {
          id: subcomponentId,
          title: data.title || 'Mock Subcomponent',
          step: data.step || '',
          hint: data.hint || '',
          frequencyPercent: data.frequencyPercent || 0,
          timePercent: data.timePercent || 0
        };
        return { ...mockSubcomponent, ...data };
      }
      apiError.isOptimisticError = true;
      apiError.optimisticData = data;
      throw apiError;
    }
  },

  // Delete subcomponent with optimistic update
  deleteSubcomponent: async (
    businessId: string,
    year: number,
    phaseId: string,
    subcomponentId: string
  ): Promise<void> => {
    try {
      await api.delete(`/businesses/${businessId}/years/${year}/phases/${phaseId}/subcomponents/${subcomponentId}`);
    } catch (error) {
      const apiError = error as ApiError;
      if (process.env.NODE_ENV === 'development' && (apiError.code === 'ERR_NETWORK' || apiError.response?.status === 404)) {
        // In development, just return when server is not available
        return;
      }
      apiError.isOptimisticError = true;
      throw apiError;
    }
  },
};

export default api; 