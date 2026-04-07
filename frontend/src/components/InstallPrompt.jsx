import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Bannière d'installation PWA.
 * Apparaît automatiquement quand le navigateur déclenche
 * l'événement `beforeinstallprompt` (Android Chrome).
 */
export default function InstallPrompt() {
  const [prompt, setPrompt]   = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      // N'afficher que si l'utilisateur ne l'a pas déjà refusé
      const dismissed = sessionStorage.getItem("pwa-dismissed");
      if (!dismissed) setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-[#1F4E79] text-white rounded-xl shadow-2xl p-4 flex items-start gap-3">
        <img
          src="/icons/icon-96.png"
          alt="Icône"
          className="w-12 h-12 rounded-lg flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">
            Installer l'application
          </p>
          <p className="text-xs text-blue-200 mt-0.5 leading-tight">
            Accédez à la Boîte à Idées ENSMG depuis votre écran d'accueil.
          </p>
          <Button
            size="sm"
            onClick={handleInstall}
            className="mt-2 bg-white text-[#1F4E79] hover:bg-blue-50 h-7 text-xs font-semibold px-3"
          >
            <Download size={13} className="mr-1" />
            Installer
          </Button>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-200 hover:text-white flex-shrink-0 -mt-0.5"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
