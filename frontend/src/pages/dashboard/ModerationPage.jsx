import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReportedComments, moderateComment } from "@/api/ideas";
import { CheckCircle, Trash2, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ModerationPage() {
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["reported-comments"],
    queryFn: () => getReportedComments().then((r) => r.data),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }) => moderateComment(id, action),
    onSuccess: () => queryClient.invalidateQueries(["reported-comments"]),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Modération des commentaires</h1>
        <p className="text-muted-foreground mt-1">Traitez les commentaires signalés par les membres</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !comments?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
              <ShieldCheck size={32} className="text-green-500" />
            </div>
            <p className="font-semibold text-foreground">Tout est en ordre !</p>
            <p className="text-sm mt-1">Aucun commentaire signalé pour l'instant.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <Card key={c.id} className="border-orange-100">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Comment content */}
                    <p className="text-sm text-foreground leading-relaxed mb-2 p-3 bg-muted/50 rounded-md border-l-2 border-orange-300">
                      "{c.content}"
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        Par <strong className="text-foreground">{c.author}</strong>
                      </span>
                      <Separator orientation="vertical" className="h-3" />
                      <span>
                        Sur l'idée{" "}
                        <span className="text-primary font-medium">«{c.idea_title}»</span>
                      </span>
                      <Separator orientation="vertical" className="h-3" />
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        {c.report_count} signalement{c.report_count > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moderateMutation.mutate({ id: c.id, action: "approve" })}
                      disabled={moderateMutation.isPending}
                      className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                    >
                      {moderateMutation.isPending
                        ? <Loader2 size={13} className="mr-1.5 animate-spin" />
                        : <CheckCircle size={13} className="mr-1.5" />
                      }
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => moderateMutation.mutate({ id: c.id, action: "delete" })}
                      disabled={moderateMutation.isPending}
                    >
                      {moderateMutation.isPending
                        ? <Loader2 size={13} className="mr-1.5 animate-spin" />
                        : <Trash2 size={13} className="mr-1.5" />
                      }
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
