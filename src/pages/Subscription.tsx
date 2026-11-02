import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';

const PLANS = [
  { id: 'free', name: 'Gratuit', price: '0 BIF', features: ['Jusqu\'à 30 produits', 'Gestion de base', 'Rapports limités'], icon: '🌱' },
  { id: 'shop', name: 'Boutique', price: '10 000 BIF/mois', features: ['Produits illimités', 'Alertes de stock', 'Historique complet', 'Export CSV'], icon: '🏪' },
  { id: 'premium', name: 'Premium', price: '25 000 BIF/mois', features: ['Tout Boutique', 'Assistant IA', 'Générateur de pubs IA', 'Rapports avancés'], icon: '🚀' }
];

export default function Subscription() {
  const { user } = useAuthStore();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [shopId, setShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchShop = async () => {
      if (!user) return;
      const { data } = await supabase.from('shop_members').select('shop_id, shops(current_plan)').eq('user_id', user.id).single();
      if (data) {
        setShopId(data.shop_id);
        // @ts-ignore
        setCurrentPlan(data.shops.current_plan || 'free');
      }
    };
    fetchShop();
  }, [user]);

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free' || planId === currentPlan) return;
    setIsLoading(planId);

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { plan: planId, shopId }
    });

    if (error) {
      alert("Erreur : " + error.message);
      setIsLoading(null);
    } else if (data?.url) {
      window.location.href = data.url; // Redirection vers Ultraner
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Abonnements</h1>
          <Link to="/dashboard" className="text-teal-600 hover:underline">← Dashboard</Link>
        </div>

        {searchParams.get('status') === 'success' && (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
            🎉 Paiement réussi ! Votre abonnement sera activé sous peu.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`bg-white p-6 rounded-xl shadow-sm border-2 ${currentPlan === plan.id ? 'border-teal-500' : 'border-transparent'}`}>
              <div className="text-3xl mb-2">{plan.icon}</div>
              <h2 className="text-xl font-bold text-gray-800">{plan.name}</h2>
              <p className="text-2xl font-bold text-teal-600 my-2">{plan.price}</p>
              
              <ul className="space-y-2 my-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handleSubscribe(plan.id)} 
                disabled={currentPlan === plan.id || plan.id === 'free'}
                isLoading={isLoading === plan.id}
                variant={currentPlan === plan.id ? 'secondary' : 'primary'}
                className="w-full"
              >
                {currentPlan === plan.id ? 'Plan actuel' : plan.id === 'free' ? 'Inclus' : 'Payer avec Ultraner'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}