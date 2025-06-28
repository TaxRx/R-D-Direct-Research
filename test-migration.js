// Test script for debugging the Supabase migration
// Run this in the browser console

console.log('=== MIGRATION DEBUG SCRIPT ===');

// Create sample business data
const sampleBusiness = {
  id: 'test-business-1',
  businessName: 'Test Business Inc.',
  dbaName: 'Test Business',
  ein: '12-3456789',
  entityType: 'corporation',
  entityState: 'CA',
  startYear: 2020,
  owners: [
    {
      id: 'owner-1',
      name: 'John Doe',
      ownershipPercentage: 100,
      isResearchLeader: true
    }
  ],
  financialHistory: [
    { year: 2020, grossReceipts: 1000000, qre: 500000 },
    { year: 2021, grossReceipts: 1200000, qre: 600000 },
    { year: 2022, grossReceipts: 1400000, qre: 700000 },
    { year: 2023, grossReceipts: 1600000, qre: 800000 },
    { year: 2024, grossReceipts: 1800000, qre: 900000 }
  ],
  tabApprovals: {
    basicInfo: { isApproved: true, approvedAt: new Date().toISOString(), approvedBy: 'test' },
    ownership: { isApproved: true, approvedAt: new Date().toISOString(), approvedBy: 'test' },
    financial: { isApproved: true, approvedAt: new Date().toISOString(), approvedBy: 'test' }
  },
  rolesByYear: {},
  years: {}
};

const businessInfoData = {
  businesses: [sampleBusiness]
};

// Store in localStorage
localStorage.setItem('businessInfoData', JSON.stringify(businessInfoData));
console.log('Sample business data created and stored in localStorage');

// Test the migration service
console.log('Testing migration service...');
console.log('localStorage businessInfoData:', localStorage.getItem('businessInfoData'));

// Parse and validate
try {
  const parsed = JSON.parse(localStorage.getItem('businessInfoData'));
  console.log('Parsed data:', parsed);
  console.log('Businesses:', parsed.businesses);
  console.log('First business:', parsed.businesses[0]);
  console.log('Business name:', parsed.businesses[0]?.businessName);
} catch (e) {
  console.error('Error parsing data:', e);
}

console.log('=== END DEBUG SCRIPT ==='); 