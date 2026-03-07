# Frontend Migration Guide

This guide explains how to migrate from Next.js Server Actions to the NestJS backend API.

## Overview

All server actions have been migrated to RESTful API endpoints in the NestJS backend. The backend runs on `http://localhost:4000` by default with `/api` prefix.

## Authentication

### Before (Server Actions)
```javascript
import { auth } from "@clerk/nextjs/server";

export async function someAction() {
  const { userId } = await auth();
  // ...
}
```

### After (API Calls)
You need to pass the Clerk session token in API requests:

```javascript
'use client';

import { useAuth } from '@clerk/nextjs';

export function useApi() {
  const { getToken } = useAuth();

  const fetchApi = async (endpoint, options = {}) => {
    const token = await getToken();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  };

  return { fetchApi };
}
```

## API Mapping

### Admin Actions

| Old Server Action | New API Endpoint | Method |
|------------------|------------------|---------|
| `getPendingDoctors()` | `/api/admin/doctors/pending` | GET |
| `getVerifiedDoctors()` | `/api/admin/doctors/verified` | GET |
| `updateDoctorStatus(formData)` | `/api/admin/doctors/update-status` | POST |
| `updateDoctorActiveStatus(formData)` | `/api/admin/doctors/update-active-status` | POST |
| `getPendingPayouts()` | `/api/admin/payouts/pending` | GET |
| `approvePayout(formData)` | `/api/admin/payouts/approve` | POST |

#### Example Migration

**Before:**
```javascript
import { getPendingDoctors } from '@/actions/admin';

const { doctors } = await getPendingDoctors();
```

**After:**
```javascript
const { fetchApi } = useApi();
const { doctors } = await fetchApi('/api/admin/doctors/pending');
```

### Appointment Actions

| Old Server Action | New API Endpoint | Method |
|------------------|------------------|---------|
| `bookAppointment(formData)` | `/api/appointments/book` | POST |
| `generateVideoToken(formData)` | `/api/appointments/video-token` | POST |
| `cancelAppointment(formData)` | `/api/appointments/cancel` | POST |

#### Example Migration

**Before:**
```javascript
import { bookAppointment } from '@/actions/appointments';

const formData = new FormData();
formData.append('doctorId', doctorId);
formData.append('startTime', startTime);
formData.append('endTime', endTime);
formData.append('description', description);

const result = await bookAppointment(formData);
```

**After:**
```javascript
const { fetchApi } = useApi();

const result = await fetchApi('/api/appointments/book', {
  method: 'POST',
  body: JSON.stringify({
    doctorId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    description,
  }),
});
```

### Doctor Actions

| Old Server Action | New API Endpoint | Method |
|------------------|------------------|---------|
| `getDoctorsBySpecialty(specialty)` | `/api/doctors/specialty/:specialty` | GET |
| `setAvailabilitySlots(formData)` | `/api/doctors/availability` | POST |
| `getDoctorAvailability()` | `/api/doctors/availability` | GET |
| `getDoctorAppointments()` | `/api/doctors/appointments` | GET |
| `getDoctorEarnings()` | `/api/doctors/earnings` | GET |

### User/Onboarding Actions

| Old Server Action | New API Endpoint | Method |
|------------------|------------------|---------|
| `getCurrentUser()` | `/api/users/current` | GET |
| `setUserRole(formData)` | `/api/users/role` | POST |

#### Example Migration

**Before:**
```javascript
import { setUserRole } from '@/actions/onboarding';

const formData = new FormData();
formData.append('role', 'DOCTOR');
formData.append('specialty', specialty);
formData.append('experience', experience);
formData.append('credentialUrl', credentialUrl);
formData.append('description', description);

const result = await setUserRole(formData);
```

**After:**
```javascript
const { fetchApi } = useApi();

const result = await fetchApi('/api/users/role', {
  method: 'POST',
  body: JSON.stringify({
    role: 'DOCTOR',
    specialty,
    experience: parseInt(experience),
    credentialUrl,
    description,
  }),
});
```

### Patient Actions

| Old Server Action | New API Endpoint | Method |
|------------------|------------------|---------|
| `getPatientAppointments()` | `/api/appointments/patient` | GET |

### Payout Actions

| Old Server Action | New API Endpoint | Method |
|------------------|------------------|---------|
| `requestPayout(formData)` | `/api/payouts/request` | POST |
| `getDoctorPayouts()` | `/api/payouts` | GET |

## Environment Setup

### Add to frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Create API Utility Hook

Create `hooks/use-api.js`:

```javascript
'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

export function useApi() {
  const { getToken } = useAuth();

  const fetchApi = useCallback(async (endpoint, options = {}) => {
    const token = await getToken();
    
    const config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
      config
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }, [getToken]);

  return { fetchApi };
}
```

## Data Fetching Patterns

### In Server Components

Use the API directly with fetch:

```javascript
import { auth } from '@clerk/nextjs/server';

export default async function Page() {
  const { getToken } = await auth();
  const token = await getToken();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/doctors/specialty/Cardiology`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const { doctors } = await response.json();

  return <div>{/* render doctors */}</div>;
}
```

### In Client Components

Use the `useApi` hook:

```javascript
'use client';

import { useApi } from '@/hooks/use-api';
import { useEffect, useState } from 'react';

export default function MyComponent() {
  const { fetchApi } = useApi();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchApi('/api/doctors/earnings')
      .then(setData)
      .catch(console.error);
  }, [fetchApi]);

  return <div>{/* render data */}</div>;
}
```

### With Mutations (Forms)

```javascript
'use client';

import { useApi } from '@/hooks/use-api';
import { useState } from 'react';

export default function BookingForm() {
  const { fetchApi } = useApi();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await fetchApi('/api/appointments/book', {
        method: 'POST',
        body: JSON.stringify({
          doctorId,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          description,
        }),
      });

      console.log('Booking successful:', result);
      // Handle success
    } catch (error) {
      console.error('Booking failed:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

## Important Notes

1. **No more FormData**: The API uses JSON body instead of FormData. Convert your FormData submissions to JSON objects.

2. **Date Serialization**: When sending dates, convert them to ISO strings:
   ```javascript
   startTime: new Date(startTime).toISOString()
   ```

3. **revalidatePath is frontend concern**: Since we're using API calls, cache revalidation should be handled on the frontend (e.g., with React Query, SWR, or manual state updates).

4. **Error Handling**: The API returns structured error responses. Handle them appropriately:
   ```javascript
   try {
     await fetchApi('/api/endpoint');
   } catch (error) {
     console.error(error.message); // User-friendly error message
   }
   ```

5. **Public Endpoints**: Some endpoints like doctor listing by specialty don't require authentication. You can call them without the Authorization header.

## Testing the API

You can test endpoints using:

1. **Browser/Postman**: 
   - Get your Clerk token from the browser console
   - Add `Authorization: Bearer <token>` header

2. **Health Check**:
   ```bash
   curl http://localhost:4000/api/health
   ```

3. **With authentication**:
   ```bash
   curl -H "Authorization: Bearer <your-clerk-token>" \
        http://localhost:4000/api/users/current
   ```

## Migration Checklist

- [ ] Set up backend environment variables
- [ ] Run backend database migrations
- [ ] Start backend server
- [ ] Add `NEXT_PUBLIC_API_URL` to frontend
- [ ] Create `use-api` hook
- [ ] Update all server action imports to use `useApi`
- [ ] Convert FormData to JSON objects
- [ ] Convert dates to ISO strings
- [ ] Update error handling
- [ ] Remove unused server action files
- [ ] Test all functionality

## Common Issues

### CORS Errors
Make sure `FRONTEND_URL` is set correctly in backend `.env`

### 401 Unauthorized
Verify Clerk token is being passed correctly and `CLERK_SECRET_KEY` is set in backend

### 404 Not Found
Check that backend is running and endpoint paths match the documentation

### Date Parsing Errors
Ensure dates are sent as ISO strings and the timezone is handled correctly
