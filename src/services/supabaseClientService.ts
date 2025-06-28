import { supabase } from './supabase';
import { Client, CreateClientData, UpdateClientData, ClientWithBusinesses, BusinessSummary } from '../types/User';
import { Business } from '../types/Business';

export class SupabaseClientService {
  // Get all clients
  static async getClients(): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(user => ({
        id: user.id,
        name: user.name || user.email.split('@')[0], // Fallback to email prefix if no name
        email: user.email,
        role: user.role || 'client',
        businessIds: user.business_ids || [],
        isActive: user.is_active !== false,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at,
        notes: user.notes
      }));
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    }
  }

  // Get client with businesses
  static async getClientWithBusinesses(clientId: string): Promise<ClientWithBusinesses | null> {
    try {
      // Get client
      const { data: clientData, error: clientError } = await supabase
        .from('users')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      // Get businesses for this client
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });

      if (businessesError) throw businessesError;

      const client: ClientWithBusinesses = {
        id: clientData.id,
        name: clientData.name || clientData.email.split('@')[0],
        email: clientData.email,
        role: clientData.role || 'client',
        businessIds: clientData.business_ids || [],
        isActive: clientData.is_active !== false,
        createdAt: clientData.created_at,
        updatedAt: clientData.updated_at,
        lastLoginAt: clientData.last_login_at,
        notes: clientData.notes,
        businesses: businessesData.map(business => ({
          id: business.id,
          businessName: business.name,
          entityType: business.business_type,
          entityState: business.entity_state || '',
          startYear: business.start_year || new Date().getFullYear(),
          isActive: business.is_active !== false
        }))
      };

      return client;
    } catch (error) {
      console.error('Error loading client with businesses:', error);
      return null;
    }
  }

  // Create client
  static async createClient(clientData: CreateClientData): Promise<Client | null> {
    try {
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return null;
      }

      console.log('Creating client with authenticated user:', user.id);

      // Try to create the user with explicit ID
      const newUserId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          email: clientData.email,
          name: clientData.name,
          role: clientData.role || 'client',
          business_ids: [],
          is_active: true,
          notes: clientData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        
        // If RLS is blocking, try without explicit ID
        if (error.code === '42501') {
          console.log('Retrying without explicit ID...');
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .insert({
              email: clientData.email,
              name: clientData.name,
              role: clientData.role || 'client',
              business_ids: [],
              is_active: true,
              notes: clientData.notes
            })
            .select()
            .single();

          if (retryError) {
            console.error('Retry error:', retryError);
            throw retryError;
          }

          return {
            id: retryData.id,
            name: retryData.name || retryData.email.split('@')[0],
            email: retryData.email,
            role: retryData.role || 'client',
            businessIds: retryData.business_ids || [],
            isActive: retryData.is_active !== false,
            createdAt: retryData.created_at,
            updatedAt: retryData.updated_at,
            lastLoginAt: retryData.last_login_at,
            notes: retryData.notes
          };
        }
        
        throw error;
      }

      return {
        id: data.id,
        name: data.name || data.email.split('@')[0],
        email: data.email,
        role: data.role || 'client',
        businessIds: data.business_ids || [],
        isActive: data.is_active !== false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lastLoginAt: data.last_login_at,
        notes: data.notes
      };
    } catch (error) {
      console.error('Error creating client:', error);
      return null;
    }
  }

  // Update client
  static async updateClient(clientId: string, updateData: UpdateClientData): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: updateData.name,
          email: updateData.email,
          role: updateData.role,
          is_active: updateData.isActive,
          notes: updateData.notes
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name || data.email.split('@')[0],
        email: data.email,
        role: data.role || 'client',
        businessIds: data.business_ids || [],
        isActive: data.is_active !== false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lastLoginAt: data.last_login_at,
        notes: data.notes
      };
    } catch (error) {
      console.error('Error updating client:', error);
      return null;
    }
  }

  // Delete client
  static async deleteClient(clientId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  }

  // Assign business to client
  static async assignBusinessToClient(clientId: string, businessId: string): Promise<boolean> {
    try {
      // First, update the business to belong to this client
      const { error: businessError } = await supabase
        .from('businesses')
        .update({ user_id: clientId })
        .eq('id', businessId);

      if (businessError) throw businessError;

      // Then, update the client's business_ids array
      const { data: clientData, error: clientError } = await supabase
        .from('users')
        .select('business_ids')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      const currentBusinessIds = clientData.business_ids || [];
      if (!currentBusinessIds.includes(businessId)) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ business_ids: [...currentBusinessIds, businessId] })
          .eq('id', clientId);

        if (updateError) throw updateError;
      }

      return true;
    } catch (error) {
      console.error('Error assigning business to client:', error);
      return false;
    }
  }

  // Remove business from client
  static async removeBusinessFromClient(clientId: string, businessId: string): Promise<boolean> {
    try {
      // Update the client's business_ids array
      const { data: clientData, error: clientError } = await supabase
        .from('users')
        .select('business_ids')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      const currentBusinessIds = clientData.business_ids || [];
      const updatedBusinessIds = currentBusinessIds.filter((id: string) => id !== businessId);

      const { error: updateError } = await supabase
        .from('users')
        .update({ business_ids: updatedBusinessIds })
        .eq('id', clientId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error removing business from client:', error);
      return false;
    }
  }

  // Get clients by business
  static async getClientsByBusiness(businessId: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .contains('business_ids', [businessId]);

      if (error) throw error;

      return data.map(user => ({
        id: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        role: user.role || 'client',
        businessIds: user.business_ids || [],
        isActive: user.is_active !== false,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at,
        notes: user.notes
      }));
    } catch (error) {
      console.error('Error loading clients by business:', error);
      return [];
    }
  }

  // Get system statistics
  static async getSystemStats() {
    try {
      const [
        { count: clientsCount },
        { count: businessesCount },
        { count: employeesCount },
        { count: contractorsCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('businesses').select('*', { count: 'exact', head: true }),
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('contractors').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalClients: clientsCount || 0,
        totalBusinesses: businessesCount || 0,
        totalEmployees: employeesCount || 0,
        totalContractors: contractorsCount || 0
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return {
        totalClients: 0,
        totalBusinesses: 0,
        totalEmployees: 0,
        totalContractors: 0
      };
    }
  }
} 