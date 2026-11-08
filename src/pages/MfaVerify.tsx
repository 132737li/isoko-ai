import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

export default function MfaVerify() {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp[0];
    
    if (!totpFactor) {
      setError("Aucun facteur MFA trouvé.");
      setIsLoading(false);
      return;
    }

    const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challenge.error) {
      setError(challenge.error.message);
      setIsLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challenge.data.id,
      code,
    });

    if (verifyError) {
      setError(t('mfa_invalid_code'));
      setIsLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-xl font-bold mb-2 text-center text-gray-800">{t('mfa_verify_title')}</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Entrez le code généré par votre application d'authentification.</p>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <input
            type="text" 
            placeholder="000000"
            maxLength={6}
            value={code} 
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full border p-3 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-teal-500 outline-none"
            required
          />
          <Button type="submit" isLoading={isLoading}>
            {t('mfa_verify')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-teal-600">
            ← {t('cancel')}
          </Link>
        </div>
      </div>
    </div>
  );
}