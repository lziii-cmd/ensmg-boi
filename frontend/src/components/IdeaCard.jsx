import { Link } from "react-router-dom";
import { ThumbsUp, MessageSquare, Lock, Pin } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function IdeaCard({ idea }) {
  return (
    <Link
      to={`/ideas/${idea.id}`}
      className="card hover:shadow-md transition-shadow block group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={idea.status} label={idea.status_display} />
          <span className="badge bg-blue-50 text-blue-700">{idea.category_name}</span>
          {idea.is_pinned && <Pin size={14} className="text-yellow-600" />}
          {idea.visibility === "private" && <Lock size={14} className="text-gray-400" />}
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 group-hover:text-blue-800 transition-colors mb-1 line-clamp-2">
        {idea.title}
      </h3>

      <p className="text-sm text-gray-500 mb-4">
        Par <span className="font-medium">{idea.author_name}</span> ·{" "}
        {new Date(idea.created_at).toLocaleDateString("fr-FR")}
      </p>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <ThumbsUp size={14} className={idea.user_has_voted ? "text-blue-600 fill-blue-600" : ""} />
          {idea.vote_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={14} />
          {idea.comment_count}
        </span>
      </div>
    </Link>
  );
}
