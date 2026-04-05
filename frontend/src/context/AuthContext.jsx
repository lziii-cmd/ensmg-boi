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
  const isAdmin = user?.role === "admin" || isSuperuser;       // gestion utilisateurs + audit
  const isResponsable = user?.role === "responsable" || isSuperuser; // gestion idées
  const isPureAdmin = user?.role === "admin";                  // admin strict (sans superuser)

  // Accès aux fonctionnalités
  const canManageUsers = isAdmin;                    // admin + superuser
  const canManageIdeas = isResponsable;              // responsable + superuser (PAS admin pur)
  const canAudit = isAdmin;                          // admin + superuser
  const canManage = canManageUsers || canManageIdeas; // accès au dashboard
  const isRegularMember = user?.role !== "admin";    // peut soumettre/voter/commenter

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
