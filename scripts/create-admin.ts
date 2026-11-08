import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// ⚠️ Utilisez la clé service_role UNIQUEMENT dans ce script serveur
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

async function createAdmin() {
  const email = 'votre-email-admin@isoko.ai';
  const password = 'UnMotDePasseTrèsComplexe123!';

  const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (user) {
    // Promouvoir l'utilisateur en admin
    await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    console.log('Compte administrateur créé avec succès !');
  } else {
    console.error('Erreur :', error?.message);
  }
}
createAdmin();