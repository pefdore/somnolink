'use client';

import Link from 'next/link';
import { useState } from 'react';

export function ModernHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SL</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Somnolink
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
              Fonctionnalités
            </Link>
            <Link href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">
              Comment ça marche
            </Link>
            <Link href="/auth/login" className="text-gray-700 hover:text-blue-600 transition-colors">
              Connexion
            </Link>
            <Link 
              href="/doctor-presentation" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Vous êtes médecin ?
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">
                Comment ça marche
              </Link>
              <Link href="/auth/login" className="text-gray-700 hover:text-blue-600 transition-colors">
                Connexion
              </Link>
              <Link 
                href="/doctor-presentation" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-semibold text-center hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Vous êtes médecin ?
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}