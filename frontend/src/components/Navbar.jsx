import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell, LogOut, Lightbulb, Menu, PlusCircle, LayoutDashboard,
  User, ChevronDown, RefreshCw, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const SWIPE_THRESHOLD   = 60;   // px minimum pour déclencher
const SWIPE_EDGE_LIMIT  = 40;   // zone bord gauche pour ouvrir (px)

export default function Navbar() {
  const { user, logoutUser, canManage, isRegularMember } = useAuth();
  const navigate       = useNavigate();
  const location       = useLocation();
  const queryClient    = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => getUnreadCount().then((r) => r.data.count),
    refetchInterval: 30000,
  });
  const unread = unreadData || 0;

  // ── Swipe gesture ──────────────────────────────────────────────
  useEffect(() => {
    const onTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e) => {
      const endX  = e.changedTouches[0].clientX;
      const endY  = e.changedTouches[0].clientY;
      const diffX = endX - touchStartX.current;
      const diffY = endY - touchStartY.current;

      // Ignorer les swipes trop verticaux
      if (Math.abs(diffY) > Math.abs(diffX)) return;

      if (diffX > SWIPE_THRESHOLD && touchStartX.current < SWIPE_EDGE_LIMIT) {
        // Swipe droite depuis le bord gauche → ouvrir
        setDrawerOpen(true);
      } else if (diffX < -SWIPE_THRESHOLD) {
        // Swipe gauche → fermer
        setDrawerOpen(false);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend",   onTouchEnd,   { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend",   onTouchEnd);
    };
  }, []);

  // Fermer le drawer au changement de route
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // ── Rafraîchir ────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    try { await logout(refresh); } catch {}
    logoutUser();
    navigate("/login");
  };

  const navLinks = [
    { to: "/",         label: "Idées",      icon: Lightbulb },
    ...(isRegularMember ? [
      { to: "/submit",    label: "Soumettre",  icon: PlusCircle },
      { to: "/my-ideas",  label: "Mes idées",  icon: User },
    ] : []),
    ...(canManage ? [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
  ];

  return (
    <>
      {/* ── Barre de navigation ───────────────────────────────── */}
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
                    location.pathname === to && "bg-white/15 text-white",
                    to === "/submit" && "text-yellow-300 hover:text-yellow-200 hover:bg-yellow-400/15 font-semibold"
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1">
            {/* Rafraîchir */}
            <Button
              variant="ghost"
              size="icon"
              className="text-blue-100 hover:text-white hover:bg-white/10"
              onClick={handleRefresh}
              title="Rafraîchir"
            >
              <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
            </Button>

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

            {/* User menu desktop */}
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

            {/* Bouton menu mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-blue-100 hover:text-white hover:bg-white/10"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Drawer mobile ─────────────────────────────────────── */}

      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Panneau latéral */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-72 z-50 flex flex-col md:hidden",
          "bg-[hsl(221,83%,22%)] text-white shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header du drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-xl">💡</span>
            <span className="font-bold">Boîte à Idées</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-100 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Infos utilisateur */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-700 text-white text-sm font-bold">
                {user?.first_name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-blue-300 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-blue-100 hover:text-white hover:bg-white/10",
                  location.pathname === to && "bg-white/15 text-white",
                  to === "/submit" && "text-yellow-300 hover:text-yellow-200 font-semibold"
                )}
              >
                <Icon size={18} />
                {label}
              </Button>
            </Link>
          ))}

          <Separator className="bg-white/10 my-2" />

          <Link to="/profile">
            <Button variant="ghost" className="w-full justify-start gap-3 text-blue-100 hover:text-white hover:bg-white/10">
              <User size={18} /> Profil
              {unread > 0 && (
                <Badge className="ml-auto bg-red-500 border-0 text-[10px] h-5 min-w-[20px]">
                  {unread > 9 ? "9+" : unread}
                </Badge>
              )}
            </Button>
          </Link>
        </nav>

        {/* Footer */}
        <div className="px-3 pb-6 pt-2 border-t border-white/10 space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-blue-100 hover:text-white hover:bg-white/10"
            onClick={handleRefresh}
          >
            <RefreshCw size={18} className={cn(refreshing && "animate-spin")} />
            Rafraîchir
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-300 hover:text-red-200 hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut size={18} /> Déconnexion
          </Button>
        </div>
      </div>
    </>
  );
}
