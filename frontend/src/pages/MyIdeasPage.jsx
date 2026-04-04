import { useQuery } from "@tanstack/react-query";
import { getMyIdeas } from "../api/ideas";
import IdeaCard from "../components/IdeaCard";
import { Link } from "react-router-dom";

export default function MyIdeasPage() {
  const { data: ideas, isLoading } = useQuery({
    queryKey: ["my-ideas"],
    queryFn: () => getMyIdeas().then((r) => r.data?.results || r.data),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes idées</h1>
          <p className="text-gray-500 mt-1">Suivez le traitement de vos idées soumises</p>
        </div>
        <Link to="/submit" className="btn-primary text-sm">
          Nouvelle idée
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-40" />)}
        </div>
      ) : !ideas?.length ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">💡</div>
          <p className="font-medium">Vous n'avez soumis aucune idée.</p>
          <Link to="/submit" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            Soumettre votre première idée
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)}
        </div>
      )}
    </div>
  );
}
