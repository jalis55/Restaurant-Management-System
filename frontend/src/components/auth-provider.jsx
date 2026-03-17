import { useEffect, useState } from "react";

import { AuthContext } from "@/components/auth-context";
import { getCurrentUser, login as loginRequest, logout as logoutRequest, refreshSession } from "@/lib/api";

async function loadUserWithRefresh() {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }

    await refreshSession();
    return getCurrentUser();
  }
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      try {
        const nextUser = await loadUserWithRefresh();
        if (active) {
          setUser(nextUser);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      active = false;
    };
  }, []);

  async function login(credentials) {
    await loginRequest(credentials);
    const nextUser = await getCurrentUser();
    setUser(nextUser);
    return nextUser;
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider };
