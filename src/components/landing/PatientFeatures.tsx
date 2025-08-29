'use client';

import { Brain, MessageCircle, Bell, BarChart3, Shield, Calendar } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: "Analyse Intelligente",
    description: "Notre IA analyse vos données de sommeil pour des recommandations personnalisées et des alertes précoces.",
    color: "blue"
  },
  {
    icon: MessageCircle,
    title: "Communication Directe",
    description: "Échangez en temps réel avec votre médecin via notre messagerie sécurisée et cryptée.",
    color: "green"
  },
  {
    icon: Bell,
    title: "Rappels Intelligents",
    description: "Ne manquez jamais une prise de traitement avec nos rappels personnalisés et adaptatifs.",
    color: "purple"
  },
  {
    icon: BarChart3,
    title: "Suivi en Temps Réel",
    description: "Visualisez votre progression et vos statistiques de santé avec des graphiques clairs et intuitifs.",
    color: "orange"
  },
  {
    icon: Shield,
    title: "Sécurité Maximale",
    description: "Vos données médicales sont cryptées et stockées en conformité avec les normes de santé les plus strictes.",
    color: "red"
  },
  {
    icon: Calendar,
    title: "Gestion de Rendez-vous",
    description: "Planifiez et gérez vos consultations facilement avec des rappels automatiques par email et SMS.",
    color: "indigo"
  }
];

const colorClasses = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
  red: "bg-red-100 text-red-600",
  indigo: "bg-indigo-100 text-indigo-600"
};

export function PatientFeatures() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin pour 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}mieux dormir
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Une plateforme complète conçue spécifiquement pour les patients apnéiques, 
            avec des outils modernes qui simplifient votre parcours de soins.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-100"
            >
              <div className={`w-12 h-12 ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                  <div className={`w-2 h-2 ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-full mr-2`}></div>
                  Disponible sur mobile et desktop
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats section */}
        <div className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">95%</div>
              <p className="text-blue-100">Patients satisfaits</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">24/7</div>
              <p className="text-blue-100">Support disponible</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">30s</div>
              <p className="text-blue-100">Temps d&apos;inscription moyen</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">100%</div>
              <p className="text-blue-100">Données sécurisées</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}