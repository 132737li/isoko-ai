import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { plan } = await req.json()
    const apiKey = Deno.env.get('ULTRANER_API_KEY')
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    if (!apiKey) throw new Error("Clé API Ultraner manquante.")

    const isTest = apiKey.startsWith('uk_test_')
    const endpoint = isTest 
      ? 'https://api.ultraner.com/v0-sandbox/checkout/sessions'
      : 'https://api.ultraner.com/v0/checkout/sessions'

    const amount = plan === 'shop' ? 10000 : 25000
    const description = plan === 'shop' ? 'Abonnement Boutique' : 'Abonnement Premium'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'BIF', // Si BIF échoue, tester avec 'USD' pour vérifier le support
        description: description,
        callback_url: `${siteUrl}/subscription?status=success`,
        email: 'client@isoko.ai',
        country: 'BI'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Erreur Ultraner:", JSON.stringify(data))
      return new Response(JSON.stringify({ 
        error: data.error?.message || data.message || "Erreur Ultraner",
        rawResponse: data 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Recherche de l'URL dans tous les champs possibles
    const checkoutUrl = data.data?.session_url || 
                        data.data?.redirect_url || 
                        data.data?.checkout_url || 
                        data.data?.url || 
                        data.session_url || 
                        data.url

    if (!checkoutUrl) {
      // Si aucune URL n'est trouvée, on renvoie la réponse brute pour inspecter la structure
      return new Response(JSON.stringify({ 
        error: "URL de paiement introuvable dans la réponse",
        rawResponse: data 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    return new Response(JSON.stringify({ url: checkoutUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Erreur interne:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})