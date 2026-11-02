import { useState, useEffect } from 'react';
import { formatBIF } from '../lib/currency';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    lowStockProducts: [] as any[]
  });

  const fetchStats = async () => {
    if (!user) return;
    
    // 1. Trouver la boutique
    const { data: memberData } = await supabase
      .from('shop_members').select('shop_id').eq('user_id', user.id).single();
      
    if (!memberData) return;
    const shopId = memberData.shop_id;

    // 2. Calculer les ventes du jour
    const today = new Date().toISOString().split('T')[0];
    const { data: salesData } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('shop_id', shopId)
      .gte('created_at', `${today}T00:00:00`);
      
    const revenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
    const count = salesData?.length || 0;

    // 3. Trouver les produits en stock faible
    const { data: productsData } = await supabase
      .from('products')
      .select('name, quantity, low_stock_threshold')
      .eq('shop_id', shopId)
      .eq('is_archived', false);
      
    const lowStock = productsData?.filter(p => p.quantity <= p.low_stock_threshold) || [];

    setStats({
      todaySales: count,
      todayRevenue: revenue,
      lowStockProducts: lowStock
    });
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <header className="bg-white shadow-sm px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-teal-700">Isoko AI</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-600 hidden md:block">{user?.email}</span>
          
          <button onClick={() => navigate('/products')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
            📦 Gérer les produits
          </button>
          <button onClick={() => navigate('/sales')} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
            💰 Nouvelle vente
          </button>
          <button onClick={() => navigate('/purchases')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            🛒 Nouvelles achats
          </button>
          <button 
            onClick={() => navigate('/transactions')} 
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            📊 Historique
          </button>
          <button 
            onClick={() => navigate('/settings')} 
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            ⚙️ Paramètres
          </button>
          <button 
            onClick={() => navigate('/subscription')} 
            className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
          >
            💳 Abonnement
          </button>
          <button 
            onClick={() => navigate('/ai-ads')} 
            className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
          >
            ✨ Pub IA
          </button>
          <button onClick={handleSignOut} className="text-red-500 hover:text-red-700 text-sm font-medium ml-2">
            Déconnexion
          </button>
        </div>
      </header>

      {/* Contenu */}
      <main className="p-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Tableau de bord</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Carte 1 : Recettes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-teal-500">
            <h3 className="text-gray-500 text-sm font-medium">Recettes du jour</h3>
            <p className="text-3xl font-bold text-teal-600 mt-2">{formatBIF(stats.todayRevenue)}</p>
          </div>
          
          {/* Carte 2 : Nombre de ventes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
            <h3 className="text-gray-500 text-sm font-medium">Ventes effectuées</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.todaySales}</p>
          </div>

          {/* Carte 3 : Alertes de stock */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
            <h3 className="text-gray-500 text-sm font-medium">Produits en alerte</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.lowStockProducts.length}</p>
          </div>
        </div>

        {/* Liste des alertes de stock */}
        {stats.lowStockProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <h3 className="text-red-700 font-bold">⚠️ Attention : Stocks faibles</h3>
            </div>
            <ul className="divide-y divide-gray-100">
              {stats.lowStockProducts.map((p, index) => (
                <li key={index} className="px-6 py-4 flex justify-between items-center">
                  <span className="font-medium text-gray-800">{p.name}</span>
                  <span className="text-sm text-red-600 font-bold">
                    Reste : {p.quantity} (Seuil : {p.low_stock_threshold})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}