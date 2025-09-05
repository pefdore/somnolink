// src/app/dashboard/patient/profil/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// On définit un type pour le profil patient pour plus de clarté
type PatientProfile = {
   first_name: string;
   last_name: string;
   phone_number: string;
   email: string;
   date_of_birth: string | null;
   address: string | null;
   city: string | null;
   postal_code: string | null;
   gender: string | null;
   emergency_contact_name: string | null;
   emergency_contact_phone: string | null;
   emergency_contact_relationship: string | null;
   insurance_provider: string | null;
   insurance_number: string | null;
   insurance_expiry_date: string | null;
   allergies: string | null;
   current_medications: string | null;
   medical_conditions: string | null;
   sleep_schedule: string | null;
   sleep_quality: string | null;
   preferred_language: string | null;
} | null;

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PatientProfile>(null);

  // States pour les champs du formulaire
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [gender, setGender] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [sleepSchedule, setSleepSchedule] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('fr');

  // States pour le changement de mot de passe
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Fonction de validation
  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    // Validation du numéro de téléphone
    if (phoneNumber && !/^[\+]?[0-9\s\-\(\)]+$/.test(phoneNumber)) {
      errors.phone = 'Format de numéro de téléphone invalide';
    }

    // Validation du numéro d'urgence
    if (emergencyContactPhone && !/^[\+]?[0-9\s\-\(\)]+$/.test(emergencyContactPhone)) {
      errors.emergencyPhone = 'Format de numéro d\'urgence invalide';
    }

    // Validation de la date de naissance (doit être dans le passé)
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        errors.dateOfBirth = 'La date de naissance doit être dans le passé';
      }
    }

    // Validation de la date d'expiration d'assurance (doit être dans le futur)
    if (insuranceExpiryDate) {
      const expiryDate = new Date(insuranceExpiryDate);
      const today = new Date();
      if (expiryDate < today) {
        errors.insuranceExpiry = 'La date d\'expiration doit être dans le futur';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Au chargement de la page, on récupère les infos de l'utilisateur et son profil
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        try {
          // Essayer d'abord l'API
          const response = await fetch('/api/patient-profile');
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              setProfile(data.data);
              populateFormFields(data.data);
            }
          } else {
            // Fallback: utiliser Supabase client directement avec gestion d'erreur
            console.log('API non disponible, utilisation du fallback Supabase client');
            await fetchProfileFallback(user);
          }
        } catch (error) {
          console.error('Erreur API, utilisation du fallback:', error);
          await fetchProfileFallback(user);
        }
      }
      setLoading(false);
    };

    const fetchProfileFallback = async (user: any) => {
      try {
        // Essayer d'abord les champs de base qui existent toujours
        const { data: basicData, error: basicError } = await supabase
          .from('patients')
          .select('first_name, last_name, phone_number, email, date_of_birth, address, city, postal_code')
          .eq('user_id', user.id)
          .single();

        if (basicError) {
          console.error('Erreur récupération profil de base:', basicError);
          return;
        }

        // Essayer les nouveaux champs (peuvent ne pas exister)
        let extendedData = {};
        try {
          const { data: extendedResult } = await supabase
            .from('patients')
            .select('gender, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, insurance_provider, insurance_number, insurance_expiry_date, allergies, current_medications, medical_conditions, sleep_schedule, sleep_quality, preferred_language')
            .eq('user_id', user.id)
            .single();

          if (extendedResult) {
            extendedData = extendedResult;
          }
        } catch (extendedError) {
          console.log('Nouveaux champs non disponibles, valeurs par défaut utilisées');
        }

        const profileData = { ...basicData, ...extendedData };
        setProfile(profileData);
        populateFormFields(profileData);

      } catch (error) {
        console.error('Erreur lors du chargement du profil (fallback):', error);
      }
    };

    const populateFormFields = (data: any) => {
      setPhoneNumber(data.phone_number || '');
      setDateOfBirth(data.date_of_birth || '');
      setAddress(data.address || '');
      setCity(data.city || '');
      setPostalCode(data.postal_code || '');
      setGender(data.gender || '');
      setEmergencyContactName(data.emergency_contact_name || '');
      setEmergencyContactPhone(data.emergency_contact_phone || '');
      setEmergencyContactRelationship(data.emergency_contact_relationship || '');
      setInsuranceProvider(data.insurance_provider || '');
      setInsuranceNumber(data.insurance_number || '');
      setInsuranceExpiryDate(data.insurance_expiry_date || '');
      setAllergies(data.allergies || '');
      setCurrentMedications(data.current_medications || '');
      setMedicalConditions(data.medical_conditions || '');
      setSleepSchedule(data.sleep_schedule || '');
      setSleepQuality(data.sleep_quality || '');
      setPreferredLanguage(data.preferred_language || 'fr');
    };

    fetchProfile();
  }, [supabase]);

  // Fonction pour mettre à jour le profil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setValidationErrors({});

    if (!user) return;

    // Validation du formulaire
    if (!validateForm()) {
      setMessage('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      // Essayer d'abord l'API
      const response = await fetch('/api/patient-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          date_of_birth: dateOfBirth || null,
          address: address || null,
          city: city || null,
          postal_code: postalCode || null,
          gender: gender || null,
          emergency_contact_name: emergencyContactName || null,
          emergency_contact_phone: emergencyContactPhone || null,
          emergency_contact_relationship: emergencyContactRelationship || null,
          insurance_provider: insuranceProvider || null,
          insurance_number: insuranceNumber || null,
          insurance_expiry_date: insuranceExpiryDate || null,
          allergies: allergies || null,
          current_medications: currentMedications || null,
          medical_conditions: medicalConditions || null,
          sleep_schedule: sleepSchedule || null,
          sleep_quality: sleepQuality || null,
          preferred_language: preferredLanguage || 'fr',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Profil mis à jour avec succès !');
        // Recharger les données du profil
        const fetchResponse = await fetch('/api/patient-profile');
        if (fetchResponse.ok) {
          const profileData = await fetchResponse.json();
          if (profileData.data) {
            setProfile(profileData.data);
          }
        }
      } else {
        // Fallback: utiliser Supabase client directement
        console.log('API non disponible, utilisation du fallback Supabase client');
        await updateProfileFallback();
      }
    } catch (error) {
      console.error('Erreur API, utilisation du fallback:', error);
      await updateProfileFallback();
    }
  };

  const updateProfileFallback = async () => {
    try {
      // Mise à jour des champs de base qui existent toujours
      const baseUpdateData: any = {
        phone_number: phoneNumber || null,
        date_of_birth: dateOfBirth || null,
        address: address || null,
        city: city || null,
        postal_code: postalCode || null,
      };

      // Essayer de mettre à jour les nouveaux champs (peuvent ne pas exister)
      const extendedUpdateData: any = {};
      if (gender) extendedUpdateData.gender = gender;
      if (emergencyContactName) extendedUpdateData.emergency_contact_name = emergencyContactName;
      if (emergencyContactPhone) extendedUpdateData.emergency_contact_phone = emergencyContactPhone;
      if (emergencyContactRelationship) extendedUpdateData.emergency_contact_relationship = emergencyContactRelationship;
      if (insuranceProvider) extendedUpdateData.insurance_provider = insuranceProvider;
      if (insuranceNumber) extendedUpdateData.insurance_number = insuranceNumber;
      if (insuranceExpiryDate) extendedUpdateData.insurance_expiry_date = insuranceExpiryDate;
      if (allergies) extendedUpdateData.allergies = allergies;
      if (currentMedications) extendedUpdateData.current_medications = currentMedications;
      if (medicalConditions) extendedUpdateData.medical_conditions = medicalConditions;
      if (sleepSchedule) extendedUpdateData.sleep_schedule = sleepSchedule;
      if (sleepQuality) extendedUpdateData.sleep_quality = sleepQuality;
      if (preferredLanguage) extendedUpdateData.preferred_language = preferredLanguage;

      const updateData = { ...baseUpdateData, ...extendedUpdateData };

      const { error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('user_id', user!.id);

      if (error) {
        console.error('Erreur mise à jour profil (fallback):', error);
        setMessage('Erreur lors de la mise à jour du profil');
      } else {
        setMessage('Profil mis à jour avec succès !');
        // Recharger les données du profil
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: basicData } = await supabase
            .from('patients')
            .select('first_name, last_name, phone_number, email, date_of_birth, address, city, postal_code')
            .eq('user_id', currentUser.id)
            .single();

          if (basicData) {
            let extendedData = {};
            try {
              const { data: extendedResult } = await supabase
                .from('patients')
                .select('gender, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, insurance_provider, insurance_number, insurance_expiry_date, allergies, current_medications, medical_conditions, sleep_schedule, sleep_quality, preferred_language')
                .eq('user_id', currentUser.id)
                .single();

              if (extendedResult) {
                extendedData = extendedResult;
              }
            } catch (extendedError) {
              console.log('Nouveaux champs non disponibles lors du rechargement');
            }

            const profileData = { ...basicData, ...extendedData };
            setProfile(profileData);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil (fallback):', error);
      setMessage('Erreur lors de la mise à jour du profil');
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
                className={validationErrors.phone ? 'border-red-500' : ''}
              />
              {validationErrors.phone && (
                <p className="text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>


            <div className="space-y-2">
              <Label htmlFor="dob">Date de naissance</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={validationErrors.dateOfBirth ? 'border-red-500' : ''}
              />
              {validationErrors.dateOfBirth && (
                <p className="text-sm text-red-600">{validationErrors.dateOfBirth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Genre</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Homme</SelectItem>
                  <SelectItem value="female">Femme</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                  <SelectItem value="prefer_not_to_say">Préfère ne pas dire</SelectItem>
                </SelectContent>
              </Select>
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

        {/* Section des informations médicales */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Informations médicales</h2>
          <p className="text-gray-600 mb-6">
            Partagez vos informations médicales importantes pour une meilleure prise en charge
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Listez vos allergies (séparées par des virgules)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Médicaments actuels</Label>
              <Textarea
                id="medications"
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
                placeholder="Listez vos médicaments actuels (séparés par des virgules)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions médicales</Label>
              <Textarea
                id="conditions"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder="Listez vos conditions médicales (séparées par des virgules)"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Section des informations de sommeil */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Informations sur le sommeil</h2>
          <p className="text-gray-600 mb-6">
            Aidez-nous à mieux comprendre vos habitudes de sommeil
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sleepSchedule">Horaires de sommeil habituels</Label>
              <Textarea
                id="sleepSchedule"
                value={sleepSchedule}
                onChange={(e) => setSleepSchedule(e.target.value)}
                placeholder="Ex: Je me couche vers 23h et me lève vers 7h"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sleepQuality">Qualité du sommeil</Label>
              <Select value={sleepQuality} onValueChange={setSleepQuality}>
                <SelectTrigger>
                  <SelectValue placeholder="Évaluez votre qualité de sommeil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Bon</SelectItem>
                  <SelectItem value="fair">Moyen</SelectItem>
                  <SelectItem value="poor">Mauvais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section des contacts d'urgence */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Contact d'urgence</h2>
          <p className="text-gray-600 mb-6">
            Informations pour nous contacter en cas d'urgence
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyName">Nom du contact</Label>
              <Input
                id="emergencyName"
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Nom complet du contact d'urgence"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Téléphone d'urgence</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+33 1 23 45 67 89"
                className={validationErrors.emergencyPhone ? 'border-red-500' : ''}
              />
              {validationErrors.emergencyPhone && (
                <p className="text-sm text-red-600">{validationErrors.emergencyPhone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyRelationship">Lien de parenté</Label>
              <Input
                id="emergencyRelationship"
                type="text"
                value={emergencyContactRelationship}
                onChange={(e) => setEmergencyContactRelationship(e.target.value)}
                placeholder="Ex: conjoint, parent, frère/sœur"
              />
            </div>
          </div>
        </div>

        {/* Section des informations d'assurance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Informations d'assurance</h2>
          <p className="text-gray-600 mb-6">
            Vos informations d'assurance santé (optionnel)
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="insuranceProvider">Assureur</Label>
              <Input
                id="insuranceProvider"
                type="text"
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                placeholder="Nom de votre assureur"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceNumber">Numéro de contrat</Label>
              <Input
                id="insuranceNumber"
                type="text"
                value={insuranceNumber}
                onChange={(e) => setInsuranceNumber(e.target.value)}
                placeholder="Numéro de votre contrat d'assurance"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceExpiry">Date d'expiration</Label>
              <Input
                id="insuranceExpiry"
                type="date"
                value={insuranceExpiryDate}
                onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                className={validationErrors.insuranceExpiry ? 'border-red-500' : ''}
              />
              {validationErrors.insuranceExpiry && (
                <p className="text-sm text-red-600">{validationErrors.insuranceExpiry}</p>
              )}
            </div>
          </div>
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