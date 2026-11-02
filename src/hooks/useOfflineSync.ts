import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/offline-db';
import { supabase } from '../lib/supabase';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mettre à jour le nombre de ventes en attente
  const updatePendingCount = useCallback(async () => {
    const count = await db.pendingSales.count();
    setPendingCount(count);
  }, []);

  // La fonction de synchronisation
  const syncSales = useCallback(async () => {
    if (!navigator.onLine) return;
    
    setIsSyncing(true);
    const pending = await db.pendingSales.toArray();

    for (const sale of pending) {
      // On envoie la vente à Supabase via la fonction RPC
      const { error } = await supabase.rpc('make_sale', {
        p_shop_id: sale.shop_id,
        p_product_id: sale.product_id,
        p_quantity: sale.quantity,
        p_payment_method: sale.payment_method
      });

      // Si la vente passe, on la supprime de la base locale
      if (!error) {
        await db.pendingSales.delete(sale.id);
      } else {
        console.error("Erreur de synchronisation pour la vente", sale.id, error);
        // Si l'erreur est "Stock insuffisant", on pourrait gérer ça ici
      }
    }
    
    await updatePendingCount();
    setIsSyncing(false);
  }, [updatePendingCount]);

  useEffect(() => {
    // Écouter les changements de connexion
    const handleOnline = () => {
      setIsOnline(true);
      syncSales();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier au démarrage
    updatePendingCount();
    if (navigator.onLine) syncSales();

    // Nettoyage
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncSales, updatePendingCount]);

  return { isOnline, pendingCount, isSyncing, syncSales };
}