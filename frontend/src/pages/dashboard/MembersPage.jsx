import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, RefreshCw, UserX, UserCheck } from "lucide-react";
import { getUsers, importMembers, resendInvitation, updateUser, getImportHistory } from "../../api/auth";

const ROLE_LABELS = {
  eleve: "Élève",
  professeur: "Professeur",
  pat: "PAT",
  responsable: "Responsable",
  admin: "Admin",
};

export default function MembersPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");

  const { data: usersData } = useQuery({
    queryKey: ["users", search, roleFilter],
    queryFn: () => getUsers({ search: search || undefined, role: roleFilter || undefined }).then((r) => r.data),
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
      queryClient.invalidateQueries(["users"]);
      queryClient.invalidateQueries(["import-history"]);
    },
    onError: (err) => setImportError(err.response?.data?.detail || "Erreur lors de l'import."),
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des membres</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary flex items-center gap-2 text-sm"
          disabled={importMutation.isLoading}
        >
          <Upload size={16} />
          {importMutation.isLoading ? "Import en cours..." : "Importer Excel"}
        </button>
        <input
          type="file"
          accept=".xlsx"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {/* Import result */}
      {importResult && (
        <div className="card mb-4 bg-green-50 border border-green-200">
          <p className="font-medium text-green-800 mb-1">Import terminé</p>
          <p className="text-sm text-green-700">
            {importResult.rows_created} créé(s) · {importResult.rows_updated} mis à jour ·{" "}
            {importResult.rows_errors} erreur(s) sur {importResult.rows_processed} lignes.
          </p>
          {importResult.errors?.length > 0 && (
            <div className="mt-2 text-xs text-red-600">
              {importResult.errors.slice(0, 3).map((e, i) => (
                <p key={i}>Ligne {e.ligne} : {e.erreur}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {importError && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{importError}</p>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input">
            <option value="">Tous les rôles</option>
            {Object.entries(ROLE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Members table */}
      <div className="card overflow-hidden p-0 mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rôle</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Département</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!users.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Aucun membre trouvé.
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 ${!u.is_active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium">{u.first_name} {u.last_name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-blue-50 text-blue-700">{ROLE_LABELS[u.role] || u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.department || "—"}</td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <span className="badge bg-green-100 text-green-700">
                        {u.password_set ? "Actif" : "Invitation envoyée"}
                      </span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-500">Inactif</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {!u.password_set && u.is_active && (
                        <button
                          onClick={() => resendMutation.mutate(u.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Renvoyer l'invitation"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active })}
                        className={`p-1.5 rounded ${u.is_active ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                        title={u.is_active ? "Désactiver" : "Activer"}
                      >
                        {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import history */}
      {history?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Historique des imports</h2>
          <div className="space-y-2 text-sm">
            {history.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-gray-600">
                <span>{h.file_name}</span>
                <span className="text-gray-400">
                  {h.rows_created} créé(s) · {new Date(h.imported_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
