import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { formatBIF } from '../lib/currency';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

export default function Transactions() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSales = async () => {
    if (!user) return;
    let activeShopId = localStorage.getItem('active_shop_id');
    if (!activeShopId) {
      const { data } = await supabase.from('shop_members').select('shop_id').eq('user_id', user.id).limit(1).single();
      if (data) { activeShopId = data.shop_id; localStorage.setItem('active_shop_id', activeShopId!); }
    }
    if (activeShopId) {
      const { data } = await supabase.from('sales').select(`id, total_amount, payment_method, created_at, sale_items (id, quantity, unit_price, products (name))`).eq('shop_id', activeShopId).order('created_at', { ascending: false });
      if (data) setSales(data);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchSales(); }, [user]);

  const formatDate = (dateString: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));

  if (isLoading) return <div className="p-6">{t('loading')}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('history')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/dashboard" className="text-teal-600 hover:underline">{t('back_dashboard')}</Link>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {sales.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl shadow-sm text-gray-500">{t('no_sales')}</div>
          ) : (
            sales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-700">{formatDate(sale.created_at)}</span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full font-medium uppercase">{sale.payment_method === 'cash' ? t('cash') : sale.payment_method}</span>
                  </div>
                  <span className="text-xl font-bold text-teal-600">{formatBIF(sale.total_amount)}</span>
                </div>
                <ul className="divide-y px-6">
                  {sale.sale_items.map((item: any) => (
                    <li key={item.id} className="py-3 flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{item.products.name}</span>
                        <span className="text-gray-400">x {item.quantity}</span>
                      </div>
                      <span className="text-gray-600">{formatBIF(item.unit_price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}