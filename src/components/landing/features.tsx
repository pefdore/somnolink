// src/components/landing/features.tsx
import { BarChart, FileText, Users } from 'lucide-react';

export function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold">Une plateforme tout-en-un</h2>
        <p className="mt-4 text-lg text-gray-600">Conçue par des médecins, pour des médecins.</p>
        <div className="mt-12 grid md:grid-cols-3 gap-12">
          <div className="p-8">
            <FileText className="h-12 w-12 mx-auto text-blue-600" />
            <h3 className="mt-4 text-2xl font-semibold">Dossiers centralisés</h3>
            <p className="mt-2 text-gray-600">Accédez à l&apos;historique, aux questionnaires et aux comptes-rendus de vos patients en un clic.</p>
          </div>
          <div className="p-8">
            <Users className="h-12 w-12 mx-auto text-blue-600" />
            <h3 className="mt-4 text-2xl font-semibold">Collaboration Patient</h3>
            <p className="mt-2 text-gray-600">Impliquez vos patients dans leur suivi grâce à des formulaires et un portail dédiés.</p>
          </div>
          <div className="p-8">
            <BarChart className="h-12 w-12 mx-auto text-blue-600" />
            <h3 className="mt-4 text-2xl font-semibold">Analyse Assistée par IA</h3>
            <p className="mt-2 text-gray-600">Gagnez du temps sur l&apos;interprétation des polygraphies grâce à notre module d&apos;analyse intelligent.</p>
          </div>
        </div>
      </div>
    </section>
  );
}