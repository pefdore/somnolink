// src/app/auth/login/page.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // La fonction de connexion complète et corrigée
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    // ---- DÉBOGAGE ----
    console.log("Tentative de connexion pour :", email);
    if (data.user) {
      console.log("Rôle trouvé dans les métadonnées :", data.user.user_metadata.role);
    } else {
      console.log("Aucun utilisateur retourné après la connexion.");
    }
    // ---- FIN DÉBOGAGE ----

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else if (data.user) {
      // VÉRIFICATION DE SÉCURITÉ : Email doit être confirmé
      if (!data.user.email_confirmed_at) {
        console.log('🚫 [SECURITY] Email NON confirmé - redirection vers confirmation');
        router.push('/auth/confirm-email');
        return;
      }

      // Connexion réussie et email confirmé, on vérifie le rôle
      const userRole = data.user.user_metadata.role;

      // On redirige explicitement en fonction du rôle
      if (userRole === 'DOCTOR') {
        console.log("Redirection vers /dashboard/doctor");
        router.push('/dashboard/doctor');
      } else {
        console.log("Redirection vers /dashboard/patient");
        router.push('/dashboard/patient');
      }
      // On force le rafraîchissement APRÈS avoir initié la redirection
      router.refresh();
      
    } else {
        setError("Un problème est survenu lors de la connexion.");
        setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Connexion</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 border rounded-md" />
          
          <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        
        <div className="text-center text-sm">
            <p className="mb-2">
                Pas encore de compte ?
            </p>
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500 mr-4">
                Créer un compte Patient
            </Link>
            |
            <Link href="/auth/register-doctor" className="font-medium text-green-600 hover:text-green-500 ml-4">
                Créer un compte Médecin
            </Link>
        </div>
      </div>
    </div>
  );
}