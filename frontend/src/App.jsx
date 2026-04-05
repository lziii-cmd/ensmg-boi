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

const Spinner = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="text-center">
      <div className="text-4xl mb-3 animate-pulse">💡</div>
      <p className="text-muted-foreground text-sm">Chargement...</p>
    </div>
  </div>
);

function ProtectedRoute({ children, check, redirectTo = "/" }) {
  const auth = useAuth();
  if (auth.loading) return <Spinner />;
  if (!auth.user) return <Navigate to="/login" replace />;
  if (check && !check(auth)) return <Navigate to={redirectTo} replace />;
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
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<HomePage />} />
            <Route path="ideas/:id" element={<IdeaDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* Membres réguliers seulement (admin pur exclu) */}
            <Route path="submit" element={
              <ProtectedRoute check={(a) => a.isRegularMember} redirectTo="/dashboard">
                <SubmitIdeaPage />
              </ProtectedRoute>
            } />
            <Route path="my-ideas" element={
              <ProtectedRoute check={(a) => a.isRegularMember} redirectTo="/dashboard">
                <MyIdeasPage />
              </ProtectedRoute>
            } />

            {/* Dashboard — admin OU responsable OU superuser */}
            <Route path="dashboard" element={
              <ProtectedRoute check={(a) => a.canManage}>
                <DashboardPage />
              </ProtectedRoute>
            } />

            {/* Gestion des idées — responsable + superuser */}
            <Route path="dashboard/ideas" element={
              <ProtectedRoute check={(a) => a.canManageIdeas}>
                <ManageIdeasPage />
              </ProtectedRoute>
            } />
            <Route path="dashboard/moderation" element={
              <ProtectedRoute check={(a) => a.canManageIdeas}>
                <ModerationPage />
              </ProtectedRoute>
            } />

            {/* Gestion des membres — admin + superuser */}
            <Route path="dashboard/members" element={
              <ProtectedRoute check={(a) => a.canManageUsers}>
                <MembersPage />
              </ProtectedRoute>
            } />

            {/* Audit — admin + superuser */}
            <Route path="dashboard/audit" element={
              <ProtectedRoute check={(a) => a.canAudit}>
                <AuditPage />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
