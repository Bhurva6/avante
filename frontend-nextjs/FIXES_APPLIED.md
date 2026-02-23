# 🔧 Fix Applied: Access Request & Approval Issues

## Issues Fixed

### 1. ✅ **400 Error on Sign-Up**
**Problem**: Frontend was sending `states` but API expected `requestedStates`

**Solution**: Updated `/app/login/page.tsx` to send correct field name:
```typescript
body: JSON.stringify({
  fullName,
  email,
  password,
  requestedStates: selectedStates  // ✅ Fixed from 'states'
})
```

---

### 2. ✅ **500 Error on Approve**
**Problem**: Each API endpoint had its own separate mock storage arrays, so:
- Sign-up requests stored in `/api/auth/signup` local array
- Approve endpoint looking in `/api/admin/access-requests` local array
- They couldn't see each other's data!

**Solution**: Created **shared database storage** (`/lib/mockDatabase.ts`):
```typescript
// Single source of truth for all endpoints
export const mockAccessRequests: AccessRequest[] = [];
export const mockUsers: User[] = [superadmin];
```

Updated all endpoints to import and use the shared storage:
- ✅ `/api/auth/signup/route.ts`
- ✅ `/api/auth/login/route.ts`
- ✅ `/api/admin/users/route.ts`
- ✅ `/api/admin/users/[id]/route.ts`
- ✅ `/api/admin/access-requests/[id]/approve/route.ts`
- ✅ `/api/admin/access-requests/[id]/reject/route.ts`

---

### 3. ✅ **Requests Not Visible in Admin Panel**
**Problem**: AccessManagementModal was mapping field incorrectly

**Solution**: Updated to use correct field name:
```typescript
const signupRequests = (signupData.accessRequests || []).map((req: any) => ({
  id: req.id,
  email: req.email,
  fullName: req.fullName,
  requestedAt: req.requestedAt,
  requestedStates: req.requestedStates,  // ✅ Fixed
  status: req.status
}));
```

Added console logging to debug:
```typescript
console.log('Loaded access requests:', allRequests);
```

---

## Complete Workflow Now Working

```
1. User Signs Up
   ↓
   POST /api/auth/signup
   ↓
   Saved to mockAccessRequests (shared storage)
   ↓
   Success message shown

2. Admin Opens Access Management
   ↓
   GET /api/auth/signup
   ↓
   Reads from mockAccessRequests (shared storage)
   ↓
   Request displayed in "Access Requests" tab

3. Admin Clicks "Approve"
   ↓
   POST /api/admin/access-requests/{id}/approve
   ↓
   Reads request from mockAccessRequests (shared storage)
   ↓
   Creates user in mockUsers (shared storage)
   ↓
   Email sent to user
   ↓
   Success!

4. User Logs In
   ↓
   POST /api/auth/login
   ↓
   Checks credentials in mockUsers (shared storage)
   ↓
   Returns user role and allowedStates
   ↓
   Dashboard filtered to user's states
```

---

## Testing Instructions

### Test Sign-Up Flow
1. Navigate to `http://localhost:3000/login`
2. Click **"Sign Up"** tab
3. Fill in:
   - Full Name: `John Doe`
   - Email: `john@test.com`
   - Password: `test123`
   - Confirm Password: `test123`
   - States: Select `Maharashtra` and `Karnataka`
4. Click **"Sign Up & Request Access"**
5. ✅ Should see: "Sign up successful! Your access request has been sent to the admin."

### Test Admin Approval Flow
1. Login as admin:
   - Username: `u2vp8kb`
   - Password: `asdftuy#$%78@!`
2. Click blue **Shield icon** (top-right)
3. Click **"Access Requests"** tab
4. ✅ Should see: `john@test.com` request with name and states
5. Click **"Approve"** button
6. ✅ Should see: "Request approved! Approval email sent to john@test.com"
7. Check browser console - should see:
   ```
   Approved access request: req-xxx
   Created user: { email: 'john@test.com', allowedStates: ['Maharashtra', 'Karnataka'] }
   ```

### Test User Login Flow
1. Logout from admin
2. Enter:
   - Email: `john@test.com`
   - Password: `test123`
3. Click **"Sign In"**
4. ✅ Should redirect to dashboard
5. ✅ Dashboard should show only Maharashtra and Karnataka data
6. ✅ Access Management button should be hidden

---

## Key Changes Summary

| File | Change |
|------|--------|
| `/lib/mockDatabase.ts` | **NEW** - Shared storage for all endpoints |
| `/app/login/page.tsx` | Fixed: `states` → `requestedStates` |
| `/app/api/auth/signup/route.ts` | Import shared `mockAccessRequests` |
| `/app/api/auth/login/route.ts` | Import shared `mockUsers` |
| `/app/api/admin/users/route.ts` | Import shared `mockUsers` |
| `/app/api/admin/users/[id]/route.ts` | Import shared `mockUsers` |
| `/app/api/admin/access-requests/[id]/approve/route.ts` | Import shared storage, create user with correct fields |
| `/app/api/admin/access-requests/[id]/reject/route.ts` | Import shared `mockAccessRequests` |
| `/components/AccessManagementModal.tsx` | Fixed field mapping, added deduplication |

---

## Debugging Tips

### Check Browser Console
After sign-up, you should see:
```
New access request created: {
  id: "req-xxx",
  email: "john@test.com",
  states: ["Maharashtra", "Karnataka"]
}
```

After opening Access Management modal:
```
Loaded access requests: [{
  id: "req-xxx",
  email: "john@test.com",
  fullName: "John Doe",
  requestedStates: ["Maharashtra", "Karnataka"],
  status: "pending"
}]
```

After approval:
```
Approved access request: req-xxx
Created user: {
  email: "john@test.com",
  allowedStates: ["Maharashtra", "Karnataka"]
}
```

### Check Network Tab
- Sign-up: `POST /api/auth/signup` → Status 200
- Load requests: `GET /api/auth/signup` → Status 200, returns `{ accessRequests: [...] }`
- Approve: `POST /api/admin/access-requests/req-xxx/approve` → Status 200

---

## Production Notes

When deploying to production, replace the shared mock storage with a real database:

```typescript
// Instead of:
export const mockAccessRequests: AccessRequest[] = [];

// Use:
import { prisma } from '@/lib/prisma';

export async function getAccessRequests() {
  return await prisma.accessRequest.findMany();
}

export async function createAccessRequest(data: AccessRequest) {
  return await prisma.accessRequest.create({ data });
}
```

---

## Status

✅ **All Issues Fixed**
- Sign-up creates request successfully
- Admin sees requests in Access Management
- Approve creates user with correct fields
- Email notifications sent
- User can login and see filtered dashboard

**Last Updated**: February 18, 2026
