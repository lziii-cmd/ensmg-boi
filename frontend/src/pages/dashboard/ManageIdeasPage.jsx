import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getIdeas, getCategories } from "../../api/ideas";
import StatusBadge from "../../components/StatusBadge";

const STATUSES = [
  { value: "", label: "Tous les statuts" },
  { value: "en_attente", label: "En attente" },
  { value: "publiee", label: "Publiée" },
  { value: "en_etude", label: "En étude" },
  { value: "acceptee", label: "Acceptée" },
  { value: "rejetee", label: "Rejetée" },
  { value: "mise_en_oeuvre", label: "Mise en œuvre" },
  { value: "archivee", label: "Archivée" },
];

export default function ManageIdeasPage() {
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params = {
    status: status || undefined,
    category: category || undefined,
    search: search || undefined,
    page,
  };

  const { data } = useQuery({
    queryKey: ["manage-ideas", params],
    queryFn: () => getIdeas(params).then((r) => r.data),
    keepPreviousData: true,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories().then((r) => r.data),
  });

  const ideas = data?.results || [];
  const totalPages = data ? Math.ceil(data.count / 20) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestion des idées</h1>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input"
          />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input">
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input">
            <option value="">Toutes les catégories</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Titre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Auteur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Catégorie</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ideas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">Aucune idée trouvée.</td>
                </tr>
              ) : ideas.map((idea) => (
                <tr key={idea.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{idea.title}</td>
                  <td className="px-4 py-3 text-gray-600">{idea.author_name}</td>
                  <td className="px-4 py-3 text-gray-600">{idea.category_name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={idea.status} label={idea.status_display} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(idea.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/ideas/${idea.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Gérer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 px-4 py-3 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-3 py-1 text-sm"
            >
              Précédent
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary px-3 py-1 text-sm"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
