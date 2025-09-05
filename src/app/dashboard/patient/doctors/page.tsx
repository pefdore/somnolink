'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, UserPlus, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  city: string;
  status?: string;
}

export default function DoctorsSearchPage() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadMyDoctors();
  }, []);

  const loadMyDoctors = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Charger les médecins déjà associés
      const { data: relationships } = await supabase
        .from('patient_doctor_relationships')
        .select('doctor_id, status')
        .eq('patient_id', session.user.id);

      // Charger les informations des médecins
      if (relationships && relationships.length > 0) {
        const doctorIds = relationships.map(r => r.doctor_id);
        const { data: doctorsData } = await supabase
          .from('doctors')
          .select('id, first_name, last_name, specialty, city')
          .in('id', doctorIds);

        if (doctorsData) {
          const doctorsWithStatus = doctorsData.map(doctor => ({
            ...doctor,
            status: relationships.find(r => r.doctor_id === doctor.id)?.status
          }));
          setDoctors(doctorsWithStatus);
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des médecins');
    } finally {
      setLoading(false);
    }
  };

  const searchDoctors = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, first_name, last_name, specialty, city')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,specialty.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) {
        setError('Erreur lors de la recherche');
        return;
      }

      if (data) {
        // Filtrer les médecins déjà associés
        const filteredDoctors = data.filter(doctor => 
          !doctors.some(d => d.id === doctor.id)
        );
        setDoctors(prev => [...prev, ...filteredDoctors]);
      }
    } catch (err) {
      setError('Erreur lors de la recherche');
    } finally {
      setSearching(false);
    }
  };

  const requestAssociation = async (doctorId: string) => {
    setProcessing(doctorId);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .rpc('request_doctor_association', {
          p_doctor_id: doctorId
        });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess('Demande d\'association envoyée avec succès');
      
      // Mettre à jour le statut localement
      setDoctors(prev => prev.map(doctor =>
        doctor.id === doctorId ? { ...doctor, status: 'pending' } : doctor
      ));
    } catch (err) {
      setError('Erreur lors de l\'envoi de la demande');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Associé
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            En attente
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Refusé
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des médecins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Médecins</h1>
          <p className="text-gray-600">
            Recherchez et associez-vous à vos médecins du sommeil
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Rechercher un médecin</Label>
              <Input
                id="search"
                placeholder="Rechercher par nom, spécialité ou ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchDoctors()}
              />
            </div>
            <Button onClick={searchDoctors} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Rechercher
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                <h3 className="font-medium text-red-800">Erreur</h3>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <h3 className="font-medium text-green-800">Succès</h3>
              </div>
              <p className="text-green-700 mt-1">{success}</p>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Dr {doctor.first_name} {doctor.last_name}
                  </h3>
                  <p className="text-gray-600">{doctor.specialty}</p>
                  {doctor.city && (
                    <p className="text-gray-500 text-sm">{doctor.city}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {doctor.status && getStatusBadge(doctor.status)}
                  
                  {!doctor.status && (
                    <Button
                      onClick={() => requestAssociation(doctor.id)}
                      disabled={processing === doctor.id}
                      className="whitespace-nowrap"
                    >
                      {processing === doctor.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Demander association
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {doctors.length === 0 && !loading && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun médecin trouvé</h3>
              <p className="text-gray-600">
                Utilisez la recherche pour trouver vos médecins du sommeil
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}