import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { formatBIF } from '../lib/currency';
import { Link } from 'react-router-dom';

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  products: { name: string };
}

interface Sale {
  id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  sale_items: SaleItem[];
}

export default function Transactions() {
  const { user } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSales = async () => {
    if (!user) return;
    
    // Trouver la boutique
    const { data: memberData } = await supabase
      .from('shop_members').select('shop_id').eq('user_id', user.id).single();

    if (memberData) {
      // Récupérer les ventes avec les détails des produits
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          payment_method,
          created_at,
          sale_items (
            id,
            quantity,
            unit_price,
            products (name)
          )
        `)
        .eq('shop_id', memberData.shop_id)
        .order('created_at', { ascending: false }); // Les plus récentes en premier

      if (!error && data) {
        setSales(data as unknown as Sale[]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  if (isLoading) return <div className="p-6">Chargement de l'historique...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Historique des ventes</h1>
          <Link to="/dashboard" className="text-teal-600 hover:underline">← Dashboard</Link>
        </div>

        <div className="flex flex-col gap-4">
          {sales.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl shadow-sm text-gray-500">
              Aucune vente enregistrée pour le moment.
            </div>
          ) : (
            sales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-700">{formatDate(sale.created_at)}</span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full font-medium uppercase">
                      {sale.payment_method === 'cash' ? 'Espèces' : sale.payment_method}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-teal-600">{formatBIF(sale.total_amount)}</span>
                </div>
                
                <ul className="divide-y divide-gray-100 px-6">
                  {sale.sale_items.map((item) => (
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