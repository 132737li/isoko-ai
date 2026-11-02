import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export default function ShopSettings() {
  const { user } = useAuthStore();
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchShop = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('shop_members')
        .select('shop_id, shops(name, address)')
        .eq('user_id', user.id)
        .single();

      if (data && data.shops) {
        setShopId(data.shop_id);
        // @ts-ignore (Supabase renvoie un objet pour la jointure)
        setShopName(data.shops.name);
        // @ts-ignore
        setShopAddress(data.shops.address || '');
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

    const { error } = await supabase
      .from('shops')
      .update({ 
        name: shopName,
        address: shopAddress
      })
      .eq('id', shopId);

    if (error) {
      setMessage("Erreur lors de la sauvegarde : " + error.message);
    } else {
      setMessage("Boutique mise à jour avec succès !");
      // On recharge la page après 1.5s pour mettre à jour le nom dans l'en-tête
      setTimeout(() => window.location.reload(), 1500);
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Paramètres de la boutique</h1>
          <Link to="/dashboard" className="text-teal-600 hover:underline">← Dashboard</Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          {message && (
            <div className={`p-4 mb-4 rounded-lg ${message.includes('Erreur') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
              <input
                type="text" required
                value={shopName} onChange={(e) => setShopName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Ex: Épicerie du Coin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse / Localisation</label>
              <input
                type="text"
                value={shopAddress} onChange={(e) => setShopAddress(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Ex: Marché de Bujumbura, Avenue de la Paix"
              />
            </div>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mt-2">
              💡 <strong>Information :</strong> La devise est configurée sur le Franc Burundais (BIF) par défaut pour toutes les boutiques.
            </div>

            <Button type="submit" isLoading={isSaving} className="mt-4">
              Enregistrer les modifications
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}