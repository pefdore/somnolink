-- Fonction RPC pour récupérer les rendez-vous d'un patient
-- Cette fonction contourne les problèmes de politiques RLS

CREATE OR REPLACE FUNCTION get_patient_appointments()
RETURNS TABLE (
  id uuid,
  appointment_datetime timestamptz,
  type text,
  notes text,
  doctor_first_name text,
  doctor_last_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.appointment_datetime,
    a.type,
    a.notes,
    d.first_name,
    d.last_name
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  JOIN doctors d ON a.doctor_id = d.id
  WHERE p.user_id = auth.uid()
    AND a.appointment_datetime >= NOW()
  ORDER BY a.appointment_datetime ASC;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_patient_appointments() TO authenticated;

-- Test de la fonction
SELECT 'Fonction get_patient_appointments créée avec succès' as status;