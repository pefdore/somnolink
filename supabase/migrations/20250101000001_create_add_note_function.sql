-- Fonction RPC pour ajouter une note en contournant temporairement les politiques RLS
CREATE OR REPLACE FUNCTION add_note(
  p_patient_id UUID,
  p_doctor_id UUID,
  p_content TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Permet d'exécuter avec les privilèges du propriétaire de la fonction
AS $$
BEGIN
  INSERT INTO notes (patient_id, doctor_id, content)
  VALUES (p_patient_id, p_doctor_id, p_content);
END;
$$;

-- Fonction RPC pour récupérer les notes d'un patient en contournant les politiques RLS
CREATE OR REPLACE FUNCTION get_patient_notes(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  patient_id UUID,
  doctor_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  doctors JSONB
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
    n.created_at,
    jsonb_build_object(
      'first_name', d.first_name,
      'last_name', d.last_name
    ) as doctors
  FROM notes n
  LEFT JOIN doctors d ON n.doctor_id = d.id
  WHERE n.patient_id = p_patient_id
  ORDER BY n.created_at DESC;
END;
$$;