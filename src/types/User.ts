export interface Client {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
  businessIds: string[]; // Array of business IDs this client owns
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  notes?: string;
}

export interface ClientWithBusinesses {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
  businessIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  notes?: string;
  businesses: BusinessSummary[];
}

export interface BusinessSummary {
  id: string;
  businessName: string;
  entityType: string;
  entityState: string;
  startYear: number;
  isActive: boolean;
}

export interface AdminState {
  clients: Client[];
  selectedClientId: string | null;
  selectedBusinessId: string | null;
  isAdminMode: boolean;
}

export interface CreateClientData {
  name: string;
  email: string;
  role: 'admin' | 'client';
  businessIds: string[];
  notes?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  role?: 'admin' | 'client';
  businessIds?: string[];
  isActive?: boolean;
  notes?: string;
} 