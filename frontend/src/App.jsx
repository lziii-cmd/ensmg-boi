import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import SetPasswordPage from "./pages/SetPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import IdeaDetailPage from "./pages/IdeaDetailPage";
import SubmitIdeaPage from "./pages/SubmitIdeaPage";
import MyIdeasPage from "./pages/MyIdeasPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ManageIdeasPage from "./pages/dashboard/ManageIdeasPage";
import MembersPage from "./pages/dashboard/MembersPage";
import ModerationPage from "./pages/dashboard/ModerationPage";
import AuditPage from "./pages/dashboard/AuditPage";
import Layout from "./components/Layout";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">💡</div>
        <p className="text-muted-foreground text-sm">Chargement...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Responsable + superuser — gestion des idées */
function ManagerRoute({ children }) {
  const { user, loading, canManageIdeas } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!canManageIdeas) return <Navigate to="/" replace />;
  return children;
}

/** Admin + superuser — gestion des utilisateurs */
function AdminRoute({ children }) {
  const { user, loading, canManageUsers } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!canManageUsers) return <Navigate to="/" replace />;
  return children;
}

/** Admin + superuser — audit */
function AuditRoute({ children }) {
  const { user, loading, canAudit } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAudit) return <Navigate to="/" replace />;
  return children;
}

/** Membres réguliers — soumettre/mes idées (admin pur redirigé) */
function MemberRoute({ children }) {
  const { user, loading, isRegularMember } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isRegularMember) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Dashboard général — quiconque y a accès (manager ou admin) */
function DashboardRoute({ children }) {
  const { user, loading, canManage } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!canManage) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/set-password/:token" element={<SetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Private */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<HomePage />} />
            <Route path="ideas/:id" element={<IdeaDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* Membres réguliers seulement (admin pur exclu) */}
            <Route path="submit" element={<MemberRoute><SubmitIdeaPage /></MemberRoute>} />
            <Route path="my-ideas" element={<MemberRoute><MyIdeasPage /></MemberRoute>} />

            {/* Dashboard — admin OU responsable OU superuser */}
            <Route path="dashboard" element={<DashboardRoute><DashboardPage /></DashboardRoute>} />

            {/* Gestion des idées — responsable + superuser */}
            <Route path="dashboard/ideas" element={<ManagerRoute><ManageIdeasPage /></ManagerRoute>} />
            <Route path="dashboard/moderation" element={<ManagerRoute><ModerationPage /></ManagerRoute>} />

            {/* Gestion des membres — admin + superuser */}
            <Route path="dashboard/members" element={<AdminRoute><MembersPage /></AdminRoute>} />

            {/* Audit — admin + superuser */}
            <Route path="dashboard/audit" element={<AuditRoute><AuditPage /></AuditRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
