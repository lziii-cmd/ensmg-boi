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
import Layout from "./components/Layout";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">💡</div>
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function ManagerRoute({ children }) {
  const { user, loading, canManage } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!canManage) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
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
            <Route path="submit" element={<SubmitIdeaPage />} />
            <Route path="my-ideas" element={<MyIdeasPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* Manager routes */}
            <Route path="dashboard" element={<ManagerRoute><DashboardPage /></ManagerRoute>} />
            <Route path="dashboard/ideas" element={<ManagerRoute><ManageIdeasPage /></ManagerRoute>} />
            <Route path="dashboard/moderation" element={<ManagerRoute><ModerationPage /></ManagerRoute>} />

            {/* Admin only */}
            <Route path="dashboard/members" element={<AdminRoute><MembersPage /></AdminRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
