const STATUS_STYLES = {
  en_attente: "bg-orange-100 text-orange-800",
  publiee: "bg-gray-100 text-gray-800",
  en_etude: "bg-blue-100 text-blue-800",
  acceptee: "bg-green-100 text-green-800",
  rejetee: "bg-red-100 text-red-800",
  mise_en_oeuvre: "bg-yellow-100 text-yellow-800",
  archivee: "bg-gray-200 text-gray-600",
};

export default function StatusBadge({ status, label }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || "bg-gray-100 text-gray-700"}`}>
      {label}
    </span>
  );
}
