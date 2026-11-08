import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

export default function Landing() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <h1 className="text-4xl font-bold text-teal-700 mb-4">{t('app_name')}</h1>
      <p className="text-gray-600 mb-8 max-w-md">{t('welcome')}</p>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Link to="/login"><Button className="w-full md:w-auto">{t('login')}</Button></Link>
        <Link to="/register"><Button variant="secondary" className="w-full md:w-auto">{t('register')}</Button></Link>
      </div>

      {deferredPrompt && !isInstalled && (
        <button onClick={handleInstallClick} className="mt-8 flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg">
          📱 {t('install_app')}
        </button>
      )}
    </div>
  );
}