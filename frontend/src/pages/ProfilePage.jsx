import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Key } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { changePassword } from "../api/auth";
import { getNotifications, markAllRead } from "../api/notifications";

const ROLE_LABELS = {
  eleve: "Élève",
  professeur: "Professeur",
  pat: "Personnel Administratif et Technique",
  responsable: "Responsable des Communications",
  admin: "Administrateur",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", new_password_confirm: "" });
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
      setPwForm({ old_password: "", new_password: "", new_password_confirm: "" });
    },
    onError: (err) => setPwError(err.response?.data?.detail || "Erreur."),
  });

  const handlePwSubmit = (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    pwMutation.mutate(pwForm);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile info */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-blue-800 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {user?.first_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.first_name} {user?.last_name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="badge bg-blue-100 text-blue-800 mt-1">
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
        </div>
        {user?.department && (
          <p className="text-sm text-gray-500">Département : {user.department}</p>
        )}
      </div>

      {/* Change password */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Key size={18} /> Changer le mot de passe
        </h2>
        {pwSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 mb-4 text-sm">
            Mot de passe modifié avec succès.
          </div>
        )}
        {pwError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
            {pwError}
          </div>
        )}
        <form onSubmit={handlePwSubmit} className="space-y-3">
          {["old_password", "new_password", "new_password_confirm"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field === "old_password" ? "Mot de passe actuel" :
                  field === "new_password" ? "Nouveau mot de passe" : "Confirmer le nouveau mot de passe"}
              </label>
              <input
                type="password"
                value={pwForm[field]}
                onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                className="input"
                minLength={field !== "old_password" ? 8 : undefined}
                required
              />
            </div>
          ))}
          <button type="submit" className="btn-primary" disabled={pwMutation.isLoading}>
            {pwMutation.isLoading ? "Enregistrement..." : "Modifier le mot de passe"}
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Bell size={18} /> Notifications
          </h2>
          {notifications?.some((n) => !n.is_read) && (
            <button
              onClick={() => markReadMutation.mutate()}
              className="text-sm text-blue-600 hover:underline"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {!notifications?.length ? (
          <p className="text-sm text-gray-400">Aucune notification.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-lg text-sm ${n.is_read ? "bg-gray-50" : "bg-blue-50 border border-blue-100"}`}
              >
                <p className={`font-medium ${n.is_read ? "text-gray-700" : "text-blue-800"}`}>
                  {n.title}
                </p>
                <p className="text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
