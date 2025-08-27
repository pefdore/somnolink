-- Enable RLS on notes table if not already enabled
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can view all notes
CREATE POLICY "Doctors can view all patient notes" ON notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctors
    WHERE doctors.user_id = auth.uid()
  )
);

-- Policy: Doctors can insert notes for their patients
CREATE POLICY "Doctors can insert patient notes" ON notes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Policy: Doctors can update their own notes
CREATE POLICY "Doctors can update their notes" ON notes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Policy: Doctors can delete their own notes
CREATE POLICY "Doctors can delete their notes" ON notes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM doctors 
    WHERE doctors.id = notes.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);