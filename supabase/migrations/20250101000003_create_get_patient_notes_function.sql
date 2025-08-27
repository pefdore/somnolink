-- Fonction RPC pour récupérer les notes d'un patient en contournant les politiques RLS
CREATE OR REPLACE FUNCTION get_patient_notes(p_patient_id UUID)
RETURNS SETOF notes
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
    n.created_at,
    n.updated_at
  FROM notes n
  WHERE n.patient_id = p_patient_id
  ORDER BY n.created_at DESC;
END;
$$;