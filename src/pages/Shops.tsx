import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

export default function Shops() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const activeShopId = localStorage.getItem('active_shop_id');

  const fetchShops = async () => {
    if (!user) return;
    const { data } = await supabase.from('shop_members').select('shop_id, shops(id, name, address)').eq('user_id', user.id);
    if (data) {
      const formattedShops = data.map(d => ({ id: d.shop_id, name: (d.shops as any).name, address: (d.shops as any).address }));
      setShops(formattedShops);
      if (!localStorage.getItem('active_shop_id') && formattedShops.length > 0) {
        localStorage.setItem('active_shop_id', formattedShops[0].id); window.location.reload();
      }
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchShops(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setIsCreating(true);
    const { data, error } = await supabase.rpc('create_shop', { p_name: name, p_address: address });
    if (error) alert("Erreur : " + error.message);
    else { alert("Boutique créée !"); localStorage.setItem('active_shop_id', data); window.location.reload(); }
    setIsCreating(false);
  };

  const handleSelect = (id: string) => { localStorage.setItem('active_shop_id', id); window.location.reload(); };

  if (isLoading) return <div className="p-6">{t('loading')}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('my_shops')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/dashboard" className="text-teal-600 hover:underline">{t('back_dashboard')}</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">{t('my_shops')}</h2>
            {shops.length === 0 ? <p className="text-gray-500">{t('no_shop')}</p> : (
              <div className="flex flex-col gap-3">
                {shops.map(shop => (
                  <div key={shop.id} className={`p-4 border rounded-lg flex justify-between items-center ${activeShopId === shop.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}>
                    <div>
                      <h3 className="font-bold text-gray-800">{shop.name}</h3>
                      <p className="text-sm text-gray-500">{shop.address || '-'}</p>
                    </div>
                    {activeShopId === shop.id ? (
                      <span className="text-xs font-bold text-teal-600 bg-teal-100 px-2 py-1 rounded">{t('active_shop')}</span>
                    ) : (
                      <button onClick={() => handleSelect(shop.id)} className="text-sm text-teal-600 hover:underline">{t('select_shop')}</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm h-fit">
            <h2 className="text-lg font-semibold mb-4">{t('create_shop')}</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder={t('shop_name')} />
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder={t('shop_address')} />
              <Button type="submit" isLoading={isCreating}>{t('create_shop')}</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}