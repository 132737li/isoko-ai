import { useState, useEffect } from 'react';
import { formatBIF } from '../lib/currency';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { MessageCircle } from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    lowStockProducts: [] as any[]
  });
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!user) return;
    let activeShopId = localStorage.getItem('active_shop_id');
    
    if (!activeShopId) {
      const { data } = await supabase.from('shop_members').select('shop_id').eq('user_id', user.id).limit(1).single();
      if (data) { activeShopId = data.shop_id; localStorage.setItem('active_shop_id', activeShopId!); }
    }
    if (!activeShopId) return;

    // Numéro WhatsApp
    const { data: shopData } = await supabase.from('shops').select('whatsapp_number').eq('id', activeShopId).single();
    if (shopData?.whatsapp_number) setWhatsappNumber(shopData.whatsapp_number);

    // Stats
    const today = new Date().toISOString().split('T')[0];
    const { data: salesData } = await supabase.from('sales').select('total_amount').eq('shop_id', activeShopId).gte('created_at', `${today}T00:00:00`);
    const revenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
    const count = salesData?.length || 0;

    const { data: productsData } = await supabase.from('products').select('name, quantity, low_stock_threshold').eq('shop_id', activeShopId).eq('is_archived', false);
    const lowStock = productsData?.filter(p => p.quantity <= p.low_stock_threshold) || [];

    setStats({ todaySales: count, todayRevenue: revenue, lowStockProducts: lowStock });
  };

  useEffect(() => { fetchStats(); }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <header className="bg-white shadow-sm px-6 py-4 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-teal-700">{t('app_name')}</h1>
          <LanguageSwitcher />
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-2">
          {whatsappNumber && (
            <a 
              href={`https://wa.me/${whatsappNumber}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1"
            >
              <MessageCircle size={16} /> {t('contact_whatsapp')}
            </a>
          )}
          <button onClick={handleSignOut} className="text-red-500 hover:text-red-700 text-sm font-medium ml-2">{t('logout')}</button>
        </div>
      </header>

      {/* Menu de navigation (Grille) */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex flex-wrap justify-center gap-2 text-sm">
        <button onClick={() => navigate('/shops')} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 font-medium">🏪 {t('shops')}</button>
        <button onClick={() => navigate('/products')} className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100 font-medium">📦 {t('products')}</button>
        <button onClick={() => navigate('/sales')} className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded hover:bg-teal-100 font-medium">💰 {t('new_sale')}</button>
        <button onClick={() => navigate('/purchases')} className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-100 font-medium">🛒 {t('new_purchase')}</button>
        <button onClick={() => navigate('/transactions')} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 font-medium">📊 {t('history')}</button>
        <button onClick={() => navigate('/reports')} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-100 font-medium">📈 {t('reports')}</button>
        <button onClick={() => navigate('/ai-ads')} className="bg-pink-50 text-pink-700 px-3 py-1.5 rounded hover:bg-pink-100 font-medium">✨ {t('ai_ads')}</button>
        <button onClick={() => navigate('/assistant')} className="bg-fuchsia-50 text-fuchsia-700 px-3 py-1.5 rounded hover:bg-fuchsia-100 font-medium">🤖 {t('ai_assistant_title')}</button>
        <button onClick={() => navigate('/subscription')} className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded hover:bg-yellow-100 font-medium">💳 {t('subscription')}</button>
        <button onClick={() => navigate('/settings')} className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100 font-medium">⚙️ {t('settings')}</button>
        <button onClick={() => navigate('/security')} className="bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 font-medium">🔒 {t('security')}</button>
      </nav>

      {/* Contenu principal */}
      <main className="p-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('dashboard')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-teal-500">
            <h3 className="text-gray-500 text-sm font-medium">{t('today_revenue')}</h3>
            <p className="text-3xl font-bold text-teal-600 mt-2">{formatBIF(stats.todayRevenue)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-blue-500">
            <h3 className="text-gray-500 text-sm font-medium">{t('today_sales')}</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.todaySales}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-red-500">
            <h3 className="text-gray-500 text-sm font-medium">{t('low_stock_alerts')}</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.lowStockProducts.length}</p>
          </div>
        </div>

        {stats.lowStockProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <h3 className="text-red-700 font-bold">⚠️ {t('low_stock_title')}</h3>
            </div>
            <ul className="divide-y divide-gray-100">
              {stats.lowStockProducts.map((p, index) => (
                <li key={index} className="px-6 py-4 flex justify-between items-center">
                  <span className="font-medium text-gray-800">{p.name}</span>
                  <span className="text-sm text-red-600 font-bold">{t('stock_left')}: {p.quantity} ({t('threshold')}: {p.low_stock_threshold})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}