import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { formatBIF } from '../lib/currency';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  purchase_price: number;
  quantity: number;
}

export default function Purchases() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  
  // États du formulaire
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplier, setSupplier] = useState('');
  
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    if (!user) return;
    
    const { data: memberData } = await supabase
      .from('shop_members').select('shop_id').eq('user_id', user.id).single();
      
    if (memberData) {
      setShopId(memberData.shop_id);
      const { data } = await supabase
        .from('products').select('id, name, purchase_price, quantity')
        .eq('shop_id', memberData.shop_id).eq('is_archived', false);
      if (data) setProducts(data);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  // Quand on choisit un produit, on pré-remplit le prix d'achat habituel
  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const product = products.find(p => p.id === id);
    if (product) {
      setUnitCost(product.purchase_price.toString());
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !selectedProductId) return;
    
    setIsPurchasing(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase.rpc('make_purchase', {
      p_shop_id: shopId,
      p_product_id: selectedProductId,
      p_quantity: parseFloat(quantity),
      p_unit_cost: parseFloat(unitCost),
      p_supplier_name: supplier || 'Fournisseur inconnu'
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Achat enregistré, stock mis à jour !' });
      setQuantity(''); setSupplier('');
      await fetchData(); // Recharger les produits
    }
    setIsPurchasing(false);
  };

  const totalCost = parseFloat(quantity || '0') * parseFloat(unitCost || '0');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Réapprovisionnement</h1>
          <Link to="/dashboard" className="text-teal-600 hover:underline">← Dashboard</Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          {message.text && (
            <div className={`p-4 mb-4 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handlePurchase} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produit à réapprovisionner</label>
              <select 
                value={selectedProductId} 
                onChange={(e) => handleProductChange(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Choisir un produit --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock actuel: {p.quantity})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité reçue</label>
                <input
                  type="number" min="1" step="0.1" placeholder="Ex: 50"
                  value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coût unitaire (BIF)</label>
                <input
                  type="number" min="0" placeholder="Ex: 800"
                  value={unitCost} onChange={(e) => setUnitCost(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du fournisseur (optionnel)</label>
              <input
                type="text" placeholder="Ex: Brasimba, Importateur, etc."
                value={supplier} onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {totalCost > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
                <span className="font-medium text-gray-700">Dépense totale :</span>
                <span className="text-xl font-bold text-red-600">- {formatBIF(totalCost)}</span>
              </div>
            )}

            <Button type="submit" isLoading={isPurchasing} className="mt-2">
              Valider l'achat
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}