import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, RefreshCw, UserX, UserCheck, Users, Loader2, UserPlus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { getUsers, importMembers, resendInvitation, updateUser, getImportHistory, createMember, deleteUser } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle } from "lucide-react";

const ROLE_LABELS = {
  eleve: "Étudiant(e)",
  professeur: "Professeur",
  pat: "PATS",
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

const EMPTY_FORM = { first_name: "", last_name: "", role: "eleve" };

export default function MembersPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Add member dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addError, setAddError] = useState("");
  const [createdMember, setCreatedMember] = useState(null);

  // Edit member dialog
  const [editMember, setEditMember] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", role: "eleve", department: "" });
  const [editError, setEditError] = useState("");

  // Delete confirmation dialog
  const [deleteMember, setDeleteMember] = useState(null);

  // Import
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", search, roleFilter],
    queryFn: () => getUsers({
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
    onSuccess: (res) => { setImportResult(res.data); setImportError(""); queryClient.invalidateQueries(["users"]); queryClient.invalidateQueries(["import-history"]); },
    onError: (err) => { setImportError(err.response?.data?.detail || "Erreur lors de l'import."); setImportResult(null); },
  });

  const createMutation = useMutation({
    mutationFn: createMember,
    onSuccess: (res) => { queryClient.invalidateQueries(["users"]); setCreatedMember(res.data); setAddForm(EMPTY_FORM); setAddError(""); },
    onError: (err) => setAddError(err.response?.data?.detail || "Erreur lors de la création."),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["users"]); setEditMember(null); setEditError(""); },
    onError: (err) => setEditError(err.response?.data?.detail || "Erreur lors de la modification."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries(["users"]); setDeleteMember(null); },
  });

  const resendMutation = useMutation({ mutationFn: resendInvitation });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => updateUser(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries(["users"]),
  });

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportResult(null); setImportError("");
    const formData = new FormData();
    formData.append("file", file);
    importMutation.mutate(formData);
    e.target.value = "";
  };

  const handleCloseAdd = () => { setShowAddDialog(false); setAddError(""); setAddForm(EMPTY_FORM); setCreatedMember(null); };

  const openEdit = (u) => {
    setEditMember(u);
    setEditForm({ first_name: u.first_name, last_name: u.last_name, role: u.role, department: u.department || "" });
    setEditError("");
  };

  const users = usersData?.results || usersData || [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des membres</h1>
          <p className="text-muted-foreground mt-1">Gérez les membres de l'ENSMG</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddDialog(true)}>
            <UserPlus size={15} className="mr-2" /> Ajouter
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}>
            {importMutation.isPending ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Upload size={15} className="mr-2" />}
            {importMutation.isPending ? "Import..." : "Importer Excel"}
          </Button>
        </div>
        <input type="file" accept=".xlsx" ref={fileInputRef} onChange={handleImport} className="hidden" />
      </div>

      {/* Import feedback */}
      {importResult && (
        <Alert variant="success" className="mb-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Import terminé — {importResult.rows_created} créé(s) · {importResult.rows_updated} mis à jour · {importResult.rows_errors} erreur(s)</p>
          </AlertDescription>
        </Alert>
      )}
      {importError && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{importError}</AlertDescription></Alert>}

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Rechercher par nom ou email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger><SelectValue placeholder="Rôle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rôle</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Dept. / Service</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="px-4 py-3 w-28 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}</tr>
                ))
              ) : !users.length ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground"><Users size={36} className="mx-auto mb-2 opacity-30" />Aucun membre trouvé.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className={`hover:bg-muted/30 transition-colors ${!u.is_active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{u.first_name} {u.last_name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">{u.email}</td>
                  <td className="px-4 py-3"><Badge variant={ROLE_VARIANTS[u.role] || "secondary"}>{ROLE_LABELS[u.role] || u.role}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.department || "—"}</td>
                  <td className="px-4 py-3">
                    {u.is_active
                      ? <Badge variant={u.password_set ? "success" : "warning"}>{u.password_set ? "Actif" : "Invitation"}</Badge>
                      : <Badge variant="outline">Inactif</Badge>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {/* Renvoyer invitation */}
                      {!u.password_set && u.is_active && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary"
                          onClick={() => resendMutation.mutate(u.id)} title="Renvoyer l'invitation">
                          <RefreshCw size={13} />
                        </Button>
                      )}
                      {/* Activer/Désactiver */}
                      <Button variant="ghost" size="icon"
                        className={`h-7 w-7 ${u.is_active ? "text-orange-500 hover:text-orange-600" : "text-green-600 hover:text-green-700"}`}
                        onClick={() => toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active })}
                        title={u.is_active ? "Désactiver" : "Activer"}>
                        {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                      </Button>
                      {/* Modifier */}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700"
                        onClick={() => openEdit(u)} title="Modifier">
                        <Pencil size={13} />
                      </Button>
                      {/* Supprimer */}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteMember(u)} title="Supprimer">
                        <Trash2 size={13} />
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
          <CardHeader className="pb-3"><CardTitle className="text-base">Historique des imports</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 5).map((h, i) => (
                <div key={h.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/80 font-medium">{h.file_name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Badge variant="secondary">{h.rows_created} créé(s)</Badge>
                      <span className="tabular-nums text-xs">{new Date(h.imported_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  {i < Math.min(history.length, 5) - 1 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Dialog : Ajouter un membre ── */}
      <Dialog open={showAddDialog} onOpenChange={(o) => { if (!o) handleCloseAdd(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>L'email et le mot de passe sont générés automatiquement.</DialogDescription>
          </DialogHeader>

          {createdMember ? (
            <div className="space-y-4 mt-1">
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Compte créé pour <strong>{createdMember.first_name} {createdMember.last_name}</strong>.</AlertDescription>
              </Alert>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-2 text-sm">
                <p className="font-semibold text-amber-900 mb-2">Identifiants à communiquer :</p>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono font-medium">{createdMember.generated_email || createdMember.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mot de passe</span><span className="font-mono font-medium">passer01</span></div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => setCreatedMember(null)}>Ajouter un autre</Button>
                <Button variant="outline" className="flex-1" onClick={handleCloseAdd}>Fermer</Button>
              </div>
            </div>
          ) : (
            <>
              {addError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{addError}</AlertDescription></Alert>}
              <form onSubmit={(e) => { e.preventDefault(); setAddError(""); createMutation.mutate(addForm); }} className="space-y-4 mt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Prénom <span className="text-destructive">*</span></Label>
                    <Input value={addForm.first_name} onChange={(e) => setAddForm((f) => ({ ...f, first_name: e.target.value }))} required autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nom <span className="text-destructive">*</span></Label>
                    <Input value={addForm.last_name} onChange={(e) => setAddForm((f) => ({ ...f, last_name: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Titre / Rôle <span className="text-destructive">*</span></Label>
                  <Select value={addForm.role} onValueChange={(v) => setAddForm((f) => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border text-xs text-muted-foreground space-y-1">
                  <p>📧 Email généré : <span className="font-mono text-foreground">prenom.nom@ensmg.sn</span></p>
                  <p>🔑 Mot de passe : <span className="font-mono text-foreground">passer01</span></p>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={handleCloseAdd}>Annuler</Button>
                  <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer le compte
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog : Modifier un membre ── */}
      <Dialog open={!!editMember} onOpenChange={(o) => { if (!o) { setEditMember(null); setEditError(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le membre</DialogTitle>
            <DialogDescription>{editMember?.email}</DialogDescription>
          </DialogHeader>
          {editError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{editError}</AlertDescription></Alert>}
          <form onSubmit={(e) => { e.preventDefault(); editMutation.mutate({ id: editMember.id, data: editForm }); }} className="space-y-4 mt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prénom</Label>
                <Input value={editForm.first_name} onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))} required autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input value={editForm.last_name} onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                {editForm.role === "pat" ? "Service" : editForm.role === "eleve" ? "Promotion" : "Département"}
              </Label>
              <Input
                value={editForm.department}
                onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                placeholder={
                  editForm.role === "pat" ? "ex: Service Scolarité" :
                  editForm.role === "eleve" ? "ex: 2ème année" :
                  "ex: Géotechnique"
                }
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setEditMember(null); setEditError(""); }}>Annuler</Button>
              <Button type="submit" className="flex-1" disabled={editMutation.isPending}>
                {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog : Confirmer suppression ── */}
      <Dialog open={!!deleteMember} onOpenChange={(o) => { if (!o) setDeleteMember(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={18} /> Supprimer le membre
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le compte de <strong>{deleteMember?.first_name} {deleteMember?.last_name}</strong> ({deleteMember?.email}) sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteMember(null)}>Annuler</Button>
            <Button variant="destructive" className="flex-1" disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteMember.id)}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
