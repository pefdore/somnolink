// Fichier : supabase/functions/analyze-pgv/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const { documentId } = await req.json()
    if (!documentId) throw new Error("ID du document manquant")

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Mettre à jour le statut pour indiquer que l'analyse est en cours
    await supabaseAdmin
      .from('documents')
      .update({ analysis_status: 'PROCESSING' })
      .eq('id', documentId)

    // --- SIMULATION DE L'ANALYSE IA ---
    // Ici, vous appelleriez votre VPS avec le LLM.
    // Pour notre test, on attend juste 5 secondes.
    await new Promise(resolve => setTimeout(resolve, 5000));
    const fakeAnalysisResult = {
        iah: 25.3,
        conclusion: "Syndrome d'apnées-hypopnées du sommeil de sévérité modérée.",
        suggested_letter: "Cher confrère, je vous adresse M./Mme X qui présente un SAHOS modéré. Un traitement par PPC semble indiqué. Bien confraternellement."
    }
    // --- FIN DE LA SIMULATION ---

    // 3. Mettre à jour le document avec le résultat et le statut final
    const { error: updateError } = await supabaseAdmin
      .from('documents')
      .update({ 
          analysis_status: 'COMPLETED', 
          analysis_result: fakeAnalysisResult 
      })
      .eq('id', documentId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, result: fakeAnalysisResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})