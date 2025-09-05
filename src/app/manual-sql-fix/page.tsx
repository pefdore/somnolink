'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function ManualSqlFixPage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = async (text: string, commandName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(commandName);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const sqlCommands = [
    {
      title: "Supprimer les anciennes politiques RLS",
      description: "Nettoyer les politiques incorrectes",
      commands: [
        "DROP POLICY IF EXISTS \"Doctors can view patient antecedents\" ON antecedents;",
        "DROP POLICY IF EXISTS \"Doctors can insert patient antecedents\" ON antecedents;",
        "DROP POLICY IF EXISTS \"Doctors can update patient antecedents\" ON antecedents;",
        "DROP POLICY IF EXISTS \"Doctors can delete patient antecedents\" ON antecedents;"
      ]
    },
    {
      title: "Créer la politique de lecture",
      description: "Permettre aux médecins de voir les antécédents de leurs patients",
      commands: [
        `CREATE POLICY "Doctors can view patient antecedents" ON antecedents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.patient_id = antecedents.patient_id
    AND pdr.doctor_id = antecedents.doctor_id
    AND pdr.doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
    AND pdr.status = 'active'
  )
);`
      ]
    },
    {
      title: "Créer la politique d'insertion",
      description: "Permettre aux médecins d'ajouter des antécédents",
      commands: [
        `CREATE POLICY "Doctors can insert patient antecedents" ON antecedents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM patient_doctor_relationships pdr
    WHERE pdr.patient_id = antecedents.patient_id
    AND pdr.doctor_id = antecedents.doctor_id
    AND pdr.doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
    AND pdr.status = 'active'
  )
);`
      ]
    },
    {
      title: "Vérifier les politiques",
      description: "S'assurer que les politiques ont été créées",
      commands: [
        `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'antecedents';`
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🔧 Correction Manuelle SQL</h1>
          <p className="text-gray-600 mt-2">
            Appliquez ces commandes SQL dans Supabase pour corriger les politiques RLS
          </p>
        </div>

        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">📋 Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Allez dans votre <strong>dashboard Supabase</strong></li>
              <li>Cliquez sur <strong>"SQL Editor"</strong> dans le menu de gauche</li>
              <li>Copiez-collez <strong>chaque commande</strong> ci-dessous</li>
              <li>Exécutez-les <strong>une par une</strong></li>
              <li>Vérifiez que chaque commande s'exécute sans erreur</li>
            </ol>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {sqlCommands.map((section, sectionIndex) => (
            <Card key={sectionIndex}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-blue-600" />
                  {section.title}
                </CardTitle>
                <p className="text-sm text-gray-600">{section.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.commands.map((command, commandIndex) => (
                    <div key={commandIndex} className="relative">
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{command}</code>
                      </pre>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(command, `${section.title}-${commandIndex}`)}
                      >
                        {copiedCommand === `${section.title}-${commandIndex}` ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">✅ Après l'application</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-green-800">
                Une fois toutes les commandes exécutées :
              </p>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>Retournez dans votre application Somnolink</li>
                <li>Actualisez la page (Ctrl+F5)</li>
                <li>Essayez d'ajouter un antécédent</li>
                <li>La fonctionnalité devrait maintenant marcher !</li>
              </ul>

              <div className="mt-4 p-3 bg-white rounded border-l-4 border-green-500">
                <p className="text-green-800">
                  <strong>Si vous avez des erreurs SQL :</strong> Copiez l'erreur complète et partagez-la,
                  je vous aiderai à la résoudre.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <a href="/fix-all-issues" className="text-blue-600 underline mr-4">
            ← Retour aux corrections automatiques
          </a>
          <a href="/debug-patient-access" className="text-blue-600 underline">
            ← Retour au diagnostic
          </a>
        </div>
      </div>
    </div>
  );
}