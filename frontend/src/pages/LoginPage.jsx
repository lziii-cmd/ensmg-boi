import { useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { login } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await login(email, password);
      loginUser({ access: data.access, refresh: data.refresh }, data.user);
    } catch (err) {
      setError(err.response?.data?.detail || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(221,83%,18%)] via-[hsl(221,83%,25%)] to-[hsl(221,60%,35%)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400/20 backdrop-blur mb-4">
            <span className="text-4xl">💡</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Boîte à Idées</h1>
          <p className="text-blue-200 mt-1.5 text-sm">
            École Nationale Supérieure des Mines et de la Géologie
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Connexion</CardTitle>
            <CardDescription>Entrez vos identifiants pour accéder à la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
              <Link to="/ensmg-init-platform" className="text-sm text-muted-foreground hover:underline">
                Première connexion ?
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-blue-300 text-xs mt-6">
          Accès réservé aux membres de l'ENSMG
        </p>
      </div>
    </div>
  );
}
