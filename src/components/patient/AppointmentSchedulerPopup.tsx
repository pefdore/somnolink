'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, Loader2 } from 'lucide-react';

interface AppointmentSchedulerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName: string;
  doctorToken?: string; // Optionnel maintenant
  doctorId?: string; // Nouvel option pour l'ID du médecin
  onSchedule: (appointmentData: AppointmentData) => void;
}

interface AppointmentData {
  date: string;
  time: string;
  type: string;
  notes?: string;
}

const consultationTypes = [
  { value: 'first_consultation', label: '1ère consultation' },
  { value: 'followup_4months_ppc', label: 'Consultation à 4 mois de la mise en place de la PPC' },
  { value: 'followup_4months_oam', label: 'Consultation à 4 mois de la mise en place de l\'OAM' },
  { value: 'annual_ppc', label: 'Consultation annuelle PPC' },
  { value: 'annual_oam', label: 'Consultation annuelle OAM' },
  { value: 'other', label: 'Autre consultation' }
];

export default function AppointmentSchedulerPopup({
  isOpen,
  onClose,
  doctorName,
  doctorToken,
  doctorId,
  onSchedule
}: AppointmentSchedulerPopupProps) {
  const [loading, setLoading] = useState(false);
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    date: '',
    time: '',
    type: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentData.date || !appointmentData.time || !appointmentData.type) {
      return;
    }

    setLoading(true);
    try {
      // Préparer les données selon le mode (token ou ID)
      const requestData = {
        ...appointmentData,
        ...(doctorToken ? { doctorToken } : {}),
        ...(doctorId ? { doctorId } : {})
      };

      console.log('🔍 [DEBUG] Envoi de la requête à /api/appointments avec données:', requestData);

      // Envoyer les données à l'API
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('🔍 [DEBUG] Réponse reçue:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 [DEBUG] Résultat:', result);
        onSchedule({ ...appointmentData, ...result.appointment });
      } else {
        const errorText = await response.text();
        console.error('Erreur lors de la programmation du rendez-vous:', response.status, errorText);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programmer votre rendez-vous
          </DialogTitle>
          <DialogDescription>
            Indiquez la date et le motif de votre prochain rendez-vous avec le Dr. {doctorName}.
            Cette information permettra au médecin de préparer votre consultation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Date du rendez-vous
              </Label>
              <Input
                id="date"
                type="date"
                value={appointmentData.date}
                onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                required
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Heure
              </Label>
              <Input
                id="time"
                type="time"
                value={appointmentData.time}
                onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Motif de la consultation
            </Label>
            <Select
              value={appointmentData.type}
              onValueChange={(value) => setAppointmentData({...appointmentData, type: value})}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le motif" />
              </SelectTrigger>
              <SelectContent>
                {consultationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes complémentaires (optionnel)</Label>
            <Textarea
              id="notes"
              value={appointmentData.notes}
              onChange={(e) => setAppointmentData({...appointmentData, notes: e.target.value})}
              placeholder="Informations supplémentaires pour le médecin..."
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Plus tard
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !appointmentData.date || !appointmentData.time || !appointmentData.type}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Programmer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}