import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIdeas, getCategories, updateIdeaStatus } from "@/api/ideas";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ExternalLink, Search, CheckCircle, XCircle, RefreshCw, Loader2, AlertCircle } from "lucide-react";

const STATUSES = [
  { value: "all",            label: "Tous les statuts" },
  { value: "en_attente",     label: "En attente" },
  { value: "publiee",        label: "Publiée" },
  { value: "en_etude",       label: "En étude" },
  { value: "acceptee",       label: "Acceptée" },
  { value: "rejetee",        label: "Rejetée" },
  { value: "mise_en_oeuvre", label: "Mise en œuvre" },
  { value: "archivee",       label: "Archivée" },
];

// Transitions possibles depuis chaque statut
const NEXT_STATUSES = {
  en_attente:     ["publiee", "rejetee"],
  publiee:        ["en_etude", "rejetee", "archivee"],
  en_etude:       ["acceptee", "rejetee", "archivee"],
  acceptee:       ["mise_en_oeuvre", "archivee"],
  mise_en_oeuvre: ["archivee"],
  rejetee:        ["publiee", "archivee"],
  archivee:       ["publiee"],
};

const STATUS_ACTION_LABELS = {
  publiee:        { label: "Publier",       variant: "success",     icon: CheckCircle },
  rejetee:        { label: "Rejeter",       variant: "destructive", icon: XCircle },
  en_etude:       { label: "Mettre en étude",   variant: "info",    icon: RefreshCw },
  acceptee:       { label: "Accepter",      variant: "success",     icon: CheckCircle },
  mise_en_oeuvre: { label: "Mettre en œuvre",   variant: "warning", icon: RefreshCw },
  archivee:       { label: "Archiver",      variant: "outline",     icon: RefreshCw },
};

export default function ManageIdeasPage() {
  const queryClient = useQueryClient();
  const [status, setStatus]     = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);

  // Dialog changement de statut
  const [actionDialog, setActionDialog] = useState(null); // { idea, newStatus }
  const [motif, setMotif]               = useState("");
  const [reponse, setReponse]           = useState("");
  const [dialogError, setDialogError]   = useState("");

  const params = {
    status:   status   !== "all" ? status   : undefined,
    category: category !== "all" ? category : undefined,
    search:   search   || undefined,
    page,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["manage-ideas", params],
    queryFn: () => getIdeas(params).then((r) => r.data),
    keepPreviousData: true,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories().then((r) => r.data?.results || r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, data }) => updateIdeaStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["manage-ideas"]);
      queryClient.invalidateQueries(["dashboard-stats"]);
      closeDialog();
    },
    onError: (err) => setDialogError(err.response?.data?.detail || "Erreur lors de la mise à jour."),
  });

  const openDialog = (idea, newStatus) => {
    setActionDialog({ idea, newStatus });
    setMotif("");
    setReponse("");
    setDialogError("");
  };

  const closeDialog = () => {
    setActionDialog(null);
    setMotif("");
    setReponse("");
    setDialogError("");
  };

  const handleSubmitAction = () => {
    if (actionDialog.newStatus === "rejetee" && !motif.trim()) {
      setDialogError("Le motif de rejet est obligatoire.");
      return;
    }
    statusMutation.mutate({
      id: actionDialog.idea.id,
      data: {
        status: actionDialog.newStatus,
        comment: motif.trim(),
        official_response: reponse.trim(),
      },
    });
  };

  const ideas      = data?.results || [];
  const totalPages = data ? Math.ceil(data.count / 20) : 0;
  const isRejection = actionDialog?.newStatus === "rejetee";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestion des idées</h1>
        <p className="text-muted-foreground mt-1">Publiez, rejetez ou faites évoluer les idées soumises</p>
      </div>

      {/* Filtres */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Titre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Auteur</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : ideas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    Aucune idée trouvée.
                  </td>
                </tr>
              ) : ideas.map((idea) => {
                const nextStatuses = NEXT_STATUSES[idea.status] || [];
                return (
                  <tr key={idea.id} className={`hover:bg-muted/30 transition-colors ${idea.status === "en_attente" ? "bg-orange-50/40" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[180px]">{idea.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">{idea.author_name}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{idea.author_name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={idea.status} label={idea.status_display} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs hidden md:table-cell">
                      {new Date(idea.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end flex-wrap">
                        {/* Boutons d'action rapide */}
                        {nextStatuses.map((ns) => {
                          const cfg = STATUS_ACTION_LABELS[ns];
                          if (!cfg) return null;
                          const Icon = cfg.icon;
                          const isPrimary = ns === "publiee";
                          const isDanger  = ns === "rejetee";
                          return (
                            <Button
                              key={ns}
                              size="sm"
                              variant={isDanger ? "destructive" : isPrimary ? "default" : "outline"}
                              className="h-7 text-xs px-2.5 gap-1"
                              onClick={() => openDialog(idea, ns)}
                            >
                              <Icon size={11} />
                              {cfg.label}
                            </Button>
                          );
                        })}
                        {/* Lien vers le détail */}
                        <Link to={`/ideas/${idea.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Voir l'idée">
                            <ExternalLink size={13} />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 px-4 py-3 border-t bg-muted/20">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Suivant
            </Button>
          </div>
        )}
      </Card>

      {/* ── Dialog : Confirmer l'action ── */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={isRejection ? "text-destructive" : ""}>
              {actionDialog && STATUS_ACTION_LABELS[actionDialog.newStatus]?.label} — {actionDialog?.idea.title}
            </DialogTitle>
            <DialogDescription>
              {isRejection
                ? "L'auteur sera notifié avec le motif que vous indiquez."
                : `L'idée passera au statut "${STATUSES.find(s => s.value === actionDialog?.newStatus)?.label}".`}
            </DialogDescription>
          </DialogHeader>

          {dialogError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{dialogError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 mt-1">
            {/* Motif — obligatoire pour rejet, optionnel sinon */}
            <div className="space-y-1.5">
              <Label>
                {isRejection ? "Motif du rejet" : "Commentaire"}{" "}
                {isRejection && <span className="text-destructive">*</span>}
                {!isRejection && <span className="text-muted-foreground text-xs">(optionnel)</span>}
              </Label>
              <Textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder={isRejection
                  ? "Ex : Cette idée contient des propos inappropriés..."
                  : "Remarque ou précision pour l'historique..."
                }
                rows={3}
              />
            </div>

            {/* Réponse officielle — pour publiée, en_etude, acceptée */}
            {!isRejection && (
              <div className="space-y-1.5">
                <Label>Réponse officielle <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Textarea
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  placeholder="Message officiel visible par l'auteur..."
                  rows={2}
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeDialog}>
                Annuler
              </Button>
              <Button
                className="flex-1"
                variant={isRejection ? "destructive" : "default"}
                onClick={handleSubmitAction}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
