// =====================================================
// CLEAR ALL LOCALSTORAGE SCRIPT (AGGRESSIVE)
// =====================================================
// Run this in the browser console to clear ALL localStorage data

console.log('Clearing ALL localStorage data...');

// Get all keys
const allKeys = Object.keys(localStorage);
console.log('All localStorage keys:', allKeys);

// Keep only essential browser/system keys
const essentialKeys = [
  'loglevel',
  'calendly-store',
  'calendly-internal-store'
];

// Clear everything except essential keys
const keysToClear = allKeys.filter(key => !essentialKeys.includes(key));

console.log('Keys to be cleared:', keysToClear);
console.log('Essential keys to keep:', essentialKeys);

// Clear each key
keysToClear.forEach(key => {
  localStorage.removeItem(key);
  console.log(`Cleared: ${key}`);
});

// Verify remaining keys
const remainingKeys = Object.keys(localStorage);
console.log('Remaining localStorage keys:', remainingKeys);

console.log('localStorage cleanup complete!');
console.log('Please refresh the page to start fresh.'); 