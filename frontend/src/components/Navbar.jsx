import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, LogOut, Lightbulb, Menu, PlusCircle, LayoutDashboard, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "@/api/notifications";
import { logout } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, logoutUser, canManage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => getUnreadCount().then((r) => r.data.count),
    refetchInterval: 30000,
  });
  const unread = unreadData || 0;

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
    ...(canManage ? [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[hsl(221,83%,25%)] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-yellow-400 text-2xl">💡</span>
          <span className="hidden sm:inline">Boîte à Idées</span>
          <span className="text-blue-300 font-normal text-sm hidden md:inline">— ENSMG</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-blue-100 hover:text-white hover:bg-white/10 gap-1.5",
                  location.pathname === to && "bg-white/15 text-white"
                )}
              >
                <Icon size={15} />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="relative text-blue-100 hover:text-white hover:bg-white/10">
              <Bell size={18} />
              {unread > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 border-0">
                  {unread > 9 ? "9+" : unread}
                </Badge>
              )}
            </Button>
          </Link>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-blue-100 hover:text-white hover:bg-white/10 gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-blue-700 text-white text-xs font-bold">
                    {user?.first_name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm">{user?.first_name}</span>
                <ChevronDown size={14} className="hidden sm:inline opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer"><User size={14} className="mr-2" /> Profil</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut size={14} className="mr-2" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-blue-100 hover:text-white hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={20} />
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-2 space-y-1 bg-[hsl(221,83%,22%)]">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start text-blue-100 hover:text-white hover:bg-white/10 gap-2">
                <Icon size={15} /> {label}
              </Button>
            </Link>
          ))}
          <Separator className="bg-white/10 my-1" />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-red-300 hover:text-red-200 hover:bg-white/10 gap-2">
            <LogOut size={15} /> Déconnexion
          </Button>
        </div>
      )}
    </header>
  );
}
