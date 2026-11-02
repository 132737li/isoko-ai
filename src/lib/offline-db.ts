import Dexie, { type Table } from 'dexie';

// Structure d'une vente en attente
export interface PendingSale {
  id: string; // ID unique généré par le navigateur
  shop_id: string;
  product_id: string;
  quantity: number;
  payment_method: string;
  created_at: string;
}

export class IsokoDatabase extends Dexie {
  pendingSales!: Table<PendingSale, string>;

  constructor() {
    super('IsokoOfflineDB');
    // Définition de la table "pendingSales" avec l'ID comme clé primaire
    this.version(1).stores({
      pendingSales: 'id, shop_id, product_id'
    });
  }
}

export const db = new IsokoDatabase();