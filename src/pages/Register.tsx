import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => navigate('/login'), 3000);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-teal-700">{t('register_title')}</h2>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {message && <p className="text-teal-600 text-sm mb-4 text-center">{message}</p>}
        
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
          <Button type="submit" isLoading={isLoading}>{t('register')}</Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {t('already_account')} <Link to="/login" className="text-teal-600 hover:underline">{t('login')}</Link>
        </p>
        <Link to="/" className="text-gray-400 hover:text-gray-600 block text-center mt-2 text-sm">
          ← {t('dashboard')}
        </Link>
      </div>
    </div>
  );
}