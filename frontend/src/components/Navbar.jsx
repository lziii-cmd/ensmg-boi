import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, LogOut, User, LayoutDashboard, Lightbulb, Menu, X, PlusCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "../api/notifications";
import { logout } from "../api/auth";

export default function Navbar() {
  const { user, logoutUser, canManage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unread } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => getUnreadCount().then((r) => r.data.count),
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    try { await logout(refresh); } catch {}
    logoutUser();
    navigate("/login");
  };

  const navLinks = [
    { to: "/", label: "Idées", icon: Lightbulb },
    { to: "/submit", label: "Soumettre", icon: PlusCircle },
    { to: "/my-ideas", label: "Mes idées", icon: User },
  ];

  if (canManage) {
    navLinks.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
  }

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-yellow-400">💡</span>
            <span className="hidden sm:block">Boîte à Idées</span>
            <span className="text-blue-300 text-sm font-normal hidden sm:block">ENSMG</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? "bg-blue-700 text-white"
                    : "text-blue-100 hover:bg-blue-800"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link to="/profile" className="relative p-2 hover:bg-blue-800 rounded-lg">
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-blue-700">
              <span className="text-sm text-blue-200">{user?.first_name}</span>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-blue-800 rounded-lg text-blue-200 hover:text-white transition-colors"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
            <button
              className="md:hidden p-2 hover:bg-blue-800 rounded-lg"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-blue-800 px-4 py-3 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-800"
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-800"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
}
