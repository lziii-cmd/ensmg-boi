import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, Send, Flag, ArrowLeft, Pin, Loader2 } from "lucide-react";
import { getIdea, voteIdea, addComment, reportComment, updateIdeaStatus, pinIdea } from "@/api/ideas";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "publiee", label: "Publier" },
  { value: "en_etude", label: "Mettre en étude" },
  { value: "acceptee", label: "Accepter" },
  { value: "rejetee", label: "Rejeter" },
  { value: "mise_en_oeuvre", label: "Mise en œuvre" },
  { value: "archivee", label: "Archiver" },
];

export default function IdeaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const queryClient = useQueryClient();

  const [comment, setComment] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [officialResponse, setOfficialResponse] = useState("");
  const [showStatusForm, setShowStatusForm] = useState(false);

  const { data: idea, isLoading } = useQuery({
    queryKey: ["idea", id],
    queryFn: () => getIdea(id).then((r) => r.data),
  });

  const voteMutation = useMutation({
    mutationFn: () => voteIdea(id),
    onSuccess: () => queryClient.invalidateQueries(["idea", id]),
  });

  const commentMutation = useMutation({
    mutationFn: () => addComment(id, comment),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries(["idea", id]);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (data) => updateIdeaStatus(id, data),
    onSuccess: () => {
      setShowStatusForm(false);
      setNewStatus("");
      setStatusComment("");
      setOfficialResponse("");
      queryClient.invalidateQueries(["idea", id]);
    },
  });

  const pinMutation = useMutation({
    mutationFn: () => pinIdea(id),
    onSuccess: () => queryClient.invalidateQueries(["idea", id]),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-24" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!idea) return (
    <div className="text-center py-16 text-muted-foreground">Idée introuvable.</div>
  );

  const visibleComments = idea.comments?.filter((c) => !c.is_hidden) || [];

  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft size={16} className="mr-1" /> Retour
      </Button>

      {/* Main card */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <StatusBadge status={idea.status} label={idea.status_display} />
            <Badge variant="info">{idea.category?.name}</Badge>
            {idea.is_pinned && <Badge variant="gold">Épinglée</Badge>}
            {idea.visibility === "private" && <Badge variant="outline">Privée</Badge>}
          </div>

          <h1 className="text-xl font-bold text-foreground mb-2">{idea.title}</h1>

          <p className="text-sm text-muted-foreground mb-5">
            Par <span className="font-medium text-foreground/80">{idea.author_name}</span>
            {" · "}
            {new Date(idea.created_at).toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric"
            })}
          </p>

          <p className="text-foreground whitespace-pre-wrap leading-relaxed">{idea.description}</p>

          {idea.attachment && (
            <a
              href={idea.attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4"
            >
              Voir la pièce jointe
            </a>
          )}

          {idea.official_response && (
            <Alert variant="info" className="mt-5">
              <AlertDescription>
                <p className="font-semibold mb-1">Réponse officielle</p>
                {idea.official_response}
              </AlertDescription>
            </Alert>
          )}

          {idea.rejection_reason && (
            <Alert variant="destructive" className="mt-5">
              <AlertDescription>
                <p className="font-semibold mb-1">Motif de rejet</p>
                {idea.rejection_reason}
              </AlertDescription>
            </Alert>
          )}

          <Separator className="mt-6 mb-4" />

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={idea.user_has_voted ? "default" : "outline"}
              size="sm"
              onClick={() => voteMutation.mutate()}
              disabled={voteMutation.isPending}
            >
              <ThumbsUp
                size={15}
                className={cn("mr-1.5", idea.user_has_voted && "fill-current")}
              />
              {idea.vote_count} vote{idea.vote_count !== 1 ? "s" : ""}
            </Button>

            {canManage && (
              <>
                <Button
                  size="sm"
                  variant={showStatusForm ? "default" : "secondary"}
                  onClick={() => setShowStatusForm(!showStatusForm)}
                >
                  Changer le statut
                </Button>
                <Button
                  size="sm"
                  variant={idea.is_pinned ? "secondary" : "outline"}
                  onClick={() => pinMutation.mutate()}
                  title={idea.is_pinned ? "Désépingler" : "Épingler"}
                >
                  <Pin size={15} className={cn(idea.is_pinned && "fill-current")} />
                </Button>
              </>
            )}
          </div>

          {/* Status form */}
          {showStatusForm && canManage && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3 border border-border">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un nouveau statut..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder={newStatus === "rejetee" ? "Motif du rejet (obligatoire)" : "Commentaire (optionnel)"}
                rows={3}
                className="resize-none"
              />
              <Textarea
                value={officialResponse}
                onChange={(e) => setOfficialResponse(e.target.value)}
                placeholder="Réponse officielle (optionnel)"
                rows={2}
                className="resize-none"
              />
              {statusMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {statusMutation.error.response?.data?.comment?.[0] || "Une erreur est survenue."}
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => statusMutation.mutate({
                    status: newStatus,
                    comment: statusComment,
                    official_response: officialResponse,
                  })}
                  disabled={!newStatus || statusMutation.isPending}
                >
                  {statusMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Confirmer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowStatusForm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status history */}
      {idea.status_history?.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2 pt-5 px-6">
            <h2 className="font-semibold text-foreground">Historique des statuts</h2>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="space-y-2">
              {idea.status_history.map((h) => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {new Date(h.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  <span>
                    <span className="font-medium">{h.new_status_display}</span>
                    {h.comment && <span className="text-muted-foreground"> — {h.comment}</span>}
                    <span className="text-muted-foreground/70"> par {h.changed_by_name}</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-6">
          <h2 className="font-semibold text-foreground">
            Commentaires ({visibleComments.length})
          </h2>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-4 mb-6">
            {visibleComments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun commentaire pour l'instant.</p>
            ) : (
              visibleComments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {c.author_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{c.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{c.content}</p>
                    <button
                      onClick={() => reportComment(c.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive mt-1.5 transition-colors"
                    >
                      <Flag size={11} /> Signaler
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Separator className="mb-4" />

          <div className="flex gap-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="resize-none flex-1"
              rows={2}
              maxLength={1000}
            />
            <Button
              size="icon"
              onClick={() => commentMutation.mutate()}
              disabled={!comment.trim() || commentMutation.isPending}
              className="self-end"
            >
              {commentMutation.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <Send size={16} />
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
