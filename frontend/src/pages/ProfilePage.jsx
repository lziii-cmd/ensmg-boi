import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Key, Loader2, Pencil, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { changePassword, updateMe } from "@/api/auth";
import { getNotifications, markAllRead } from "@/api/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROLE_LABELS = {
  eleve: "Étudiant(e)",
  professeur: "Professeur",
  pat: "PATS",
  responsable: "Responsable des Communications",
  admin: "Administrateur",
};

const PW_FIELDS = [
  { key: "old_password", label: "Mot de passe actuel" },
  { key: "new_password", label: "Nouveau mot de passe" },
  { key: "new_password_confirm", label: "Confirmer le nouveau mot de passe" },
];

export default function ProfilePage() {
  const { user, loginUser } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", department: "" });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", new_password_confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications().then((r) => r.data?.results || r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => { queryClient.invalidateQueries(["notifications"]); queryClient.invalidateQueries(["unread-count"]); },
  });

  const profileMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (res) => {
      setProfileSuccess(true);
      setProfileError("");
      setEditMode(false);
      // Update user in auth context
      const tokens = {
        access: localStorage.getItem("access_token"),
        refresh: localStorage.getItem("refresh_token"),
      };
      loginUser(tokens, res.data);
    },
    onError: (err) => setProfileError(err.response?.data?.detail || "Erreur lors de la modification."),
  });

  const pwMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => { setPwSuccess(true); setPwError(""); setPwForm({ old_password: "", new_password: "", new_password_confirm: "" }); },
    onError: (err) => { setPwSuccess(false); setPwError(err.response?.data?.detail || "Erreur."); },
  });

  const openEdit = () => {
    setProfileForm({ first_name: user?.first_name || "", last_name: user?.last_name || "", department: user?.department || "" });
    setProfileSuccess(false);
    setProfileError("");
    setEditMode(true);
  };

  const unreadNotifs = notifications?.filter((n) => !n.is_read) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Carte profil ── */}
      <Card className="border-t-4 border-t-primary">
        <CardContent className="pt-6">
          {/* En-tête profil */}
          <div className="flex items-start gap-4 mb-5">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className="bg-[hsl(221,83%,25%)] text-white text-xl font-bold">
                {user?.first_name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xl text-foreground">{user?.first_name} {user?.last_name}</p>
              <p className="text-muted-foreground text-sm truncate mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="bg-[hsl(221,83%,25%)] text-white border-0">
                  {ROLE_LABELS[user?.role] || user?.role}
                </Badge>
                {user?.department && (
                  <Badge variant="outline">{user.department}</Badge>
                )}
              </div>
            </div>
            {!editMode && (
              <Button variant="outline" size="sm" onClick={openEdit} className="shrink-0">
                <Pencil size={14} className="mr-1.5" /> Modifier
              </Button>
            )}
          </div>

          {/* Alerte succès modification profil */}
          {profileSuccess && !editMode && (
            <Alert variant="success" className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Profil mis à jour avec succès.</AlertDescription>
            </Alert>
          )}

          {/* Formulaire modification profil */}
          {editMode && (
            <div className="border border-primary/30 rounded-lg p-4 bg-amber-50/30 space-y-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Pencil size={14} className="text-primary" /> Modifier mes informations
              </p>
              {profileError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(profileForm); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Prénom</Label>
                    <Input value={profileForm.first_name} onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nom</Label>
                    <Input value={profileForm.last_name} onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {user?.role === "pat" ? "Service" : user?.role === "eleve" ? "Promotion" : "Département"}
                  </Label>
                  <Input
                    value={profileForm.department}
                    onChange={(e) => setProfileForm((f) => ({ ...f, department: e.target.value }))}
                    placeholder={
                      user?.role === "pat" ? "ex: Service Scolarité" :
                      user?.role === "eleve" ? "ex: 2ème année" :
                      "ex: Géotechnique"
                    }
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={profileMutation.isPending}>
                    {profileMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    Enregistrer
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditMode(false)}>
                    <X size={14} className="mr-1" /> Annuler
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tabs : Mot de passe + Notifications ── */}
      <Tabs defaultValue="notifications">
        <TabsList className="w-full">
          <TabsTrigger value="notifications" className="flex-1">
            🔔 Notifications
            {unreadNotifs.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white border-0 text-[10px] px-1.5 py-0 h-4">
                {unreadNotifs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="password" className="flex-1">🔑 Mot de passe</TabsTrigger>
        </TabsList>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell size={15} /> Mes notifications
                </CardTitle>
                {unreadNotifs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate()} disabled={markReadMutation.isPending} className="text-xs h-7">
                    Tout marquer comme lu
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!notifications?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune notification.</p>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                  {notifications.map((n, i) => (
                    <div key={n.id}>
                      <div className={`p-3 rounded-lg text-sm ${n.is_read ? "bg-muted/30" : "bg-primary/5 border border-primary/20"}`}>
                        <p className={`font-medium ${n.is_read ? "text-foreground/70" : "text-foreground"}`}>{n.title}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{n.message}</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">{new Date(n.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      {i < notifications.length - 1 && <Separator className="my-1" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mot de passe */}
        <TabsContent value="password">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Key size={15} /> Changer le mot de passe</CardTitle>
            </CardHeader>
            <CardContent>
              {pwSuccess && (
                <Alert variant="success" className="mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>Mot de passe modifié avec succès.</AlertDescription>
                </Alert>
              )}
              {pwError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{pwError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={(e) => { e.preventDefault(); setPwError(""); setPwSuccess(false); pwMutation.mutate(pwForm); }} className="space-y-3">
                {PW_FIELDS.map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Input type="password" value={pwForm[key]}
                      onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                      minLength={key !== "old_password" ? 8 : undefined} required />
                  </div>
                ))}
                <Button type="submit" disabled={pwMutation.isPending} className="mt-1">
                  {pwMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Modifier le mot de passe
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
