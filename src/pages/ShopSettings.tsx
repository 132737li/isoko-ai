import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ShopSettings() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchShop = async () => {
      if (!user) return;
      let activeShopId = localStorage.getItem('active_shop_id');
      
      if (!activeShopId) {
        const { data } = await supabase.from('shop_members').select('shop_id').eq('user_id', user.id).limit(1).single();
        if (data) { activeShopId = data.shop_id; localStorage.setItem('active_shop_id', activeShopId!); }
      }

      if (activeShopId) {
        const { data } = await supabase
          .from('shops')
          .select('id, name, address, whatsapp_number')
          .eq('id', activeShopId)
          .single();

        if (data) {
          setShopId(data.id);
          setShopName(data.name);
          setShopAddress(data.address || '');
          setWhatsappNumber(data.whatsapp_number || '');
        }
      }
      setIsLoading(false);
    };
    fetchShop();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setIsSaving(true);
    setMessage('');

    // Nettoyer le numéro (retirer les espaces, tirets et le +)
    const cleanWhatsapp = whatsappNumber.replace(/[\s\-+]/g, '');

    const { error } = await supabase
      .from('shops')
      .update({ 
        name: shopName,
        address: shopAddress,
        whatsapp_number: cleanWhatsapp
      })
      .eq('id', shopId);

    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setMessage("Boutique mise à jour avec succès !");
      setTimeout(() => setMessage(''), 3000);
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-6">{t('loading')}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('settings')}</h1>
          <Link to="/dashboard" className="text-teal-600 hover:underline">{t('back_dashboard')}</Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          {message && (
            <div className={`p-4 mb-4 rounded-lg ${message.includes('Erreur') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('shop_name')}</label>
              <input
                type="text" required
                value={shopName} onChange={(e) => setShopName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('shop_address')}</label>
              <input
                type="text"
                value={shopAddress} onChange={(e) => setShopAddress(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('whatsapp_number')}</label>
              <input
                type="text"
                value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="257 79 000 000"
              />
              <p className="text-xs text-gray-500 mt-1">Indiquez l'indicatif du pays (ex: 257 pour le Burundi).</p>
            </div>

            <Button type="submit" isLoading={isSaving} className="mt-4">
              {t('save_settings')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}