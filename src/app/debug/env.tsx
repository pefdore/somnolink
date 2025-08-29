// src/app/debug/env.tsx

"use client";

import { useEffect, useState } from 'react';

export default function EnvDebugPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Récupérer toutes les variables d'environnement accessibles côté client
    const vars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NON DÉFINI',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NON DÉFINI',
      SUPABASE_URL: process.env.SUPABASE_URL || 'NON DÉFINI',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 
        process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NON DÉFINI',
    };
    setEnvVars(vars);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug des Variables d&apos;Environnement</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Variables côté client :</h2>
        <pre className="bg-white p-4 rounded overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
      
      <div className="mt-6 bg-yellow-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Instructions :</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Ouvrez la console du navigateur (F12) et vérifiez les erreurs</li>
          <li>Visitez cette page pour voir quelles variables sont disponibles</li>
          <li>Sur Vercel, assurez-vous que ces variables sont configurées :
            <ul className="list-disc list-inside ml-6 mt-2">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              <li>SUPABASE_URL</li>
              <li>SUPABASE_ANON_KEY</li>
            </ul>
          </li>
          <li>Redéployez après avoir ajouté/modifié les variables</li>
        </ol>
      </div>
    </div>
  );
}