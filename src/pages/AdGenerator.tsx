import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export default function AdGenerator() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [platform, setPlatform] = useState('WhatsApp');
  const [adText, setAdText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: memberData } = await supabase.from('shop_members').select('shop_id').eq('user_id', user?.id).single();
      if (memberData) {
        const { data } = await supabase.from('products').select('*').eq('shop_id', memberData.shop_id).eq('is_archived', false);
        if (data) setProducts(data);
      }
    };
    fetchProducts();
  }, [user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAdText('');

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const prompt = `Rédige une publicité courte et accrocheuse en français pour ${platform} pour mon produit : "${product.name}", au prix de ${product.selling_price} FBu. Le ton doit être amical et commercial pour attirer des clients au Burundi. Ajoute quelques emojis.`;

    // Appel sécurisé à notre Edge Function
    const { data, error } = await supabase.functions.invoke('ai-helper', {
      body: { prompt }
    });

    if (error) {
      alert("Erreur de l'IA : " + error.message);
    } else {
      setAdText(data.text);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">✨ Générateur de Publicités</h1>
          <Link to="/dashboard" className="text-teal-600 hover:underline">← Dashboard</Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produit à promouvoir</label>
              <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                <option value="">-- Choisir un produit --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.selling_price} FBu</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Réseau social</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                <option value="WhatsApp">WhatsApp (Statut)</option>
                <option value="Facebook">Facebook</option>
                <option value="Affiche">Affiche imprimée</option>
              </select>
            </div>

            <Button type="submit" isLoading={isLoading}>Générer avec l'IA</Button>
          </form>

          {adText && (
            <div className="mt-6 bg-teal-50 p-6 rounded-xl border border-teal-100">
              <h3 className="font-bold text-teal-800 mb-2">Votre publicité :</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{adText}</p>
              <button 
                onClick={() => { navigator.clipboard.writeText(adText); alert('Copié !'); }}
                className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700"
              >
                📋 Copier le texte
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}