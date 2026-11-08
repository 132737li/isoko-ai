import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import i18n from '../lib/i18n';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      // Restaurer la langue de l'utilisateur
      const { data: profile } = await supabase.from('profiles').select('preferred_language').eq('id', data.user.id).single();
      if (profile?.preferred_language) {
        i18n.changeLanguage(profile.preferred_language);
      }
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-teal-700">{t('login')}</h2>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input type="email" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
          <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
          <Button type="submit" isLoading={isLoading}>{t('login')}</Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {t('no_account')} <Link to="/register" className="text-teal-600 hover:underline">{t('register')}</Link>
        </p>
        <Link to="/" className="text-gray-400 hover:text-gray-600 block text-center mt-2 text-sm">← {t('dashboard')}</Link>
      </div>
    </div>
  );
}