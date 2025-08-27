// src/app/auth/register/page.tsx

"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [socialSecurityNumber, setSocialSecurityNumber] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // La fonction handleRegister mise à jour
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const supabase = createClient();

    // On appelle signUp et on passe toutes les données.
    // Le trigger dans la base de données s'occupera de créer le profil patient.
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          role: 'PATIENT', // Important pour la clarté, même si c'est le cas par défaut
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          phone_number: phoneNumber,
          social_security_number: socialSecurityNumber
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

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Créer un compte Patient</h1>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          <input type="password" placeholder="Mot de passe (6+ caractères)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 border rounded-md" />
          <hr/>
          <input type="text" placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          <input type="text" placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          <input type="date" placeholder="Date de naissance" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          <input type="tel" placeholder="Numéro de téléphone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          <input type="text" placeholder="Numéro de sécurité sociale" value={socialSecurityNumber} onChange={(e) => setSocialSecurityNumber(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          
          <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            {isLoading ? "Inscription en cours..." : "S'inscrire"}
          </button>
        </form>

        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
      </div>
    </div>
  );
}