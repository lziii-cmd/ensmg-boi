import { useQuery } from "@tanstack/react-query";
import { getMyIdeas } from "@/api/ideas";
import IdeaCard from "@/components/IdeaCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Lightbulb } from "lucide-react";

export default function MyIdeasPage() {
  const { data: ideas, isLoading } = useQuery({
    queryKey: ["my-ideas"],
    queryFn: () => getMyIdeas().then((r) => r.data?.results || r.data),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes idées</h1>
          <p className="text-muted-foreground mt-1">Suivez le traitement de vos idées soumises</p>
        </div>
        <Button asChild size="sm">
          <Link to="/submit">
            <PlusCircle size={15} className="mr-2" /> Nouvelle idée
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !ideas?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <Lightbulb size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-base">Vous n'avez soumis aucune idée.</p>
          <p className="text-sm mt-1 mb-4">Partagez votre première idée avec la communauté !</p>
          <Button asChild size="sm">
            <Link to="/submit">
              <PlusCircle size={14} className="mr-2" /> Soumettre une idée
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)}
        </div>
      )}
    </div>
  );
}
