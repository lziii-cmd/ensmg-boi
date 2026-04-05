import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, RefreshCw, UserX, UserCheck, Users, Loader2 } from "lucide-react";
import { getUsers, importMembers, resendInvitation, updateUser, getImportHistory } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle } from "lucide-react";

const ROLE_LABELS = {
  eleve: "Élève",
  professeur: "Professeur",
  pat: "PAT",
  responsable: "Responsable",
  admin: "Admin",
};

const ROLE_VARIANTS = {
  eleve: "secondary",
  professeur: "info",
  pat: "warning",
  responsable: "success",
  admin: "destructive",
};

export default function MembersPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", search, roleFilter],
    queryFn: () =>
      getUsers({
        search: search || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
      }).then((r) => r.data),
    keepPreviousData: true,
  });

  const { data: history } = useQuery({
    queryKey: ["import-history"],
    queryFn: () => getImportHistory().then((r) => r.data?.results || r.data),
  });

  const importMutation = useMutation({
    mutationFn: importMembers,
    onSuccess: (res) => {
      setImportResult(res.data);
      setImportError("");
      queryClient.invalidateQueries(["users"]);
      queryClient.invalidateQueries(["import-history"]);
    },
    onError: (err) => {
      setImportError(err.response?.data?.detail || "Erreur lors de l'import.");
      setImportResult(null);
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendInvitation,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => updateUser(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries(["users"]),
  });

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportResult(null);
    setImportError("");
    const formData = new FormData();
    formData.append("file", file);
    importMutation.mutate(formData);
    e.target.value = "";
  };

  const users = usersData?.results || usersData || [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des membres</h1>
          <p className="text-muted-foreground mt-1">Importez et gérez les membres de l'ENSMG</p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={importMutation.isPending}
        >
          {importMutation.isPending
            ? <Loader2 size={15} className="mr-2 animate-spin" />
            : <Upload size={15} className="mr-2" />
          }
          {importMutation.isPending ? "Import en cours..." : "Importer Excel"}
        </Button>
        <input
          type="file"
          accept=".xlsx"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {/* Import feedback */}
      {importResult && (
        <Alert variant="success" className="mb-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Import terminé avec succès</p>
            <p className="mt-0.5">
              {importResult.rows_created} créé(s) · {importResult.rows_updated} mis à jour ·{" "}
              {importResult.rows_errors} erreur(s) sur {importResult.rows_processed} lignes.
            </p>
            {importResult.errors?.length > 0 && (
              <div className="mt-2 text-xs text-red-700 space-y-0.5">
                {importResult.errors.slice(0, 3).map((e, i) => (
                  <p key={i}>Ligne {e.ligne} : {e.erreur}</p>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {importError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {Object.entries(ROLE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members table */}
      <Card className="overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rôle</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Département</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !users.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users size={36} className="mx-auto mb-2 opacity-30" />
                    Aucun membre trouvé.
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr
                  key={u.id}
                  className={`hover:bg-muted/30 transition-colors ${!u.is_active ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANTS[u.role] || "secondary"}>
                      {ROLE_LABELS[u.role] || u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {u.department || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <Badge variant={u.password_set ? "success" : "warning"}>
                        {u.password_set ? "Actif" : "Invitation envoyée"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {!u.password_set && u.is_active && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:text-primary"
                          onClick={() => resendMutation.mutate(u.id)}
                          title="Renvoyer l'invitation"
                        >
                          <RefreshCw size={13} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${u.is_active
                          ? "text-destructive hover:text-destructive"
                          : "text-green-600 hover:text-green-600"
                        }`}
                        onClick={() => toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active })}
                        title={u.is_active ? "Désactiver" : "Activer"}
                      >
                        {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Import history */}
      {history?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historique des imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 5).map((h, i) => (
                <div key={h.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/80 font-medium">{h.file_name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Badge variant="secondary">{h.rows_created} créé(s)</Badge>
                      <span className="tabular-nums text-xs">
                        {new Date(h.imported_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                  {i < Math.min(history.length, 5) - 1 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
