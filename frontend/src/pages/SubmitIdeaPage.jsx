import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCategories, createIdea } from "../api/ideas";

export default function SubmitIdeaPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    visibility: "public",
    is_confidential: false,
  });
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories().then((r) => r.data),
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("category_id", form.category_id);
    formData.append("visibility", form.visibility);
    formData.append("is_confidential", form.is_confidential);
    if (attachment) formData.append("attachment", attachment);

    try {
      await createIdea(formData);
      navigate("/my-ideas");
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.detail ||
        Object.values(data || {}).flat().join(" ") ||
        "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Soumettre une idée</h1>

      <div className="card">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="input"
              placeholder="5 à 100 caractères"
              minLength={5}
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description détaillée <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="input resize-none"
              rows={5}
              placeholder="Décrivez votre idée en détail (20 à 2000 caractères)"
              minLength={20}
              maxLength={2000}
              required
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {form.description.length} / 2000
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visibilité
            </label>
            <select
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              className="input"
            >
              <option value="public">Publique — visible par tous les membres</option>
              <option value="private">Privée — visible uniquement par vous et les responsables</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pièce jointe (facultatif)
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setAttachment(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX, JPG, PNG — max 5 Mo</p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="is_confidential"
              name="is_confidential"
              checked={form.is_confidential}
              onChange={handleChange}
              className="mt-0.5"
            />
            <label htmlFor="is_confidential" className="text-sm text-blue-800">
              <span className="font-medium">Soumettre en mode confidentiel</span>
              <br />
              <span className="text-blue-600">
                Votre nom ne sera pas visible par les autres membres. Les responsables et administrateurs
                peuvent toujours voir votre identité pour le suivi.
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Soumission..." : "Soumettre l'idée"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
