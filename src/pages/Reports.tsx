import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { formatBIF } from '../lib/currency';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Package, DollarSign } from 'lucide-react';

export default function Reports() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalMargin, setTotalMargin] = useState(0);

  useEffect(() => {
    const fetchReportsData = async () => {
      if (!user) return;
      let activeShopId = localStorage.getItem('active_shop_id');
      if (!activeShopId) {
        const { data } = await supabase.from('shop_members').select('shop_id').eq('user_id', user.id).limit(1).single();
        if (data) { activeShopId = data.shop_id; localStorage.setItem('active_shop_id', activeShopId!); }
      }
      if (!activeShopId) return;

      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: sales, error } = await supabase.from('sales').select(`created_at, total_amount, sale_items (quantity, products (name, purchase_price))`).eq('shop_id', activeShopId).gte('created_at', sevenDaysAgo.toISOString());

      if (error) { setIsLoading(false); return; }

      const dailyRevenue: { [key: string]: number } = {};
      const productSales: { [key: string]: { qty: number, revenue: number } } = {};
      let revTotal = 0; let marginTotal = 0;

      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        dailyRevenue[d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })] = 0;
      }

      sales?.forEach((sale: any) => {
        const dateStr = new Date(sale.created_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += Number(sale.total_amount);
        revTotal += Number(sale.total_amount);

        sale.sale_items.forEach((item: any) => {
          const prodName = item.products.name; const qty = Number(item.quantity);
          const sellPrice = Number(sale.total_amount) / qty; const costPrice = Number(item.products.purchase_price);
          marginTotal += (sellPrice - costPrice) * qty;
          if (!productSales[prodName]) productSales[prodName] = { qty: 0, revenue: 0 };
          productSales[prodName].qty += qty; productSales[prodName].revenue += sellPrice * qty;
        });
      });

      setRevenueData(Object.keys(dailyRevenue).map(date => ({ date, ventes: dailyRevenue[date] })));
      setTopProducts(Object.keys(productSales).map(name => ({ name, quantite: productSales[name].qty, revenu: productSales[name].revenue })).sort((a, b) => b.revenu - a.revenu).slice(0, 5));
      setTotalRevenue(revTotal); setTotalMargin(marginTotal); setIsLoading(false);
    };
    fetchReportsData();
  }, [user]);

  if (isLoading) return <div className="p-6 text-center">{t('loading')}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('reports_title')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/dashboard" className="text-teal-600 hover:underline">{t('back_dashboard')}</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-teal-500 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">{t('revenue_7d')}</p>
              <p className="text-3xl font-bold text-teal-600 mt-1">{formatBIF(totalRevenue)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-teal-100" />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-green-500 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">{t('margin_7d')}</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{formatBIF(totalMargin)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique d'évolution */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-6">{t('sales_evolution')}</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val: number) => `${val / 1000}k`} />
                  {/* CORRECTION ICI : le type est géré dynamiquement avec Number() */}
                  <Tooltip formatter={(value) => [formatBIF(Number(value)), 'Ventes']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="ventes" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, fill: '#0d9488' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Produits */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><Package className="w-5 h-5 text-gray-400" /> {t('top_products')}</h2>
            <div className="h-72 w-full">
              {topProducts.length === 0 ? <div className="flex h-full items-center justify-center text-gray-400">{t('no_data')}</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} width={100} />
                    {/* CORRECTION ICI : le type est géré dynamiquement avec Number() */}
                    <Tooltip formatter={(value) => [formatBIF(Number(value)), 'Revenu']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="revenu" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}