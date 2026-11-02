import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { formatBIF } from '../lib/currency';
import { Link } from 'react-router-dom';
import { db } from '../lib/offline-db'; // <-- Nouvel import
import { useOfflineSync } from '../hooks/useOfflineSync'; // <-- Nouvel import

interface Product {
  id: string;
  name: string;
  selling_price: number;
  quantity: number;
}

export default function Sales() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isSelling, setIsSelling] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Utilisation du hook de synchronisation
  const { isOnline, pendingCount, isSyncing, syncSales } = useOfflineSync();

  const fetchData = async () => {
    if (!user) return;
    
    const { data: memberData } = await supabase
      .from('shop_members').select('shop_id').eq('user_id', user.id).single();
      
    if (memberData) {
      setShopId(memberData.shop_id);
      // Si on est hors ligne, on ne peut pas récupérer les produits de Supabase
      if (navigator.onLine) {
        const { data } = await supabase
          .from('products').select('id, name, selling_price, quantity')
          .eq('shop_id', memberData.shop_id).eq('is_archived', false).gt('quantity', 0);
        if (data) setProducts(data);
      }
    }
  };

  useEffect(() => { 
    fetchData(); 
    // Recharger les données quand la connexion revient
    if (isOnline) fetchData();
  }, [user, isOnline]);

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !selectedProductId) return;
    
    setIsSelling(true);
    setMessage({ type: '', text: '' });

    const qty = parseFloat(quantity);

    if (navigator.onLine) {
      // MODE EN LIGNE : Appel de la fonction SQL sécurisée
      const { error } = await supabase.rpc('make_sale', {
        p_shop_id: shopId,
        p_product_id: selectedProductId,
        p_quantity: qty,
        p_payment_method: 'cash'
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Vente enregistrée avec succès !' });
        setQuantity('1'); setSelectedProductId('');
        await fetchData();
      }
    } else {
      // MODE HORS LIGNE : Sauvegarde dans IndexedDB
      await db.pendingSales.add({
        id: crypto.randomUUID(), // Génère un ID unique
        shop_id: shopId,
        product_id: selectedProductId,
        quantity: qty,
        payment_method: 'cash',
        created_at: new Date().toISOString()
      });

      // Mise à jour visuelle locale du stock pour que le commerçant voie la baisse
      setProducts(prev => prev.map(p => 
        p.id === selectedProductId ? { ...p, quantity: p.quantity - qty } : p
      ));

      setMessage({ type: 'success', text: 'Mode Hors-Ligne : Vente enregistrée localement.' });
      setQuantity('1'); setSelectedProductId('');
    }
    
    setIsSelling(false);
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const totalAmount = selectedProduct ? selectedProduct.selling_price * parseFloat(quantity || '0') : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Enregistrer une vente</h1>
          <Link to="/dashboard" className="text-teal-600 hover:underline">← Dashboard</Link>
        </div>

        {/* BANDEAU HORS LIGNE / SYNCHRONISATION */}
        {!isOnline && (
          <div className="bg-orange-100 text-orange-800 p-3 rounded-lg mb-4 text-sm font-medium flex items-center gap-2">
            ⚠️ Vous êtes hors ligne. Les ventes seront sauvegardées localement.
          </div>
        )}
        {pendingCount > 0 && (
          <div className="bg-blue-100 text-blue-800 p-3 rounded-lg mb-4 text-sm font-medium flex justify-between items-center">
            <span>📦 {pendingCount} vente(s) en attente de synchronisation.</span>
            <button onClick={syncSales} disabled={!isOnline || isSyncing} className="underline disabled:opacity-50">
              {isSyncing ? 'Synchro...' : 'Synchroniser'}
            </button>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm">
          {message.text && (
            <div className={`p-4 mb-4 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSale} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produit</label>
              <select 
                value={selectedProductId} 
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Choisir un produit --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.quantity} en stock) - {formatBIF(p.selling_price)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
              <input
                type="number" min="1" step="0.1"
                value={quantity} onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {selectedProduct && (
              <div className="bg-teal-50 p-4 rounded-lg flex justify-between items-center border border-teal-100">
                <span className="font-medium text-teal-800">Total à payer :</span>
                <span className="text-2xl font-bold text-teal-600">{formatBIF(totalAmount)}</span>
              </div>
            )}

            <Button type="submit" isLoading={isSelling} className="mt-2">
              Valider la vente
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}