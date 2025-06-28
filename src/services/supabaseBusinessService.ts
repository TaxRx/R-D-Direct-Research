import { supabase } from './supabase';
import { Business } from '../types/Business';

export class SupabaseBusinessService {
  // Get all businesses
  static async getBusinesses(): Promise<Business[]> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(business => ({
        id: business.id,
        businessName: business.name,
        dbaName: business.dba_name || '',
        ein: business.ein || '',
        entityType: business.business_type || 'corporation',
        entityState: business.entity_state || '',
        startYear: business.start_year || new Date().getFullYear(),
        owners: business.owners || [],
        financialHistory: business.financial_history || [],
        tabApprovals: business.tab_approvals || {
          basicInfo: { isApproved: false, approvedAt: '', approvedBy: '' },
          ownership: { isApproved: false, approvedAt: '', approvedBy: '' },
          financial: { isApproved: false, approvedAt: '', approvedBy: '' }
        },
        isControlledGroup: business.is_controlled_group || false,
        isControlGroupLeader: business.is_control_group_leader || false,
        mailingStreetAddress: business.mailing_street_address || '',
        mailingCity: business.mailing_city || '',
        mailingState: business.mailing_state || '',
        mailingZip: business.mailing_zip || '',
        website: business.website || '',
        phoneNumber: business.phone_number || '',
        rolesByYear: {},
        years: {}
      }));
    } catch (error) {
      console.error('Error loading businesses:', error);
      return [];
    }
  }

  // Get business by ID
  static async getBusiness(businessId: string): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        businessName: data.name,
        dbaName: data.dba_name || '',
        ein: data.ein || '',
        entityType: data.business_type || 'corporation',
        entityState: data.entity_state || '',
        startYear: data.start_year || new Date().getFullYear(),
        owners: data.owners || [],
        financialHistory: data.financial_history || [],
        tabApprovals: data.tab_approvals || {
          basicInfo: { isApproved: false, approvedAt: '', approvedBy: '' },
          ownership: { isApproved: false, approvedAt: '', approvedBy: '' },
          financial: { isApproved: false, approvedAt: '', approvedBy: '' }
        },
        isControlledGroup: data.is_controlled_group || false,
        isControlGroupLeader: data.is_control_group_leader || false,
        mailingStreetAddress: data.mailing_street_address || '',
        mailingCity: data.mailing_city || '',
        mailingState: data.mailing_state || '',
        mailingZip: data.mailing_zip || '',
        website: data.website || '',
        phoneNumber: data.phone_number || '',
        rolesByYear: {},
        years: {}
      };
    } catch (error) {
      console.error('Error loading business:', error);
      return null;
    }
  }

  // Create new business
  static async createBusiness(businessData: Partial<Business>, userId: string): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          name: businessData.businessName,
          dba_name: businessData.dbaName || '',
          ein: businessData.ein || '',
          user_id: userId,
          business_type: businessData.entityType || 'corporation',
          entity_state: businessData.entityState || '',
          start_year: businessData.startYear || new Date().getFullYear(),
          owners: businessData.owners || [],
          financial_history: businessData.financialHistory || [],
          tab_approvals: businessData.tabApprovals || {
            basicInfo: { isApproved: false, approvedAt: '', approvedBy: '' },
            ownership: { isApproved: false, approvedAt: '', approvedBy: '' },
            financial: { isApproved: false, approvedAt: '', approvedBy: '' }
          },
          is_controlled_group: businessData.isControlledGroup || false,
          is_control_group_leader: businessData.isControlGroupLeader || false,
          mailing_street_address: businessData.mailingStreetAddress || '',
          mailing_city: businessData.mailingCity || '',
          mailing_state: businessData.mailingState || '',
          mailing_zip: businessData.mailingZip || '',
          website: businessData.website || '',
          phone_number: businessData.phoneNumber || '',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        businessName: data.name,
        dbaName: data.dba_name || '',
        ein: data.ein || '',
        entityType: data.business_type || 'corporation',
        entityState: data.entity_state || '',
        startYear: data.start_year || new Date().getFullYear(),
        owners: data.owners || [],
        financialHistory: data.financial_history || [],
        tabApprovals: data.tab_approvals || {
          basicInfo: { isApproved: false, approvedAt: '', approvedBy: '' },
          ownership: { isApproved: false, approvedAt: '', approvedBy: '' },
          financial: { isApproved: false, approvedAt: '', approvedBy: '' }
        },
        isControlledGroup: data.is_controlled_group || false,
        isControlGroupLeader: data.is_control_group_leader || false,
        mailingStreetAddress: data.mailing_street_address || '',
        mailingCity: data.mailing_city || '',
        mailingState: data.mailing_state || '',
        mailingZip: data.mailing_zip || '',
        website: data.website || '',
        phoneNumber: data.phone_number || '',
        rolesByYear: {},
        years: {}
      };
    } catch (error) {
      console.error('Error creating business:', error);
      return null;
    }
  }

  // Update business
  static async updateBusiness(businessId: string, updateData: Partial<Business>): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({
          name: updateData.businessName,
          dba_name: updateData.dbaName,
          ein: updateData.ein,
          business_type: updateData.entityType,
          entity_state: updateData.entityState,
          start_year: updateData.startYear,
          owners: updateData.owners,
          financial_history: updateData.financialHistory,
          tab_approvals: updateData.tabApprovals,
          is_controlled_group: updateData.isControlledGroup,
          is_control_group_leader: updateData.isControlGroupLeader,
          mailing_street_address: updateData.mailingStreetAddress,
          mailing_city: updateData.mailingCity,
          mailing_state: updateData.mailingState,
          mailing_zip: updateData.mailingZip,
          website: updateData.website,
          phone_number: updateData.phoneNumber,
          is_active: true
        })
        .eq('id', businessId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        businessName: data.name,
        dbaName: data.dba_name || '',
        ein: data.ein || '',
        entityType: data.business_type || 'corporation',
        entityState: data.entity_state || '',
        startYear: data.start_year || new Date().getFullYear(),
        owners: data.owners || [],
        financialHistory: data.financial_history || [],
        tabApprovals: data.tab_approvals || {
          basicInfo: { isApproved: false, approvedAt: '', approvedBy: '' },
          ownership: { isApproved: false, approvedAt: '', approvedBy: '' },
          financial: { isApproved: false, approvedAt: '', approvedBy: '' }
        },
        isControlledGroup: data.is_controlled_group || false,
        isControlGroupLeader: data.is_control_group_leader || false,
        mailingStreetAddress: data.mailing_street_address || '',
        mailingCity: data.mailing_city || '',
        mailingState: data.mailing_state || '',
        mailingZip: data.mailing_zip || '',
        website: data.website || '',
        phoneNumber: data.phone_number || '',
        rolesByYear: {},
        years: {}
      };
    } catch (error) {
      console.error('Error updating business:', error);
      return null;
    }
  }

  // Delete business
  static async deleteBusiness(businessId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting business:', error);
      return false;
    }
  }

  // Get businesses by user/client
  static async getBusinessesByUser(userId: string): Promise<Business[]> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(business => ({
        id: business.id,
        businessName: business.name,
        dbaName: business.dba_name || '',
        ein: business.ein || '',
        entityType: business.business_type || 'corporation',
        entityState: business.entity_state || '',
        startYear: business.start_year || new Date().getFullYear(),
        owners: business.owners || [],
        financialHistory: business.financial_history || [],
        tabApprovals: business.tab_approvals || {
          basicInfo: { isApproved: false, approvedAt: '', approvedBy: '' },
          ownership: { isApproved: false, approvedAt: '', approvedBy: '' },
          financial: { isApproved: false, approvedAt: '', approvedBy: '' }
        },
        isControlledGroup: business.is_controlled_group || false,
        isControlGroupLeader: business.is_control_group_leader || false,
        mailingStreetAddress: business.mailing_street_address || '',
        mailingCity: business.mailing_city || '',
        mailingState: business.mailing_state || '',
        mailingZip: business.mailing_zip || '',
        website: business.website || '',
        phoneNumber: business.phone_number || '',
        rolesByYear: {},
        years: {}
      }));
    } catch (error) {
      console.error('Error loading businesses by user:', error);
      return [];
    }
  }

  // Update business financial history
  static async updateFinancialHistory(businessId: string, financialHistory: any[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ financial_history: financialHistory })
        .eq('id', businessId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating financial history:', error);
      return false;
    }
  }

  // Get business years
  static async getBusinessYears(businessId: string): Promise<number[]> {
    try {
      const { data, error } = await supabase
        .from('years')
        .select('year')
        .eq('business_id', businessId)
        .order('year', { ascending: true });

      if (error) throw error;

      return data.map(row => row.year);
    } catch (error) {
      console.error('Error loading business years:', error);
      return [];
    }
  }

  // Add year to business
  static async addYearToBusiness(businessId: string, year: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('years')
        .insert({
          business_id: businessId,
          year: year
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding year to business:', error);
      return false;
    }
  }

  // Remove year from business
  static async removeYearFromBusiness(businessId: string, year: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('years')
        .delete()
        .eq('business_id', businessId)
        .eq('year', year);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing year from business:', error);
      return false;
    }
  }
} 