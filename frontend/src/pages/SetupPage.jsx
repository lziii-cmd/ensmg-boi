import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { checkSetup, setupSuperuser } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

export default function SetupPage() {
  const [checking, setChecking] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", password: "", password_confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkSetup()
      .then(({ data }) => {
        if (!data.setup_needed) {
          navigate("/login", { replace: true });
        } else {
          setSetupNeeded(true);
        }
      })
      .catch(() => navigate("/login", { replace: true }))
      .finally(() => setChecking(false));
  }, [navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await setupSuperuser(form);
      loginUser({ access: data.access, refresh: data.refresh }, data.user);
      setDone(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
    } catch (err) {
      const data = err.response?.data;
      if (data?.detail) {
        setError(data.detail);
      } else if (typeof data === "object") {
        const first = Object.values(data).flat()[0];
        setError(Array.isArray(first) ? first[0] : first || "Une erreur est survenue.");
      } else {
        setError("Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">💡</div>
          <p className="text-muted-foreground text-sm">Vérification...</p>
        </div>
      </div>
    );
  }

  if (!setupNeeded) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(221,83%,18%)] via-[hsl(221,83%,25%)] to-[hsl(221,60%,35%)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400/20 backdrop-blur mb-4">
            <ShieldCheck className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Initialisation</h1>
          <p className="text-blue-200 mt-1.5 text-sm">
            Créez le compte super-administrateur de la plateforme
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Compte super-administrateur</CardTitle>
            <CardDescription>
              Cette page est accessible une seule fois, tant qu'aucun super-admin n'existe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <p className="font-semibold text-lg">Plateforme initialisée !</p>
                <p className="text-muted-foreground text-sm">Redirection vers le tableau de bord...</p>
              </div>
            ) : (
              <>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="first_name">Prénom</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                        placeholder="Prénom"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="last_name">Nom</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                        placeholder="Nom"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Adresse email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="admin@ensmg.sn"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="8 caractères minimum"
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password_confirm">Confirmer le mot de passe</Label>
                    <Input
                      id="password_confirm"
                      name="password_confirm"
                      type="password"
                      value={form.password_confirm}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? "Création en cours..." : "Initialiser la plateforme"}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-blue-300 text-xs mt-6">
          Cette page disparaîtra automatiquement après l'initialisation
        </p>
      </div>
    </div>
  );
}
