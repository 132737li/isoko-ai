import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // On lit le corps BRUT de la requête (indispensable pour la signature)
  const rawBody = await req.text()
  const signature = req.headers.get('X-Ultraner-Signature')
  const webhookSecret = Deno.env.get('ULTRANER_WEBHOOK_SECRET')

  // 1. Vérification de la signature (HMAC-SHA256)
  if (!signature || !webhookSecret) {
    return new Response('Signature ou secret manquant', { status: 401 })
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(webhookSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  )
  const signatureBuffer = Uint8Array.from(
    signature.replace('sha256=', '').match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  )
  
  const isValid = await crypto.subtle.verify(
    'HMAC', key, signatureBuffer, encoder.encode(rawBody)
  )

  if (!isValid) {
    console.error("Signature invalide")
    return new Response('Signature invalide', { status: 401 })
  }

  // 2. Lecture et traitement de l'événement
  const event = JSON.parse(rawBody)
  console.log("Événement reçu :", event.event)

  // Initialisation du client Supabase avec les droits admin (service_role)
  // pour pouvoir modifier la table shops sans être bloqué par le RLS
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 3. Si le paiement est un succès, on active l'abonnement
  if (event.event === 'payment.success' || event.event === 'checkout.session.completed') {
    const data = event.data
    const shopId = data.metadata?.shopId || data.metadata?.shop_id
    const plan = data.metadata?.plan

    if (shopId && plan) {
      // Mise à jour de la table shops
      await supabase.from('shops').update({ current_plan: plan }).eq('id', shopId)

      // Mise à jour ou création dans la table subscriptions
      await supabase.from('subscriptions').upsert({
        shop_id: shopId,
        plan: plan,
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 jours
      }, { onConflict: 'shop_id' }) // À adapter selon ton schéma

      // Enregistrement du paiement
      await supabase.from('payments').insert({
        shop_id: shopId,
        amount: data.amount,
        currency: data.currency,
        provider_transaction_id: data.reference || data.id,
        status: 'successful'
      })
    }
  }

  // 4. Répondre 200 IMMÉDIATEMENT (Ultraner réessaiera sinon)
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})