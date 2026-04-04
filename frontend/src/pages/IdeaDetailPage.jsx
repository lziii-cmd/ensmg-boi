import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, Send, Flag, ArrowLeft, Pin } from "lucide-react";
import { getIdea, voteIdea, addComment, reportComment, updateIdeaStatus, pinIdea } from "../api/ideas";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

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
      queryClient.invalidateQueries(["idea", id]);
    },
  });

  const pinMutation = useMutation({
    mutationFn: () => pinIdea(id),
    onSuccess: () => queryClient.invalidateQueries(["idea", id]),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card animate-pulse h-64" />
      </div>
    );
  }

  if (!idea) return <div className="text-center py-16 text-gray-400">Idée introuvable.</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      {/* Main card */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <StatusBadge status={idea.status} label={idea.status_display} />
          <span className="badge bg-blue-50 text-blue-700">{idea.category?.name}</span>
          {idea.is_pinned && <span className="badge bg-yellow-100 text-yellow-800">Épinglée</span>}
          {idea.visibility === "private" && <span className="badge bg-gray-100 text-gray-600">Privée</span>}
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">{idea.title}</h1>

        <div className="text-sm text-gray-500 mb-4">
          Par <span className="font-medium">{idea.author_name}</span> ·{" "}
          {new Date(idea.created_at).toLocaleDateString("fr-FR", {
            day: "numeric", month: "long", year: "numeric"
          })}
        </div>

        <p className="text-gray-700 whitespace-pre-wrap mb-6">{idea.description}</p>

        {idea.attachment && (
          <a
            href={idea.attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Voir la pièce jointe
          </a>
        )}

        {idea.official_response && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-800 mb-1">Réponse officielle</p>
            <p className="text-sm text-blue-700">{idea.official_response}</p>
          </div>
        )}

        {idea.rejection_reason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-800 mb-1">Motif de rejet</p>
            <p className="text-sm text-red-700">{idea.rejection_reason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => voteMutation.mutate()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              idea.user_has_voted
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ThumbsUp size={16} className={idea.user_has_voted ? "fill-blue-800" : ""} />
            {idea.vote_count} vote{idea.vote_count !== 1 ? "s" : ""}
          </button>

          {canManage && (
            <>
              <button
                onClick={() => setShowStatusForm(!showStatusForm)}
                className="btn-primary text-sm py-2"
              >
                Changer le statut
              </button>
              <button
                onClick={() => pinMutation.mutate()}
                className={`p-2 rounded-lg transition-colors ${
                  idea.is_pinned ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title={idea.is_pinned ? "Désépingler" : "Épingler"}
              >
                <Pin size={16} />
              </button>
            </>
          )}
        </div>

        {/* Status update form */}
        {showStatusForm && canManage && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="input"
            >
              <option value="">Choisir un statut</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <textarea
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              placeholder={newStatus === "rejetee" ? "Motif du rejet (obligatoire)" : "Commentaire (optionnel)"}
              className="input resize-none"
              rows={3}
            />
            <textarea
              value={officialResponse}
              onChange={(e) => setOfficialResponse(e.target.value)}
              placeholder="Réponse officielle (optionnel)"
              className="input resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={() => statusMutation.mutate({ status: newStatus, comment: statusComment, official_response: officialResponse })}
                disabled={!newStatus || statusMutation.isLoading}
                className="btn-primary text-sm"
              >
                {statusMutation.isLoading ? "Enregistrement..." : "Confirmer"}
              </button>
              <button onClick={() => setShowStatusForm(false)} className="btn-secondary text-sm">
                Annuler
              </button>
            </div>
            {statusMutation.error && (
              <p className="text-red-600 text-sm">
                {statusMutation.error.response?.data?.comment?.[0] || "Erreur."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Status history */}
      {idea.status_history?.length > 0 && (
        <div className="card mb-4">
          <h2 className="font-semibold text-gray-800 mb-3">Historique des statuts</h2>
          <div className="space-y-2">
            {idea.status_history.map((h) => (
              <div key={h.id} className="flex gap-3 text-sm">
                <span className="text-gray-400 shrink-0">
                  {new Date(h.created_at).toLocaleDateString("fr-FR")}
                </span>
                <span>
                  <span className="font-medium">{h.new_status_display}</span>
                  {h.comment && <span className="text-gray-500"> — {h.comment}</span>}
                  <span className="text-gray-400"> par {h.changed_by_name}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">
          Commentaires ({idea.comments?.filter((c) => !c.is_hidden).length || 0})
        </h2>

        <div className="space-y-4 mb-6">
          {idea.comments?.filter((c) => !c.is_hidden).map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold text-sm shrink-0">
                {c.author_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{c.author_name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{c.content}</p>
                <button
                  onClick={() => reportComment(c.id)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 mt-1 transition-colors"
                >
                  <Flag size={12} /> Signaler
                </button>
              </div>
            </div>
          ))}

          {idea.comments?.filter((c) => !c.is_hidden).length === 0 && (
            <p className="text-sm text-gray-400">Aucun commentaire pour l'instant.</p>
          )}
        </div>

        {/* Add comment */}
        <div className="flex gap-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="input resize-none flex-1"
            rows={2}
            maxLength={1000}
          />
          <button
            onClick={() => commentMutation.mutate()}
            disabled={!comment.trim() || commentMutation.isLoading}
            className="btn-primary px-3 self-end"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
