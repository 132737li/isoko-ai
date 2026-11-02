import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Landing() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Si l'application est déjà installée sur l'appareil
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Écouter l'événement du navigateur
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e); // On stocke l'événement pour l'utiliser plus tard
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Afficher la fenêtre d'installation native
    deferredPrompt.prompt();
    
    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold text-teal-700 mb-4">Isoko AI</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        L'application intelligente de gestion commerciale pour les boutiques au Burundi.
      </p>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Link to="/login">
          <Button className="w-full md:w-auto">Se connecter</Button>
        </Link>
        <Link to="/register">
          <Button variant="secondary" className="w-full md:w-auto">Créer un compte</Button>
        </Link>
      </div>

      {/* BOUTON D'INSTALLATION PWA */}
      {deferredPrompt && !isInstalled && (
        <button
          onClick={handleInstallClick}
          className="mt-8 flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg"
        >
          📱 Installer l'application sur cet appareil
        </button>
      )}
    </div>
  );
}