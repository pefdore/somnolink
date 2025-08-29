// src/components/landing/header.tsx
import Link from 'next/link';

export function Header() {
  return (
    <header className="absolute top-0 left-0 w-full z-10 p-4 bg-transparent">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <Link href="/" className="text-2xl font-bold text-white">
          Somnolink
        </Link>
        <nav className="flex flex-col sm:flex-row items-center gap-4 sm:gap-4">
          <Link href="#features" className="text-white hover:text-gray-200">Fonctionnalités</Link>
          <Link href="#pricing" className="text-white hover:text-gray-200">Tarifs</Link>
          <Link href="/auth/login" className="bg-white text-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-gray-100">
            Se connecter
          </Link>
        </nav>
      </div>
    </header>
  );
}