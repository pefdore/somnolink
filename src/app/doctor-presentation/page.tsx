// src/app/doctor-presentation/page.tsx

import Link from 'next/link';
import { ArrowLeft, Stethoscope, Users, BarChart3, MessageCircle, Shield } from 'lucide-react';

export default function DoctorPresentationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour à l&apos;accueil</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SL</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Somnolink
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Stethoscope className="w-4 h-4 mr-2" />
            Espace Professionnels de Santé
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            La plateforme de référence pour le 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}suivi des patients apnéiques
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Outils modernes, collaboration simplifiée, et suivi médical optimisé pour les médecins du sommeil.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register-doctor"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Créer un compte médecin
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-600 hover:text-white transition-all"
            >
              Se connecter
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Users,
              title: "Gestion Centralisée des Patients",
              description: "Accédez à tous vos patients en un seul endroit, avec historiques complets et données en temps réel."
            },
            {
              icon: BarChart3,
              title: "Analyses Avancées",
              description: "Tableaux de bord personnalisables avec indicateurs de performance et tendances de traitement."
            },
            {
              icon: MessageCircle,
              title: "Communication Sécurisée",
              description: "Messagerie cryptée avec vos patients pour un suivi continu et des consultations à distance."
            },
            {
              icon: Shield,
              title: "Conformité RGPD & HIPAA",
              description: "Plateforme certifiée pour la protection des données de santé les plus sensibles."
            },
            {
              icon: Stethoscope,
              title: "Outils Diagnostic",
              description: "Intégration avec les systèmes de polygraphie et outils d'analyse assistée par IA."
            },
            {
              icon: Users,
              title: "Collaboration d'Équipe",
              description: "Travaillez avec vos collaborateurs et partagez les dossiers patients en toute sécurité."
            }
          ].map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Prêt à révolutionner votre pratique médicale ?
          </h2>
          <p className="text-blue-100 text-lg mb-6">
            Rejoignez les médecins qui ont déjà adopté Somnolink pour un suivi patient moderne et efficace.
          </p>
          <Link
            href="/auth/register-doctor"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Démarrer gratuitement
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Somnolink. Plateforme médicale sécurisée pour les professionnels de santé.
          </p>
        </div>
      </footer>
    </div>
  );
}