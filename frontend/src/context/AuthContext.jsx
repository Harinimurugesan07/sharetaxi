import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setTokens, clearTokens } from "../api/client";
import * as authApi from "../api/auth";
import { resetSocket } from "../lib/socket";

const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const hasToken = !!localStorage.getItem("st_access_token");
    if (!hasToken) {
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.fetchMe();
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const applySession = async (payload) => {
    const access_token = payload?.access_token;
    const refresh_token = payload?.refresh_token;

    setTokens({ access_token, refresh_token });

    const fallbackUser = payload?.user || payload;

    try {
      const me = await authApi.fetchMe();
      setUser(me);
      return me;
    } catch {
      setUser(fallbackUser || null);
      return fallbackUser || null;
    }
  };

  const loginPassenger = async (identifier, password) => {
    const res = await authApi.loginPassenger(identifier, password);
    const user = await applySession(res);
    return user;
  };

  const loginDriver = async (identifier, password) => {
    const res = await authApi.loginDriver(identifier, password);
    const user = await applySession(res);
    return user;
  };

  const loginAdmin = async (identifier, password) => {
    const res = await authApi.loginAdmin(identifier, password);
    const user = await applySession(res);
    return user;
  };

  const registerPassenger = async (data) => {
    const res = await authApi.registerPassenger(data);
    const user = await applySession(res);
    return user;
  };

  const registerDriver = async (data) => {
    const res = await authApi.registerDriver(data);
    const user = await applySession(res);
    return user;
  };

  const registerOperator = async (data) => {
    const res = await authApi.registerOperator(data);
    const user = await applySession(res);
    return user;
  };

  const loginOperator = async (identifier, password) => {
    const res = await authApi.loginOperator(identifier, password);
    const user = await applySession(res);
    return user;
  };

  const logout = () => {
    clearTokens();
    resetSocket();
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await authApi.fetchMe();
    setUser(me);
    return me;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginPassenger,
        loginDriver,
        loginAdmin,
        loginOperator,
        registerPassenger,
        registerDriver,
        registerOperator,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
