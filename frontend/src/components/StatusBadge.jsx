import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS = {
  en_attente: "warning",
  publiee: "secondary",
  en_etude: "info",
  acceptee: "success",
  rejetee: "destructive",
  mise_en_oeuvre: "gold",
  archivee: "outline",
};

export default function StatusBadge({ status, label }) {
  return (
    <Badge variant={STATUS_VARIANTS[status] || "secondary"}>
      {label}
    </Badge>
  );
}
