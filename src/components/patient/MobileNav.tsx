// src/components/patient/MobileNav.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Calendar, FileText, History, MessageSquare, User, X } from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Menu */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            <Link
              href="/dashboard/patient"
              onClick={onClose}
              className="flex items-center px-3 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Home className="w-5 h-5 mr-3" />
              Accueil
            </Link>

            <Link
              href="/dashboard/patient/todo"
              onClick={onClose}
              className="flex items-center px-3 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <FileText className="w-5 h-5 mr-3" />
              À faire
            </Link>

            <Link
              href="/dashboard/patient/history"
              onClick={onClose}
              className="flex items-center px-3 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <History className="w-5 h-5 mr-3" />
              Historique
            </Link>

            <Link
              href="/dashboard/patient/documents"
              onClick={onClose}
              className="flex items-center px-3 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <FileText className="w-5 h-5 mr-3" />
              Documents
            </Link>

            <Link
              href="/dashboard/patient/messagerie"
              onClick={onClose}
              className="flex items-center px-3 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              Messagerie
            </Link>

            <Link
              href="/dashboard/patient/profil"
              onClick={onClose}
              className="flex items-center px-3 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <User className="w-5 h-5 mr-3" />
              Profil
            </Link>
          </div>
        </nav>

        {/* Déconnexion */}
        <div className="p-4 border-t border-gray-200">
          <form action={async () => {
            'use server';
            // Logique de déconnexion
            onClose();
          }}>
            <button
              type="submit"
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}