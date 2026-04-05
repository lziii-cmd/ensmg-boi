import { Link } from "react-router-dom";
import { ThumbsUp, MessageSquare, Lock, Pin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "./StatusBadge";
import { cn } from "@/lib/utils";

export default function IdeaCard({ idea }) {
  return (
    <Link to={`/ideas/${idea.id}`} className="block group">
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-border/60">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusBadge status={idea.status} label={idea.status_display} />
              <Badge variant="info">{idea.category_name}</Badge>
              {idea.is_pinned && (
                <span className="inline-flex items-center gap-0.5 text-yellow-600">
                  <Pin size={12} />
                </span>
              )}
              {idea.visibility === "private" && (
                <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                  <Lock size={12} />
                </span>
              )}
            </div>
          </div>

          <h3 className={cn(
            "font-semibold text-foreground line-clamp-2 mb-1.5 transition-colors",
            "group-hover:text-primary"
          )}>
            {idea.title}
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            Par <span className="font-medium text-foreground/80">{idea.author_name}</span>
            {" · "}
            {new Date(idea.created_at).toLocaleDateString("fr-FR")}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t border-border/50">
            <span className="flex items-center gap-1.5">
              <ThumbsUp
                size={14}
                className={cn(idea.user_has_voted && "text-primary fill-primary")}
              />
              <span className={cn(idea.user_has_voted && "text-primary font-medium")}>
                {idea.vote_count}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare size={14} />
              {idea.comment_count}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
