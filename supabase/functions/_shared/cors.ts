// Fichier : supabase/functions/_shared/cors.ts

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Pour le dev, on autorise tout le monde
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-patient-id, x-file-name', // <-- ON AJOUTE NOS HEADERS ICI
}