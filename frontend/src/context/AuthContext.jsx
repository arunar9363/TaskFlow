import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_INIT':
      return { ...state, isLoading: false };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: try to restore session via refresh token
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        dispatch({ type: 'AUTH_INIT' });
        return;
      }
      try {
        const { data } = await authService.getMe();
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: data.data.user, accessToken: storedToken },
        });
      } catch {
        localStorage.removeItem('accessToken');
        dispatch({ type: 'AUTH_INIT' });
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authService.login(credentials);
    const { user, accessToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken } });
    return user;
  }, []);

  const register = useCallback(async (userData) => {
    const { data } = await authService.register(userData);
    const { user, accessToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken } });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const isAdmin = state.user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
