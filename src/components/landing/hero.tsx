// src/components/landing/hero.tsx
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center text-center bg-blue-800 text-white">
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-40"></div>
      <div className="relative z-10 max-w-3xl p-4">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
          Optimisez le suivi de vos patients apnéiques.
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-gray-200">
          La plateforme collaborative qui relie médecins du sommeil et patients pour un parcours de soin simplifié et efficace.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-4 justify-center">
          <Link href="/auth/register-doctor" className="bg-white text-blue-700 px-6 py-3 sm:px-8 sm:py-3 rounded-full font-bold text-base sm:text-lg hover:bg-gray-200 text-center">
            Je suis un professionnel
          </Link>
          <Link href="/auth/register" className="bg-blue-600 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-full font-bold text-base sm:text-lg hover:bg-blue-500 border-2 border-white text-center">
            Je suis un patient
          </Link>
        </div>
      </div>
    </section>
  );
}