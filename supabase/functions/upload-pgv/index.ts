// Fichier : supabase/functions/upload-pgv/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const patientId = req.headers.get('x-patient-id')
    const fileName = req.headers.get('x-file-name')
    
    if (!patientId || !fileName) throw new Error('Patient ID ou nom de fichier manquant')

    const file = await req.blob()
    const filePath = `${patientId}/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('patient-documents')
      .upload(filePath, file, { upsert: true, contentType: 'application/pdf' })

    if (uploadError) throw uploadError

    // --- PARTIE AJOUTÉE ---
    // Après l'upload, on enregistre une entrée dans la table 'documents'
    const { data: documentData, error: dbError } = await supabaseAdmin
      .from('documents')
      .insert({
        patient_id: patientId,
        document_type: 'CR_PGV',
        file_path: filePath,
        file_name: fileName,
        analysis_status: 'PENDING' // Le statut initial
      })
      .select()
      .single()
    
    if (dbError) throw dbError
    // --- FIN DE LA PARTIE AJOUTÉE ---

    // On retourne l'ID du document créé en plus du succès
    return new Response(JSON.stringify({ success: true, documentId: documentData.id }), {
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