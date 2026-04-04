import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import { getIdeas, getCategories } from "../api/ideas";
import IdeaCard from "../components/IdeaCard";

const STATUSES = [
  { value: "", label: "Tous les statuts" },
  { value: "publiee", label: "Publiée" },
  { value: "en_etude", label: "En étude" },
  { value: "acceptee", label: "Acceptée" },
  { value: "mise_en_oeuvre", label: "Mise en œuvre" },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);

  const params = {
    search: search || undefined,
    category: category || undefined,
    status: statusFilter || undefined,
    ordering,
    page,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["ideas", params],
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Toutes les idées</h1>
        <p className="text-gray-500 mt-1">Découvrez et votez pour les idées de la communauté ENSMG</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9"
            />
          </div>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="input"
          >
            <option value="">Toutes les catégories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="input"
          >
            <option value="-created_at">Plus récentes</option>
            <option value="created_at">Plus anciennes</option>
            <option value="-vote_count">Plus votées</option>
          </select>
        </div>
      </div>

      {/* Ideas grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-40 bg-gray-100" />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">💡</div>
          <p className="font-medium">Aucune idée trouvée</p>
          <p className="text-sm">Modifiez vos filtres ou soumettez la première idée !</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
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
        </>
      )}
    </div>
  );
}
