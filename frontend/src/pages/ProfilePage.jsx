import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Key, User, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { changePassword } from "@/api/auth";
import { getNotifications, markAllRead } from "@/api/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, AlertCircle } from "lucide-react";

const ROLE_LABELS = {
  eleve: "Élève",
  professeur: "Professeur",
  pat: "Personnel Administratif et Technique",
  responsable: "Responsable des Communications",
  admin: "Administrateur",
};

const PW_FIELDS = [
  { key: "old_password", label: "Mot de passe actuel" },
  { key: "new_password", label: "Nouveau mot de passe" },
  { key: "new_password_confirm", label: "Confirmer le nouveau mot de passe" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications().then((r) => r.data?.results || r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["unread-count"]);
    },
  });

  const pwMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPwSuccess(true);
      setPwError("");
      setPwForm({ old_password: "", new_password: "", new_password_confirm: "" });
    },
    onError: (err) => {
      setPwSuccess(false);
      setPwError(err.response?.data?.detail || "Erreur lors de la modification.");
    },
  });

  const handlePwSubmit = (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    pwMutation.mutate(pwForm);
  };

  const unreadNotifs = notifications?.filter((n) => !n.is_read) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {user?.first_name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg text-foreground">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="info">{ROLE_LABELS[user?.role] || user?.role}</Badge>
                {user?.department && (
                  <span className="text-xs text-muted-foreground">{user.department}</span>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <User size={20} className="text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key size={16} /> Changer le mot de passe
          </CardTitle>
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
          <form onSubmit={handlePwSubmit} className="space-y-3">
            {PW_FIELDS.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="password"
                  value={pwForm[key]}
                  onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                  minLength={key !== "old_password" ? 8 : undefined}
                  required
                />
              </div>
            ))}
            <Button type="submit" disabled={pwMutation.isPending} className="mt-1">
              {pwMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pwMutation.isPending ? "Enregistrement..." : "Modifier le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell size={16} /> Notifications
              {unreadNotifs.length > 0 && (
                <Badge className="ml-1 bg-red-500 text-white border-0 text-xs px-1.5">
                  {unreadNotifs.length}
                </Badge>
              )}
            </CardTitle>
            {unreadNotifs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markReadMutation.mutate()}
                disabled={markReadMutation.isPending}
                className="text-xs h-7"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!notifications?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune notification.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {notifications.map((n, i) => (
                <div key={n.id}>
                  <div className={`p-3 rounded-lg text-sm transition-colors ${
                    n.is_read
                      ? "bg-muted/30"
                      : "bg-primary/5 border border-primary/20"
                  }`}>
                    <p className={`font-medium ${n.is_read ? "text-foreground/70" : "text-foreground"}`}>
                      {n.title}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{n.message}</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">
                      {new Date(n.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  {i < notifications.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
