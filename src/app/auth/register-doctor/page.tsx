// src/app/auth/register-doctor/page.tsx

"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterDoctorPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rppsNumber, setRppsNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const mssanteAddress = (firstName && lastName) 
    ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@medecin.mssante.fr` 
    : '';

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // LA FONCTION CORRIGÉE - Notez le "async" au début
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const supabase = createClient();
    
    // On appelle signUp, le trigger dans la BDD fera le reste.
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          role: 'DOCTOR',
          first_name: firstName,
          last_name: lastName,
          rpps_number: rppsNumber,
          phone_number: phoneNumber,
          mssante_address: mssanteAddress
        }
      }
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Inscription réussie ! Veuillez consulter vos emails pour valider votre compte.');
    }
  };

  // LE JSX (HTML) QUI N'A PAS CHANGÉ
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Créer un compte Médecin</h1>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          <input type="text" placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          <input type="email" placeholder="Email de contact" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          <input type="password" placeholder="Mot de passe (6+ caractères)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 border rounded-md" />
          <hr/>
          <input type="text" placeholder="Numéro RPPS" value={rppsNumber} onChange={(e) => setRppsNumber(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          <input type="tel" placeholder="Numéro de téléphone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          <div>
              <label className="block text-sm font-medium text-gray-700">Adresse MSSanté (auto-générée)</label>
              <input type="text" value={mssanteAddress} disabled className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300" />
          </div>

          <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">
            {isLoading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>

        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
      </div>
    </div>
  );
}