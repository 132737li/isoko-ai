import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { formatBIF } from '../lib/currency';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

interface Product {
  id: string;
  name: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
}

export default function Products() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [threshold, setThreshold] = useState('5');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProducts = async () => {
    if (!user) return;
    let activeShopId = localStorage.getItem('active_shop_id');
    if (!activeShopId) {
      const { data } = await supabase.from('shop_members').select('shop_id').eq('user_id', user.id).limit(1).single();
      if (data) { activeShopId = data.shop_id; localStorage.setItem('active_shop_id', activeShopId!); }
    }
    if (activeShopId) {
      const { data } = await supabase.from('products').select('*').eq('shop_id', activeShopId).eq('is_archived', false).order('created_at', { ascending: false });
      if (data) setProducts(data);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [user]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    const activeShopId = localStorage.getItem('active_shop_id');
    if (!activeShopId) { setIsAdding(false); return; }

    const { data: existingProduct } = await supabase.from('products').select('*').eq('shop_id', activeShopId).eq('is_archived', false).ilike('name', name).maybeSingle();

    if (existingProduct) {
      const confirmUpdate = window.confirm(`Le produit "${existingProduct.name}" existe déjà. Voulez-vous ajouter la quantité à son stock actuel et mettre à jour ses prix ?`);
      if (confirmUpdate) {
        const newQuantity = existingProduct.quantity + parseFloat(quantity);
        const { error } = await supabase.from('products').update({ quantity: newQuantity, purchase_price: parseFloat(purchasePrice), selling_price: parseFloat(sellingPrice), low_stock_threshold: parseFloat(threshold) }).eq('id', existingProduct.id);
        if (error) alert("Erreur : " + error.message);
        else { setName(''); setPurchasePrice(''); setSellingPrice(''); setQuantity(''); await fetchProducts(); }
      }
      setIsAdding(false);
      return;
    }

    const { error } = await supabase.from('products').insert({ shop_id: activeShopId, name, purchase_price: parseFloat(purchasePrice), selling_price: parseFloat(sellingPrice), quantity: parseFloat(quantity), low_stock_threshold: parseFloat(threshold) });
    if (error) alert("Erreur : " + error.message);
    else { setName(''); setPurchasePrice(''); setSellingPrice(''); setQuantity(''); await fetchProducts(); }
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
    const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', id);
    if (!error) await fetchProducts();
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsUpdating(true);
    const { error } = await supabase.from('products').update({ name: editingProduct.name, purchase_price: editingProduct.purchase_price, selling_price: editingProduct.selling_price, quantity: editingProduct.quantity, low_stock_threshold: editingProduct.low_stock_threshold }).eq('id', editingProduct.id);
    if (error) alert("Erreur : " + error.message);
    else { setEditingProduct(null); await fetchProducts(); }
    setIsUpdating(false);
  };

  if (isLoading) return <div className="p-6">{t('loading')}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('products')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/dashboard" className="text-teal-600 hover:underline">{t('back_dashboard')}</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('add_product')}</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder={t('product_name')} required value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2 border rounded-lg" />
            <input type="number" placeholder={t('initial_qty')} required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="px-4 py-2 border rounded-lg" />
            <input type="number" placeholder={t('buy_price')} required value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="px-4 py-2 border rounded-lg" />
            <input type="number" placeholder={t('sell_price')} required value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="px-4 py-2 border rounded-lg" />
            <input type="number" placeholder={t('alert_threshold')} required value={threshold} onChange={(e) => setThreshold(e.target.value)} className="px-4 py-2 border rounded-lg" />
            <Button type="submit" isLoading={isAdding} className="md:col-span-2">{t('save_product')}</Button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="px-6 py-3">{t('product_name')}</th>
                <th className="px-6 py-3">{t('buy_price')}</th>
                <th className="px-6 py-3">{t('sell_price')}</th>
                <th className="px-6 py-3">{t('quantity')}</th>
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
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">{t('status_low_stock')}</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{t('status_in_stock')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-3">
                    <button onClick={() => setEditingProduct(p)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">{t('edit')}</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">{t('delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{t('edit')} : {editingProduct.name}</h2>
            <form onSubmit={handleUpdateProduct} className="flex flex-col gap-4">
              <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} required className="w-full px-4 py-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={editingProduct.purchase_price} onChange={(e) => setEditingProduct({...editingProduct, purchase_price: parseFloat(e.target.value)})} required className="w-full px-4 py-2 border rounded-lg" />
                <input type="number" value={editingProduct.selling_price} onChange={(e) => setEditingProduct({...editingProduct, selling_price: parseFloat(e.target.value)})} required className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={editingProduct.quantity} onChange={(e) => setEditingProduct({...editingProduct, quantity: parseFloat(e.target.value)})} required className="w-full px-4 py-2 border rounded-lg" />
                <input type="number" value={editingProduct.low_stock_threshold} onChange={(e) => setEditingProduct({...editingProduct, low_stock_threshold: parseFloat(e.target.value)})} required className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="w-1/2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">{t('cancel')}</button>
                <Button type="submit" isLoading={isUpdating} className="w-1/2">{t('save')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}