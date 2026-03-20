import { useMemo } from 'react';
import { useAuthApi } from './api';

export function useUserService() {
  const authApi = useAuthApi();

  return useMemo(() => ({
    getProfile: () => authApi.get('/api/auth/me'),
    updateProfile: (payload) => authApi.put('/api/auth/profile', payload),
  }), [authApi]);
}
