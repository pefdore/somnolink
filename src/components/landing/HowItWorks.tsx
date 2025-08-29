'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, UserPlus, MessageSquare, Calendar, BarChart3, CheckCircle } from 'lucide-react';

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: "Inscription Simple",
    description: "Créez votre compte en moins de 2 minutes. Aucune information médicale complexe requise pour commencer.",
    details: "Juste votre email et un mot de passe. Votre médecin vous enverra une invitation pour compléter votre profil médical."
  },
  {
    step: 2,
    icon: MessageSquare,
    title: "Connexion avec Votre Médecin",
    description: "Votre médecin a accès à votre espace et peut vous envoyer des questionnaires et recommandations.",
    details: "Une messagerie sécurisée vous permet d'échanger directement avec votre équipe médicale à tout moment."
  },
  {
    step: 3,
    icon: Calendar,
    title: "Suivi Quotidien",
    description: "Complétez vos questionnaires et suivez votre traitement avec nos rappels personnalisés.",
    details: "Des notifications douces vous aident à maintenir une routine saine sans être intrusives."
  },
  {
    step: 4,
    icon: BarChart3,
    title: "Progrès Visibles",
    description: "Visualisez votre amélioration avec des graphiques clairs et des statistiques motivantes.",
    details: "Suivez votre adhérence au traitement, la qualité de votre sommeil et vos symptômes au fil du temps."
  }
];

export function HowItWorks() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comment ça marche en 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}4 étapes simples
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Un processus simple et transparent pour reprendre le contrôle de votre santé du sommeil
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {steps.map((step) => {
            const IconComponent = step.icon;
            const isExpanded = expandedStep === step.step;
            
            return (
              <div
                key={step.step}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full mr-3">
                          Étape {step.step}
                        </span>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {step.title}
                        </h3>
                      </div>
                      
                      <p className="text-gray-600 mb-3">
                        {step.description}
                      </p>
                      
                      {isExpanded && (
                        <div className="bg-blue-50 rounded-lg p-4 mt-3 border border-blue-100">
                          <p className="text-blue-800 text-sm">{step.details}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                    className="ml-4 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Prêt à commencer votre parcours vers un meilleur sommeil ?
            </h3>
            <p className="text-blue-100 text-lg mb-6">
              Rejoignez des milliers de patients qui ont déjà transformé leur qualité de vie
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                Créer mon compte gratuit
              </button>
              
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-all">
                Voir la démo
              </button>
            </div>
            
            <div className="mt-6 flex items-center justify-center text-sm text-blue-200">
              <CheckCircle className="w-4 h-4 mr-2" />
              Aucune carte de crédit requise • Essai gratuit de 14 jours
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}