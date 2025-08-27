-- Fonction RPC pour récupérer la dernière note insérée pour un patient
CREATE OR REPLACE FUNCTION get_latest_note(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  patient_id UUID,
  doctor_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.patient_id,
    n.doctor_id,
    n.content,
    n.created_at
  FROM notes n
  WHERE n.patient_id = p_patient_id
  ORDER BY n.created_at DESC
  LIMIT 1;
END;
$$;