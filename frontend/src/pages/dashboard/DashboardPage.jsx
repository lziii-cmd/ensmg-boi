import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/api/ideas";
import { Link } from "react-router-dom";
import { AlertTriangle, Lightbulb, Users, BarChart2, TrendingUp, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";

const STATUS_LABELS = {
  en_attente: "En attente",
  publiee: "Publiées",
  en_etude: "En étude",
  acceptee: "Acceptées",
  rejetee: "Rejetées",
  mise_en_oeuvre: "Mises en œuvre",
  archivee: "Archivées",
};

export default function DashboardPage() {
  const { canManageIdeas, canManageUsers, canAudit, isPureAdmin } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats().then((r) => r.data),
    refetchInterval: 60000,
    // L'admin pur n'a pas accès aux stats des idées
    enabled: canManageIdeas,
  });

  // Cartes de navigation affichées selon le rôle
  const navCards = [
    // Responsable + superuser
    ...(canManageIdeas ? [
      {
        to: "/dashboard/ideas",
        icon: Lightbulb,
        label: "Gérer les idées",
        iconClass: "text-primary",
        bg: "bg-primary/5",
      },
      {
        to: "/dashboard/moderation",
        icon: AlertTriangle,
        label: "Modération",
        iconClass: "text-orange-500",
        bg: "bg-orange-50",
      },
    ] : []),
    // Admin + superuser
    ...(canManageUsers ? [
      {
        to: "/dashboard/members",
        icon: Users,
        label: "Membres",
        iconClass: "text-green-600",
        bg: "bg-green-50",
      },
    ] : []),
    // Admin + superuser
    ...(canAudit ? [
      {
        to: "/dashboard/audit",
        icon: ShieldCheck,
        label: "Audit",
        iconClass: "text-purple-600",
        bg: "bg-purple-50",
      },
    ] : []),
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          {isPureAdmin
            ? "Gestion des utilisateurs et traçabilité"
            : "Vue d'ensemble de la plateforme"}
        </p>
      </div>

      {/* Quick nav */}
      <div className={`grid gap-3 mb-6 ${navCards.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        {navCards.map(({ to, icon: Icon, label, iconClass, bg }) => (
          <Link key={to} to={to}>
            <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
              <CardContent className="p-5 text-center">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg} mb-2`}>
                  <Icon size={20} className={iconClass} />
                </div>
                <p className="text-sm font-medium text-foreground">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {/* Statistiques — placeholder pour responsable */}
        {canManageIdeas && (
          <Card className="opacity-60">
            <CardContent className="p-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 mb-2">
                <BarChart2 size={20} className="text-purple-600" />
              </div>
              <p className="text-sm font-medium text-foreground">Statistiques</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Section idées (responsable + superuser uniquement) ─── */}
      {canManageIdeas && (
        <>
          {/* Alertes */}
          {stats && (stats.alerts.pending_over_48h > 0 || stats.alerts.in_study_over_7d > 0) && (
            <div className="space-y-2 mb-6">
              {stats.alerts.pending_over_48h > 0 && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{stats.alerts.pending_over_48h} idée(s)</strong> en attente de validation depuis plus de 48h.{" "}
                    <Link to="/dashboard/ideas?status=en_attente" className="underline font-medium">Voir</Link>
                  </AlertDescription>
                </Alert>
              )}
              {stats.alerts.in_study_over_7d > 0 && (
                <Alert variant="info">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{stats.alerts.in_study_over_7d} idée(s)</strong> en étude depuis plus de 7 jours.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Stat cards */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-2">
                    <Skeleton className="h-8 w-16 mx-auto" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total idées", value: stats.total, className: "text-primary" },
                  { label: "En attente", value: stats.by_status.en_attente || 0, className: "text-orange-500" },
                  { label: "Acceptées", value: stats.by_status.acceptee || 0, className: "text-green-600" },
                  { label: "Réalisées", value: stats.by_status.mise_en_oeuvre || 0, className: "text-yellow-600" },
                ].map(({ label, value, className }) => (
                  <Card key={label}>
                    <CardContent className="p-6 text-center">
                      <p className={`text-3xl font-bold ${className}`}>{value}</p>
                      <p className="text-sm text-muted-foreground mt-1">{label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Répartition par statut</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5">
                      {Object.entries(stats.by_status).map(([key, count]) => (
                        <div key={key} className="flex items-center justify-between">
                          <StatusBadge status={key} label={STATUS_LABELS[key] || key} />
                          <span className="font-bold text-foreground tabular-nums">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp size={16} /> Top catégories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!stats.by_category?.length ? (
                      <p className="text-muted-foreground text-sm">Aucune donnée.</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.by_category.map((c, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground w-5 text-right">
                              {i + 1}
                            </span>
                            <div className="flex-1 flex items-center justify-between text-sm">
                              <span className="text-foreground/80">{c.category__name}</span>
                              <Badge variant="secondary">{c.count}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {/* ─── Section admin pur (pas de stats idées) ─── */}
      {isPureAdmin && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck size={24} className="text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground mb-1">Espace Administrateur</p>
                <p className="text-sm text-muted-foreground">
                  Depuis ce tableau de bord, vous pouvez gérer les comptes membres et consulter
                  les logs d'audit de la plateforme. Pour participer aux idées, connectez-vous
                  avec votre compte PATS.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
