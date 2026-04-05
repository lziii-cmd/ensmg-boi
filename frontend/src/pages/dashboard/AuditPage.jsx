import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getAuditLogs } from "@/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ACTION_LABELS = {
  login: "Connexion",
  logout: "Déconnexion",
  create_user: "Création membre",
  update_user: "Modification membre",
  delete_user: "Suppression membre",
  toggle_active: "Activation/Désactivation",
  import_users: "Import membres",
  idea_status: "Changement statut idée",
  idea_create: "Soumission idée",
  idea_pin: "Épinglage idée",
  comment_moderate: "Modération commentaire",
};

const ACTION_VARIANTS = {
  login: "success",
  logout: "secondary",
  create_user: "info",
  update_user: "warning",
  delete_user: "destructive",
  toggle_active: "warning",
  import_users: "info",
  idea_status: "info",
  idea_create: "secondary",
  idea_pin: "secondary",
  comment_moderate: "warning",
};

const ACTION_ICONS = {
  login: "🔑",
  logout: "🚪",
  create_user: "👤",
  update_user: "✏️",
  delete_user: "🗑️",
  toggle_active: "🔄",
  import_users: "📥",
  idea_status: "💡",
  idea_create: "✨",
  idea_pin: "📌",
  comment_moderate: "🚩",
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function DetailsCell({ action, details }) {
  if (!details || Object.keys(details).length === 0) return <span className="text-muted-foreground">—</span>;

  if (action === "idea_status") {
    return (
      <span className="text-xs">
        <span className="text-muted-foreground">{details.old_status}</span>
        {" → "}
        <span className="font-medium">{details.new_status}</span>
        {details.comment && <span className="text-muted-foreground"> ({details.comment})</span>}
      </span>
    );
  }
  if (action === "import_users") {
    return (
      <span className="text-xs text-muted-foreground">
        +{details.rows_created} créé(s), {details.rows_updated} màj, {details.rows_errors} erreur(s)
      </span>
    );
  }
  if (action === "toggle_active" && details.changes) {
    const active = details.changes.is_active;
    return (
      <span className="text-xs">
        {active ? "Activé" : "Désactivé"}
      </span>
    );
  }
  if (details.email) {
    return <span className="text-xs font-mono text-muted-foreground">{details.email}</span>;
  }
  return <span className="text-xs text-muted-foreground">{JSON.stringify(details).slice(0, 60)}</span>;
}

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", search, actionFilter, page],
    queryFn: () => getAuditLogs({
      search: search || undefined,
      action: actionFilter !== "all" ? actionFilter : undefined,
      page,
    }).then((r) => r.data),
    keepPreviousData: true,
  });

  const logs = data?.results || data || [];
  const totalCount = data?.count || logs.length;
  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-100">
          <ShieldCheck size={22} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Journal d'audit</h1>
          <p className="text-muted-foreground mt-0.5">Traçabilité de toutes les actions sur la plateforme</p>
        </div>
      </div>

      {/* Filtres */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par utilisateur, cible..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Type d'action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {Object.entries(ACTION_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Compteur */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {totalCount} entrée{totalCount !== 1 ? "s" : ""}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </div>

      {/* Tableau */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Utilisateur</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Cible</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Détails</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : !logs.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <ShieldCheck size={36} className="mx-auto mb-2 opacity-30" />
                    Aucun log trouvé.
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground text-xs">{log.user_name}</p>
                      <p className="text-muted-foreground text-[11px] font-mono">{log.user_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ACTION_VARIANTS[log.action] || "secondary"} className="gap-1 text-xs">
                      <span>{ACTION_ICONS[log.action] || "•"}</span>
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-foreground/80 truncate max-w-[160px] block">
                      {log.target_repr || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <DetailsCell action={log.action} details={log.details} />
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-xs font-mono text-muted-foreground">
                    {log.ip_address || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
