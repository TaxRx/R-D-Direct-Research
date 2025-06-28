import { Client, CreateClientData, UpdateClientData, ClientWithBusinesses, BusinessSummary } from '../types/User';
import { Business } from '../types/Business';

const CLIENTS_STORAGE_KEY = 'adminClientsData';
const ADMIN_STATE_STORAGE_KEY = 'adminStateData';

export class AdminService {
  // Get all clients
  static getClients(): Client[] {
    try {
      const savedData = localStorage.getItem(CLIENTS_STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    }
  }

  // Save clients to localStorage
  private static saveClients(clients: Client[]): void {
    try {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    } catch (error) {
      console.error('Error saving clients:', error);
    }
  }

  // Get client by ID
  static getClientById(clientId: string): Client | null {
    const clients = this.getClients();
    return clients.find(client => client.id === clientId) || null;
  }

  // Get client with business details
  static getClientWithBusinesses(clientId: string, businesses: Business[]): ClientWithBusinesses | null {
    const client = this.getClientById(clientId);
    if (!client) return null;

    const clientBusinesses: BusinessSummary[] = client.businessIds
      .map(businessId => {
        const business = businesses.find(b => b.id === businessId);
        if (!business) return null;
        
        return {
          id: business.id,
          businessName: business.businessName,
          entityType: business.entityType,
          entityState: business.entityState,
          startYear: business.startYear,
          isActive: true // You might want to add an isActive field to Business type
        };
      })
      .filter((business): business is BusinessSummary => business !== null);

    return {
      ...client,
      businesses: clientBusinesses
    };
  }

  // Create a new client
  static createClient(clientData: CreateClientData): Client {
    const clients = this.getClients();
    const newClient: Client = {
      id: Date.now().toString(),
      name: clientData.name,
      email: clientData.email,
      role: clientData.role,
      businessIds: clientData.businessIds,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: clientData.notes
    };

    clients.push(newClient);
    this.saveClients(clients);
    return newClient;
  }

  // Update client
  static updateClient(clientId: string, updateData: UpdateClientData): Client | null {
    const clients = this.getClients();
    const clientIndex = clients.findIndex(client => client.id === clientId);
    
    if (clientIndex === -1) return null;

    clients[clientIndex] = {
      ...clients[clientIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    this.saveClients(clients);
    return clients[clientIndex];
  }

  // Delete client
  static deleteClient(clientId: string): boolean {
    const clients = this.getClients();
    const filteredClients = clients.filter(client => client.id !== clientId);
    
    if (filteredClients.length === clients.length) return false; // Client not found
    
    this.saveClients(filteredClients);
    return true;
  }

  // Add business to client
  static addBusinessToClient(clientId: string, businessId: string): boolean {
    const client = this.getClientById(clientId);
    if (!client) return false;

    if (client.businessIds.includes(businessId)) return false; // Already has access

    return this.updateClient(clientId, {
      businessIds: [...client.businessIds, businessId]
    }) !== null;
  }

  // Remove business from client
  static removeBusinessFromClient(clientId: string, businessId: string): boolean {
    const client = this.getClientById(clientId);
    if (!client) return false;

    const updatedBusinessIds = client.businessIds.filter(id => id !== businessId);
    
    return this.updateClient(clientId, {
      businessIds: updatedBusinessIds
    }) !== null;
  }

  // Get clients by business ID
  static getClientsByBusinessId(businessId: string): Client[] {
    const clients = this.getClients();
    return clients.filter(client => client.businessIds.includes(businessId));
  }

  // Get available businesses for a client (businesses they don't have access to)
  static getAvailableBusinessesForClient(clientId: string, allBusinesses: Business[]): Business[] {
    const client = this.getClientById(clientId);
    if (!client) return allBusinesses;

    return allBusinesses.filter(business => !client.businessIds.includes(business.id));
  }

  // Save admin state
  static saveAdminState(state: { selectedClientId: string | null; selectedBusinessId: string | null; isAdminMode: boolean }): void {
    try {
      localStorage.setItem(ADMIN_STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving admin state:', error);
    }
  }

  // Admin state management
  static getAdminState(): { selectedClientId: string | null; selectedBusinessId: string | null; isAdminMode: boolean } {
    try {
      const savedData = localStorage.getItem(ADMIN_STATE_STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : { selectedClientId: null, selectedBusinessId: null, isAdminMode: false };
    } catch (error) {
      console.error('Error loading admin state:', error);
      return { selectedClientId: null, selectedBusinessId: null, isAdminMode: false };
    }
  }

  // Initialize with default admin client if no clients exist
  static initializeDefaultAdmin(): void {
    const clients = this.getClients();
    if (clients.length === 0) {
      const defaultAdmin: Client = {
        id: 'admin-1',
        name: 'System Administrator',
        email: 'admin@system.local',
        role: 'admin',
        businessIds: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: 'Default system administrator'
      };
      this.saveClients([defaultAdmin]);
    }
  }
} 