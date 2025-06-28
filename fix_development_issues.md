# Comprehensive Development Issues Fix Guide

## Overview
This guide addresses all the development issues encountered in the R&D App Development project, including:
- Port conflicts (3000, 3001)
- TypeScript compilation errors
- ESLint warnings
- Supabase API issues
- React Hook dependency warnings

## 1. Port Conflicts Resolution

### Problem
Development server fails to start due to ports 3000 and 3001 being in use.

### Solution
```bash
# Kill all processes using ports 3000 and 3001
lsof -ti:3000,3001 | xargs kill -9

# Alternative: Kill all Node.js processes
pkill -f node

# Alternative: Kill all npm processes
pkill -f npm
```

### Prevention
Add to your development workflow:
```bash
# Before starting development
npm run kill-ports
npm run dev
```

Add this script to `package.json`:
```json
{
  "scripts": {
    "kill-ports": "lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true",
    "dev": "npm run kill-ports && concurrently \"npm run server\" \"npm run start\""
  }
}
```

## 2. Supabase Database Setup

### Step 1: Run the Debug Setup Script
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the `debug_supabase_setup.sql` script
4. Verify all steps complete successfully

### Step 2: Test the API
1. Update `test_business_roles_debug.js` with your Supabase credentials
2. Replace `testBusinessId` with an actual business ID from your database
3. Run the test script:
```bash
node test_business_roles_debug.js
```

### Step 3: Verify RLS Policies
The debug script creates temporary permissive policies for testing:
- `temp_read_business_roles`
- `temp_insert_business_roles`
- `temp_update_business_roles`
- `temp_delete_business_roles`

These allow all authenticated users access for debugging purposes.

## 3. TypeScript Errors Fix

### Problem: Missing Dependencies in useEffect
```typescript
// Error: React Hook useEffect has missing dependencies
useEffect(() => {
  // ... code
}, [selectedYear, selectedBusinessId, isActivitiesApproved, businessRoles, loadEmployees, loadContractors, loadAvailableYears]);
```

### Solution: Use useCallback for Functions
```typescript
const loadEmployees = useCallback(() => {
  const employeeData = ExpensesService.getEmployees(selectedBusinessId, selectedYear);
  setEmployees(employeeData);
}, [selectedBusinessId, selectedYear]);

const loadContractors = useCallback(() => {
  const contractorData = ExpensesService.getContractors(selectedBusinessId, selectedYear);
  setContractors(contractorData);
}, [selectedBusinessId, selectedYear]);

const loadAvailableYears = useCallback(() => {
  const years = ExpensesService.getAvailableYears(selectedBusinessId);
  setAvailableYears(years);
}, [selectedBusinessId]);

useEffect(() => {
  if (selectedBusinessId && selectedYear) {
    loadEmployees();
    loadContractors();
    loadAvailableYears();
  }
}, [selectedBusinessId, selectedYear, loadEmployees, loadContractors, loadAvailableYears]);
```

### Problem: Unused Variables
```typescript
// Error: 'qraData' is assigned a value but never used
const qraData = getQRAData();
```

### Solution: Remove or Use Variables
```typescript
// Option 1: Remove if not needed
// const qraData = getQRAData();

// Option 2: Use the variable
const qraData = getQRAData();
console.log('QRA Data:', qraData);

// Option 3: Disable ESLint for specific line
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const qraData = getQRAData();
```

## 4. React Hook Dependencies Fix

### Problem: Missing Dependencies
```typescript
// Error: React Hook useCallback has missing dependencies
const handleSave = useCallback(() => {
  saveData(data);
}, []); // Missing 'data' dependency
```

### Solution: Add Missing Dependencies
```typescript
const handleSave = useCallback(() => {
  saveData(data);
}, [data]); // Add missing dependency
```

### Problem: Unnecessary Dependencies
```typescript
// Error: React Hook useEffect has an unnecessary dependency
useEffect(() => {
  // ... code
}, [calculateRoleAppliedPercentages]); // Function reference changes every render
```

### Solution: Move Function Inside useEffect or Use useCallback
```typescript
// Option 1: Move function inside useEffect
useEffect(() => {
  const calculateRoleAppliedPercentages = () => {
    // ... calculation logic
  };
  
  const result = calculateRoleAppliedPercentages();
  setRoles(result);
}, [selectedYear, selectedBusinessId, businessRoles]);

// Option 2: Use useCallback for the function
const calculateRoleAppliedPercentages = useCallback(() => {
  // ... calculation logic
}, [selectedYear, selectedBusinessId, businessRoles]);

useEffect(() => {
  const result = calculateRoleAppliedPercentages();
  setRoles(result);
}, [calculateRoleAppliedPercentages]);
```

## 5. ESLint Warnings Fix

### Problem: Missing Imports
```typescript
// Error: Cannot find name 'selectedSubcomponents'
const activities = getContractorActivities(selectedContractorForConfig);
```

### Solution: Add Missing State Variables
```typescript
const [selectedSubcomponents, setSelectedSubcomponents] = useState([]);
const [supplyActivityPercentages, setSupplyActivityPercentages] = useState({});
const [handleCloseSupplyConfigureModal, setHandleCloseSupplyConfigureModal] = useState(null);
const [handleSaveSupplyConfiguration, setHandleSaveSupplyConfiguration] = useState(null);
```

### Problem: Unused Imports
```typescript
// Warning: 'Divider' is defined but never used
import { Divider } from '@mui/material';
```

### Solution: Remove Unused Imports
```typescript
// Remove unused imports
import { 
  Box, 
  Typography, 
  Button 
  // Remove: Divider
} from '@mui/material';
```

## 6. Development Server Memory Issues

### Problem: Server exits with SIGKILL/SIGTERM
The development server is running out of memory or being killed.

### Solution: Increase Memory and Optimize
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or add to package.json scripts
{
  "scripts": {
    "start": "NODE_OPTIONS='--max-old-space-size=4096' react-scripts start",
    "server": "NODE_OPTIONS='--max-old-space-size=4096' node server.js"
  }
}
```

### Alternative: Use PM2 for Process Management
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name "rnd-server"
pm2 start "npm run start" --name "rnd-client"

# Monitor processes
pm2 status
pm2 logs
```

## 7. Complete Development Workflow

### Step 1: Clean Environment
```bash
# Kill existing processes
npm run kill-ports

# Clear caches
npm run clean
rm -rf node_modules/.cache
rm -rf build
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development
```bash
npm run dev
```

### Step 4: Monitor for Issues
- Watch terminal for TypeScript errors
- Check browser console for runtime errors
- Monitor network tab for API failures

## 8. Production Readiness Checklist

Before deploying to production:

- [ ] Replace temporary RLS policies with proper security
- [ ] Remove all console.log statements
- [ ] Fix all TypeScript errors
- [ ] Resolve all ESLint warnings
- [ ] Test all API endpoints
- [ ] Verify data persistence
- [ ] Test authentication flow
- [ ] Optimize bundle size
- [ ] Set up proper environment variables

## 9. Troubleshooting Commands

### Check Port Usage
```bash
lsof -i :3000
lsof -i :3001
```

### Check Node Processes
```bash
ps aux | grep node
ps aux | grep npm
```

### Clear All Caches
```bash
npm cache clean --force
rm -rf node_modules
rm -rf build
npm install
```

### Reset Supabase
```bash
# Run the complete schema reset
# (This will delete all data - use with caution)
```

## 10. Emergency Recovery

If the development environment becomes completely unusable:

1. **Kill all processes**: `pkill -f node && pkill -f npm`
2. **Clear caches**: `npm cache clean --force && rm -rf node_modules`
3. **Reinstall**: `npm install`
4. **Reset database**: Run `debug_supabase_setup.sql`
5. **Restart**: `npm run dev`

This comprehensive approach should resolve all the development issues you've encountered. 