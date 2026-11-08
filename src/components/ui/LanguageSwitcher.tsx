import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { user } = useAuthStore();

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    
    if (user) {
      await supabase.from('profiles').update({ preferred_language: newLang }).eq('id', user.id);
    }
  };

  return (
    <select 
      value={i18n.language.split('-')[0]} 
      onChange={handleLanguageChange}
      className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer font-medium"
    >
      <option value="fr">🇫🇷 Français</option>
      <option value="rn">🇧🇮 Kirundi</option>
      <option value="sw">🇰🇪 Kiswahili</option>
      <option value="en">🇬🇧 English</option>
    </select>
  );
}