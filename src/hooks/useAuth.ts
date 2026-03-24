import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../router/routes';

export function useAuth() {
  const { user, token, isAuthenticated, login, logout, updateUser, hydrateFromStorage } = useAuthStore();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    login(result.user, result.token);
    return result.user;
  };

  const handleLogout = () => {
    authService.logout();
    logout();
    navigate(ROUTES.HOME);
  };

  const handleRegister = async (data: Parameters<typeof authService.register>[0]) => {
    const result = await authService.register(data);
    login(result.user, result.token);
    return result.user;
  };

  const handleUpdateProfile = async (data: Parameters<typeof authService.updateProfile>[0]) => {
    const updated = await authService.updateProfile(data);
    updateUser(updated);
    return updated;
  };

  return {
    user,
    token,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isHost: user?.role === 'host' || user?.role === 'admin',
    isGuest: user?.role === 'guest',
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    updateProfile: handleUpdateProfile,
  };
}
