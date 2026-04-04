import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReportedComments, moderateComment } from "../../api/ideas";
import { CheckCircle, Trash2 } from "lucide-react";

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Modération des commentaires</h1>

      {isLoading ? (
        <div className="card animate-pulse h-40" />
      ) : !comments?.length ? (
        <div className="card text-center py-12 text-gray-400">
          <CheckCircle size={40} className="mx-auto mb-2 text-green-400" />
          <p className="font-medium">Aucun commentaire signalé.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">{c.content}</p>
                  <p className="text-xs text-gray-500">
                    Par <strong>{c.author}</strong> sur l'idée «{" "}
                    <span className="text-blue-700">{c.idea_title}</span> »
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    {c.report_count} signalement(s)
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => moderateMutation.mutate({ id: c.id, action: "approve" })}
                    className="flex items-center gap-1 text-xs btn-secondary py-1.5 px-2"
                    title="Approuver"
                  >
                    <CheckCircle size={14} className="text-green-600" /> Approuver
                  </button>
                  <button
                    onClick={() => moderateMutation.mutate({ id: c.id, action: "delete" })}
                    className="flex items-center gap-1 text-xs btn-danger py-1.5 px-2"
                    title="Supprimer"
                  >
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
