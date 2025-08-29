'use client';

import Link from 'next/link';
import { ArrowRight, Play, Shield, Star, Users } from 'lucide-react';

export function PatientHero() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4 mr-2" />
              Plateforme sécurisée de suivi médical
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Reprenez le contrôle de votre 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {' '}santé du sommeil
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Suivez votre traitement d&apos;apnée du sommeil en toute simplicité. 
              Restez connecté avec votre médecin et optimisez votre bien-être au quotidien.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-8 justify-center lg:justify-start">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-semibold text-gray-900">+2,000 patients</span>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="font-semibold text-gray-900">4.8/5 satisfaction</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
              <Link
                href="/auth/register"
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button className="group flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <Play className="w-5 h-5 text-blue-600 ml-1" />
                </div>
                <span className="ml-3 font-medium">Voir la démo</span>
              </button>
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center lg:justify-start text-sm text-gray-500">
              <Shield className="w-4 h-4 mr-2" />
              Données médicales sécurisées et cryptées
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-blue-600 font-bold">📊</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Suivi quotidien</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-green-600 font-bold">💬</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Messagerie sécurisée</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-purple-600 font-bold">📋</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Questionnaires</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-orange-600 font-bold">⏰</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Rappels intelligents</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">SL</span>
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">Votre espace patient</p>
                      <p className="text-sm text-gray-500">Tout votre suivi en un lieu</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Adhérence traitement</span>
                      <span className="text-sm font-semibold text-green-600">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full opacity-50"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-100 rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </section>
  );
}