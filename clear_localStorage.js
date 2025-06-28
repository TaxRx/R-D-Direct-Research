// =====================================================
// CLEAR LOCALSTORAGE SCRIPT
// =====================================================
// Run this in the browser console to clear all localStorage data

console.log('Clearing localStorage data...');

// Get all keys
const allKeys = Object.keys(localStorage);
console.log('All localStorage keys:', allKeys);

// Clear all QRA-related keys
const qraKeys = allKeys.filter(key => 
  key.startsWith('qra_') || 
  key.includes('activity') || 
  key.includes('QRA') ||
  key.includes('businessInfoData') ||
  key.includes('activitiesTabApproval')
);

console.log('QRA-related keys to be cleared:', qraKeys);

// Clear each QRA-related key
qraKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log(`Cleared: ${key}`);
});

// Clear business info data specifically
localStorage.removeItem('businessInfoData');
console.log('Cleared: businessInfoData');

// Verify remaining keys
const remainingKeys = Object.keys(localStorage);
console.log('Remaining localStorage keys:', remainingKeys);

console.log('localStorage cleanup complete!'); 