'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

/**
 * Custom hook for making authenticated API requests to the NestJS backend
 * 
 * Usage:
 * const { fetchApi } = useApi();
 * const data = await fetchApi('/api/users/current');
 * 
 * For POST requests:
 * const result = await fetchApi('/api/appointments/book', {
 *   method: 'POST',
 *   body: JSON.stringify({ doctorId: '123', startTime: '2024-01-01T10:00:00Z' })
 * });
 */
export function useApi() {
  const { getToken } = useAuth();

  const fetchApi = useCallback(
    async (endpoint, options = {}) => {
      const token = await getToken();

      const config = {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        config
      );

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch {
          error = { message: 'An error occurred' };
        }
        throw new Error(error.message || 'API request failed');
      }

      return response.json();
    },
    [getToken]
  );

  return { fetchApi };
}
