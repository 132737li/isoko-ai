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
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
}

export default function Products() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // États du formulaire d'ajout
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [threshold, setThreshold] = useState('5');

  // NOUVEAUX ÉTATS : Pour la modification
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProducts = async () => {
    if (!user) return;
    
    const { data: memberData } = await supabase
      .from('shop_members').select('shop_id').eq('user_id', user.id).single();

    if (memberData) {
      const { data, error } = await supabase
        .from('products').select('*')
        .eq('shop_id', memberData.shop_id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (!error && data) setProducts(data);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [user]);

  // --- LOGIQUE D'AJOUT (avec anti-doublon) ---
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    const { data: memberData } = await supabase
      .from('shop_members').select('shop_id').eq('user_id', user?.id).single();

    if (!memberData) return alert("Erreur : Aucune boutique trouvée.");

    const { data: existingProduct } = await supabase
      .from('products').select('*').eq('shop_id', memberData.shop_id)
      .eq('is_archived', false).ilike('name', name).maybeSingle();

    if (existingProduct) {
      const confirmUpdate = window.confirm(
        `Le produit "${existingProduct.name}" existe déjà (Stock actuel : ${existingProduct.quantity}).\n\nVoulez-vous ajouter la quantité (${quantity}) à son stock actuel et mettre à jour ses prix ?`
      );

      if (confirmUpdate) {
        const newQuantity = existingProduct.quantity + parseFloat(quantity);
        const { error } = await supabase.from('products').update({
            quantity: newQuantity,
            purchase_price: parseFloat(purchasePrice),
            selling_price: parseFloat(sellingPrice),
            low_stock_threshold: parseFloat(threshold),
          }).eq('id', existingProduct.id);

        if (error) alert("Erreur : " + error.message);
        else {
          alert("Produit mis à jour avec succès !");
          setName(''); setPurchasePrice(''); setSellingPrice(''); setQuantity('');
          await fetchProducts();
        }
      }
      setIsAdding(false);
      return;
    }

    const { error } = await supabase.from('products').insert({
      shop_id: memberData.shop_id, name,
      purchase_price: parseFloat(purchasePrice), selling_price: parseFloat(sellingPrice),
      quantity: parseFloat(quantity), low_stock_threshold: parseFloat(threshold),
    });

    if (error) alert("Erreur lors de l'ajout : " + error.message);
    else {
      setName(''); setPurchasePrice(''); setSellingPrice(''); setQuantity('');
      await fetchProducts();
    }
    setIsAdding(false);
  };

  // --- LOGIQUE DE SUPPRESSION ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
    const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', id);
    if (!error) await fetchProducts();
  };

  // --- NOUVELLE LOGIQUE : SAUVEGARDER LA MODIFICATION ---
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsUpdating(true);

    const { error } = await supabase
      .from('products')
      .update({
        name: editingProduct.name,
        purchase_price: editingProduct.purchase_price,
        selling_price: editingProduct.selling_price,
        quantity: editingProduct.quantity,
        low_stock_threshold: editingProduct.low_stock_threshold,
      })
      .eq('id', editingProduct.id);

    if (error) {
      if (error.code === '23505') { // Code d'erreur pour violation d'unicité
        alert("Erreur : Un autre produit porte déjà ce nom.");
      } else {
        alert("Erreur lors de la modification : " + error.message);
      }
    } else {
      setEditingProduct(null); // Fermer la modale
      await fetchProducts();
    }
    setIsUpdating(false);
  };

  if (isLoading) return <div className="p-6">Chargement des produits...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mes Produits</h1>
          <Link to="/dashboard" className="text-teal-600 hover:underline">← Retour au Dashboard</Link>
        </div>

        {/* Formulaire d'ajout */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Ajouter un nouveau produit</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nom du produit" required value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
            <input type="number" placeholder="Quantité initiale" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
            <input type="number" placeholder="Prix d'achat (BIF)" required value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
            <input type="number" placeholder="Prix de vente (BIF)" required value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
            <input type="number" placeholder="Seuil d'alerte" required value={threshold} onChange={(e) => setThreshold(e.target.value)} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
            <Button type="submit" isLoading={isAdding} className="md:col-span-2">Enregistrer le produit</Button>
          </form>
        </div>

        {/* Liste des produits */}
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="px-6 py-3">Produit</th>
                <th className="px-6 py-3">Prix d'achat</th>
                <th className="px-6 py-3">Prix de vente</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-gray-600">{formatBIF(p.purchase_price)}</td>
                  <td className="px-6 py-4 text-teal-600 font-medium">{formatBIF(p.selling_price)}</td>
                  <td className="px-6 py-4">{p.quantity}</td>
                  <td className="px-6 py-4">
                    {p.quantity <= p.low_stock_threshold ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Stock faible</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">En stock</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-3">
                    {/* NOUVEAU BOUTON MODIFIER */}
                    <button onClick={() => setEditingProduct(p)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALE DE MODIFICATION --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Modifier : {editingProduct.name}</h2>
            
            <form onSubmit={handleUpdateProduct} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nom du produit</label>
                <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Prix d'achat (BIF)</label>
                  <input type="number" value={editingProduct.purchase_price} onChange={(e) => setEditingProduct({...editingProduct, purchase_price: parseFloat(e.target.value)})} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Prix de vente (BIF)</label>
                  <input type="number" value={editingProduct.selling_price} onChange={(e) => setEditingProduct({...editingProduct, selling_price: parseFloat(e.target.value)})} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Stock actuel</label>
                  <input type="number" value={editingProduct.quantity} onChange={(e) => setEditingProduct({...editingProduct, quantity: parseFloat(e.target.value)})} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Seuil d'alerte</label>
                  <input type="number" value={editingProduct.low_stock_threshold} onChange={(e) => setEditingProduct({...editingProduct, low_stock_threshold: parseFloat(e.target.value)})} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="w-1/2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300">
                  Annuler
                </button>
                <Button type="submit" isLoading={isUpdating} className="w-1/2">
                  Sauvegarder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}