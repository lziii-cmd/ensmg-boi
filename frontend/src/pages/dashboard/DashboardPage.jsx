import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../../api/ideas";
import { Link } from "react-router-dom";
import { AlertTriangle, Lightbulb, Users, BarChart2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const STATUS_LABELS = {
  en_attente: "En attente",
  publiee: "Publiées",
  en_etude: "En étude",
  acceptee: "Acceptées",
  rejetee: "Rejetées",
  mise_en_oeuvre: "Mises en œuvre",
  archivee: "Archivées",
};

const STATUS_COLORS = {
  en_attente: "bg-orange-100 text-orange-800",
  publiee: "bg-gray-100 text-gray-800",
  en_etude: "bg-blue-100 text-blue-800",
  acceptee: "bg-green-100 text-green-800",
  rejetee: "bg-red-100 text-red-800",
  mise_en_oeuvre: "bg-yellow-100 text-yellow-800",
  archivee: "bg-gray-200 text-gray-600",
};

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats().then((r) => r.data),
    refetchInterval: 60000,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link to="/dashboard/ideas" className="card hover:shadow-md transition-shadow text-center py-4">
          <Lightbulb size={24} className="mx-auto text-blue-700 mb-1" />
          <p className="text-sm font-medium text-gray-700">Gérer les idées</p>
        </Link>
        <Link to="/dashboard/moderation" className="card hover:shadow-md transition-shadow text-center py-4">
          <AlertTriangle size={24} className="mx-auto text-orange-500 mb-1" />
          <p className="text-sm font-medium text-gray-700">Modération</p>
        </Link>
        {isAdmin && (
          <Link to="/dashboard/members" className="card hover:shadow-md transition-shadow text-center py-4">
            <Users size={24} className="mx-auto text-green-700 mb-1" />
            <p className="text-sm font-medium text-gray-700">Membres</p>
          </Link>
        )}
        <div className="card text-center py-4">
          <BarChart2 size={24} className="mx-auto text-purple-600 mb-1" />
          <p className="text-sm font-medium text-gray-700">Statistiques</p>
        </div>
      </div>

      {/* Alerts */}
      {stats && (stats.alerts.pending_over_48h > 0 || stats.alerts.in_study_over_7d > 0) && (
        <div className="space-y-2 mb-6">
          {stats.alerts.pending_over_48h > 0 && (
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm">
              <AlertTriangle size={18} />
              <span>
                <strong>{stats.alerts.pending_over_48h} idée(s)</strong> en attente de validation depuis plus de 48h.
                <Link to="/dashboard/ideas?status=en_attente" className="underline ml-1">Voir</Link>
              </span>
            </div>
          )}
          {stats.alerts.in_study_over_7d > 0 && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              <AlertTriangle size={18} />
              <span>
                <strong>{stats.alerts.in_study_over_7d} idée(s)</strong> en étude depuis plus de 7 jours.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Stats cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="card text-center">
              <p className="text-3xl font-bold text-blue-800">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">Total idées</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-orange-500">{stats.by_status.en_attente || 0}</p>
              <p className="text-sm text-gray-500 mt-1">En attente</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-green-600">{stats.by_status.acceptee || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Acceptées</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.by_status.mise_en_oeuvre || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Réalisées</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* By status */}
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Répartition par statut</h2>
              <div className="space-y-2">
                {Object.entries(stats.by_status).map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className={`badge ${STATUS_COLORS[key]}`}>{STATUS_LABELS[key] || key}</span>
                    <span className="font-bold text-gray-700">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top categories */}
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Top catégories</h2>
              <div className="space-y-2">
                {stats.by_category?.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{c.category__name}</span>
                    <span className="font-bold text-blue-800">{c.count}</span>
                  </div>
                ))}
                {!stats.by_category?.length && (
                  <p className="text-gray-400 text-sm">Aucune donnée.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
