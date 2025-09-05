'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Copy, CheckCircle, Loader2, LinkIcon, Mail, Send } from 'lucide-react';

export default function DoctorInvitationsPage() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [doctor, setDoctor] = useState<any>(null);
  const [invitationEnabled, setInvitationEnabled] = useState(false);
  const [invitationToken, setInvitationToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('doctors')
        .select('id, first_name, last_name, public_invitation_token, public_invitation_enabled')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        setError('Erreur lors du chargement des données');
        return;
      }

      if (data) {
        setDoctor(data);
        setInvitationEnabled(data.public_invitation_enabled || false);
        setInvitationToken(data.public_invitation_token || '');
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const generateInvitationLink = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Générer un nouveau token via la fonction RPC
      const { data, error } = await supabase
        .rpc('generate_public_invitation_token');

      if (error) {
        setError('Erreur lors de la génération du lien');
        return;
      }

      // Mettre à jour le médecin avec le nouveau token
      const { error: updateError } = await supabase
        .from('doctors')
        .update({ 
          public_invitation_token: data,
          public_invitation_enabled: true 
        })
        .eq('id', doctor.id);

      if (updateError) {
        setError('Erreur lors de la mise à jour');
        return;
      }

      setInvitationToken(data);
      setInvitationEnabled(true);
      setSuccess('Lien d\'invitation généré avec succès');
    } catch (err) {
      setError('Erreur lors de la génération du lien');
    } finally {
      setSaving(false);
    }
  };

  const toggleInvitation = async (enabled: boolean) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('doctors')
        .update({ public_invitation_enabled: enabled })
        .eq('id', doctor.id);

      if (error) {
        setError('Erreur lors de la mise à jour');
        return;
      }

      setInvitationEnabled(enabled);
      setSuccess(enabled ? 'Invitation activée' : 'Invitation désactivée');
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    if (!invitationToken) return;

    setCopying(true);
    try {
      const invitationLink = `${window.location.origin}/join/${invitationToken}`;
      await navigator.clipboard.writeText(invitationLink);
      setSuccess('Lien copié dans le presse-papier');
      
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      setError('Erreur lors de la copie');
      setCopying(false);
    }
  };

  const getInvitationLink = () => {
    if (!invitationToken) return '';
    return `${window.location.origin}/join/${invitationToken}`;
  };

  const sendEmailInvitation = async () => {
    if (!email || !invitationToken) return;
    
    setSendingEmail(true);
    setError(null);
    setSuccess(null);

    try {
      const invitationLink = getInvitationLink();
      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          invitationLink: invitationLink,
          doctorName: doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Votre médecin'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi de l\'email');
      }

      setSuccess('Email d\'invitation envoyé avec succès');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Liens d'invitation</h1>
          <p className="text-gray-600">
            Générez et partagez votre lien d'invitation personnel pour vos patients
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-red-600 mr-2" />
              <h3 className="font-medium text-red-800">Erreur</h3>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <h3 className="font-medium text-green-800">Succès</h3>
            </div>
            <p className="text-green-700 mt-1">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Lien d'invitation personnel</h2>
              <p className="text-gray-600">Activez et partagez votre lien unique</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Label htmlFor="invitation-toggle" className="text-sm font-medium">
                {invitationEnabled ? 'Activé' : 'Désactivé'}
              </Label>
              <Switch
                id="invitation-toggle"
                checked={invitationEnabled}
                onCheckedChange={toggleInvitation}
                disabled={saving || !invitationToken}
              />
            </div>
          </div>

          {!invitationToken ? (
            <div className="text-center py-8">
              <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun lien généré</h3>
              <p className="text-gray-600 mb-4">
                Générez votre premier lien d'invitation pour commencer à inviter des patients
              </p>
              <Button onClick={generateInvitationLink} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Générer mon lien
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="invitation-link">Votre lien d'invitation</Label>
                <div className="flex gap-2">
                  <Input
                    id="invitation-link"
                    value={getInvitationLink()}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={copyToClipboard} disabled={copying}>
                    {copying ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={generateInvitationLink} variant="outline" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
                  Régénérer le lien
                </Button>
                
                {invitationEnabled && (
                  <Button onClick={copyToClipboard} disabled={copying}>
                    {copying ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copié!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copier le lien
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section d'envoi d'email */}
        {invitationToken && invitationEnabled && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Envoyer une invitation par email</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="patient-email">Email du patient</Label>
                <Input
                  id="patient-email"
                  type="email"
                  placeholder="patient@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={sendEmailInvitation}
                disabled={sendingEmail || !email || !invitationEnabled}
                className="w-full"
              >
                {sendingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Envoyer l'invitation par email
              </Button>

              <p className="text-sm text-gray-600">
                Le patient recevra un email avec votre lien d'invitation personnel pour rejoindre la plateforme.
              </p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Comment utiliser</h3>
            <ul className="text-blue-800 space-y-2 text-sm">
              <li>• Copiez le lien et partagez-le avec vos patients</li>
              <li>• Ajoutez-le dans vos emails de confirmation Doctolib</li>
              <li>• Les patients pourront créer un compte et s'associer automatiquement</li>
              <li>• Vous pouvez désactiver le lien à tout moment</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-green-900 mb-3">Bon à savoir</h3>
            <ul className="text-green-800 space-y-2 text-sm">
              <li>• Le lien est unique et personnel à votre compte</li>
              <li>• Régénérez le lien si vous pensez qu'il a été compromis</li>
              <li>• Désactivez-le temporairement si nécessaire</li>
              <li>• Les patients existants peuvent aussi utiliser ce lien</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}