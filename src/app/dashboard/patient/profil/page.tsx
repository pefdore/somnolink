// src/app/dashboard/patient/profil/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// On définit un type pour le profil patient pour plus de clarté
type PatientProfile = {
  first_name: string;
  last_name: string;
  phone_number: string;
  attending_doctor_name: string | null;
  email: string;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
} | null;

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PatientProfile>(null);

  // States pour les champs du formulaire
  const [phoneNumber, setPhoneNumber] = useState('');
  const [attendingDoctorName, setAttendingDoctorName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // States pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const [message, setMessage] = useState('');

  // Au chargement de la page, on récupère les infos de l'utilisateur et son profil
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data, error } = await supabase
          .from('patients')
          .select('first_name, last_name, phone_number, attending_doctor_name, email, date_of_birth, address, city, postal_code')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
          // On pré-remplit les champs du formulaire avec les données existantes
          setPhoneNumber(data.phone_number || '');
          setAttendingDoctorName(data.attending_doctor_name || '');
          setDateOfBirth(data.date_of_birth || '');
          setAddress(data.address || '');
          setCity(data.city || '');
          setPostalCode(data.postal_code || '');
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [supabase]);

  // Fonction pour mettre à jour le profil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!user) return;

    const { error } = await supabase
      .from('patients')
      .update({
        phone_number: phoneNumber,
        attending_doctor_name: attendingDoctorName,
        date_of_birth: dateOfBirth || null,
        address: address || null,
        city: city || null,
        postal_code: postalCode || null,
      })
      .eq('user_id', user.id);

    if (error) {
      setMessage(`Erreur lors de la mise à jour : ${error.message}`);
    } else {
      setMessage('Profil mis à jour avec succès !');
    }
  };

  // Fonction pour changer le mot de passe
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordMessage('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setPasswordMessage(`Erreur lors du changement de mot de passe : ${error.message}`);
    } else {
      setPasswordMessage('Mot de passe changé avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Chargement de votre profil...</div>;
  }

  if (!profile) {
    return <div className="flex justify-center items-center min-h-screen">Profil introuvable.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Mon profil</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* Section des informations personnelles */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Informations personnelles</h2>
          <p className="text-gray-600 mb-6">
            Modifiez vos informations de contact et personnelles
          </p>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={profile.first_name}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={profile.last_name}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor">Médecin traitant</Label>
              <Input
                id="doctor"
                type="text"
                value={attendingDoctorName}
                onChange={(e) => setAttendingDoctorName(e.target.value)}
                placeholder="Nom de votre médecin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date de naissance</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Votre adresse"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ville"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Code postal"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Enregistrer les modifications
            </Button>

            {message && (
              <p className={`text-center ${message.includes('Erreur') ? 'text-destructive' : 'text-green-600'}`}>
                {message}
              </p>
            )}
          </form>
        </div>

        {/* Section de changement de mot de passe */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Sécurité</h2>
          <p className="text-gray-600 mb-6">
            Changez votre mot de passe
          </p>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                required
              />
            </div>

            <Button type="submit" className="w-full" variant="outline">
              Changer le mot de passe
            </Button>

            {passwordMessage && (
              <p className={`text-center ${passwordMessage.includes('Erreur') ? 'text-destructive' : 'text-green-600'}`}>
                {passwordMessage}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}