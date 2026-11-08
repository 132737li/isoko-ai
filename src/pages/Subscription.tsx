import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

export default function Subscription() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [shopId, setShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchShop = async () => {
      if (!user) return;
      let activeShopId = localStorage.getItem('active_shop_id');
      if (!activeShopId) {
        const { data } = await supabase.from('shop_members').select('shop_id').eq('user_id', user.id).limit(1).single();
        if (data) { activeShopId = data.shop_id; localStorage.setItem('active_shop_id', activeShopId!); }
      }
      if (activeShopId) {
        setShopId(activeShopId);
        const { data } = await supabase.from('shops').select('current_plan').eq('id', activeShopId).single();
        if (data) setCurrentPlan(data.current_plan || 'free');
      }
    };
    fetchShop();
  }, [user]);

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free' || planId === currentPlan || !shopId) return;
    setIsLoading(planId);
    const { data, error } = await supabase.functions.invoke('create-checkout', { body: { plan: planId, shopId } });
    if (error) { alert("Erreur : " + error.message); setIsLoading(null); } 
    else if (data?.url) window.location.href = data.url;
  };

  const PLANS = [
    { id: 'free', name: t('plan_free'), price: '0 BIF', features: ['30 produits', 'Gestion de base', 'Rapports limités'], icon: '🌱' },
    { id: 'shop', name: t('plan_shop'), price: '10 000 BIF', features: ['Produits illimités', 'Alertes de stock', 'Historique complet', 'Export CSV'], icon: '🏪' },
    { id: 'premium', name: t('plan_premium'), price: '25 000 BIF', features: ['Tout Boutique', 'Assistant IA', 'Générateur de pubs IA', 'Rapports avancés'], icon: '🚀' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{t('subscription')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/dashboard" className="text-teal-600 hover:underline">{t('back_dashboard')}</Link>
          </div>
        </div>

        {searchParams.get('status') === 'success' && (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">🎉 Paiement réussi ! Votre abonnement sera activé sous peu.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`bg-white p-6 rounded-xl shadow-sm border-2 ${currentPlan === plan.id ? 'border-teal-500' : 'border-transparent'}`}>
              <div className="text-3xl mb-2">{plan.icon}</div>
              <h2 className="text-xl font-bold text-gray-800">{plan.name}</h2>
              <p className="text-2xl font-bold text-teal-600 my-2">{plan.price}</p>
              <ul className="space-y-2 my-6">
                {plan.features.map(f => <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} className="text-green-500" /> {f}</li>)}
              </ul>
              <Button onClick={() => handleSubscribe(plan.id)} disabled={currentPlan === plan.id || plan.id === 'free'} isLoading={isLoading === plan.id} variant={currentPlan === plan.id ? 'secondary' : 'primary'} className="w-full">
                {currentPlan === plan.id ? t('plan_current') : plan.id === 'free' ? t('included') : t('pay_with_ultraner')}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}