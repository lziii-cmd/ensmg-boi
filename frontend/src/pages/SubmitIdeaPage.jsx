import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCategories, createIdea } from "@/api/ideas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, EyeOff, Paperclip } from "lucide-react";

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Soumettre une idée</h1>
        <p className="text-muted-foreground mt-1">
          Partagez vos propositions avec la communauté ENSMG
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wide text-xs">
            Formulaire de soumission
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="5 à 100 caractères"
                minLength={5}
                maxLength={100}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description détaillée <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Décrivez votre idée en détail (20 à 2000 caractères)"
                rows={5}
                minLength={20}
                maxLength={2000}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.description.length} / 2000
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Catégorie <span className="text-destructive">*</span></Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Visibilité</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(v) => setForm((f) => ({ ...f, visibility: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Publique</SelectItem>
                    <SelectItem value="private">Privée (responsables uniquement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Paperclip size={14} /> Pièce jointe (facultatif)
              </Label>
              <input
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setAttachment(e.target.files[0])}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">PDF, DOCX, JPG, PNG — max 5 Mo</p>
            </div>

            <Separator />

            {/* Confidential toggle */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <input
                type="checkbox"
                id="is_confidential"
                name="is_confidential"
                checked={form.is_confidential}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
              />
              <label htmlFor="is_confidential" className="text-sm cursor-pointer">
                <span className="font-semibold text-blue-900 flex items-center gap-1">
                  <EyeOff size={14} /> Soumettre en mode confidentiel
                </span>
                <span className="text-blue-700 mt-0.5 block">
                  Votre nom ne sera pas visible par les autres membres. Les responsables et
                  administrateurs peuvent toujours voir votre identité pour le suivi.
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={loading || !form.category_id}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Soumission..." : "Soumettre l'idée"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
