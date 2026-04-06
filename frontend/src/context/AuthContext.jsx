import { createContext, useContext, useState, useEffect, useRef } from "react";
import { getMe } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = localStorage.getItem("access_token");
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (tokens, userData) => {
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  // Rôles
  const isSuperuser = user?.role === "superuser";
  const isAdmin = user?.role === "admin" || isSuperuser;
  const isResponsable = user?.role === "responsable" || isSuperuser;
  const isDirecteur = user?.role === "directeur";
  const isPureAdmin = user?.role === "admin";

  const canManageUsers = isAdmin;
  const canManageIdeas = isResponsable;
  const canAudit = isAdmin;
  const canManage = canManageUsers || canManageIdeas;
  const isRegularMember = user?.role !== "admin";

  return (
    <AuthContext.Provider value={{
      user, loading, loginUser, logoutUser,
      isSuperuser, isAdmin, isResponsable, isPureAdmin,
      canManageUsers, canManageIdeas, canAudit,
      canManage, isRegularMember,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
