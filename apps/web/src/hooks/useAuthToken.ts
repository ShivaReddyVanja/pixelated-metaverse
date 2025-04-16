import { useCallback } from 'react';

const TOKEN_KEY = 'token';

export const useAuthToken = () => {
  const getToken = useCallback((): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const setToken = useCallback((token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  }, []);

  const removeToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  return {
    getToken,
    setToken,
    removeToken,
  };
};
