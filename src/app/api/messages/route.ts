import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sendNewMessageNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { patientId, content, allowReply } = await request.json();

    // Validation des champs obligatoires
    if (!patientId || !content) {
      return NextResponse.json(
        { error: 'Les champs patientId et content sont obligatoires' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est un médecin
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id, first_name, last_name')
      .eq('user_id', user.id)
      .single();

    if (doctorError || !doctor) {
      return NextResponse.json(
        { error: 'Docteur non trouvé ou non autorisé' },
        { status: 403 }
      );
    }

    // Vérifier que le patient existe
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email, user_id')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier ou créer une conversation
    let conversationId;

    // Chercher une conversation existante entre ce médecin et ce patient
    const { data: existingConversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('doctor_id', doctor.id)
      .eq('patient_id', patient.id)
      .single();

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // Créer une nouvelle conversation
      const { data: newConversation, error: newConvError } = await supabase
        .from('conversations')
        .insert({
          doctor_id: doctor.id,
          patient_id: patient.id,
          last_message: content,
          last_message_at: new Date().toISOString(),
          unread_count_doctor: 0,
          allow_patient_reply: allowReply || false
        })
        .select('id')
        .single();

      if (newConvError) {
        console.error('Erreur lors de la création de la conversation:', newConvError);
        return NextResponse.json(
          { error: 'Erreur lors de la création de la conversation' },
          { status: 500 }
        );
      }

      conversationId = newConversation.id;
    }

    // Insérer le message dans la base de données
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: doctor.id,
        receiver_id: patient.id,
        conversation_id: conversationId,
        sender_type: 'doctor',
        content: content,
        allow_reply: allowReply || false
      })
      .select('*')
      .single();

    if (messageError) {
      console.error('Erreur lors de l\'insertion du message:', messageError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du message' },
        { status: 500 }
      );
    }

    // Mettre à jour la conversation avec le dernier message
    const { error: updateConvError } = await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        unread_count_doctor: 0
      })
      .eq('id', conversationId);

    if (updateConvError) {
      console.error('Erreur lors de la mise à jour de la conversation:', updateConvError);
    }

    // Créer une notification pour le patient
    const { error: notificationError } = await supabase
      .from('message_notifications')
      .insert({
        message_id: message.id,
        user_id: patient.user_id,
        type: 'message',
        is_read: false
      });

    if (notificationError) {
      console.error('Erreur lors de la création de la notification:', notificationError);
    }

    // Envoyer un email de notification au patient
    if (patient.email) {
      await sendNewMessageNotification(
        patient.email,
        `${patient.first_name} ${patient.last_name}`,
        `${doctor.first_name} ${doctor.last_name}`,
        content
      );
    } else {
      console.warn('Patient email not found, skipping email notification');
    }

    console.log('Message envoyé avec succès:', message.id);
    
    // Invalider le cache pour les pages de messagerie
    revalidatePath('/dashboard/doctor/messagerie');
    revalidatePath('/dashboard/patient/messagerie');

    return NextResponse.json({ 
      success: true, 
      message: message 
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const patientId = searchParams.get('patientId');

    // Déterminer si l'utilisateur est un médecin ou un patient
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctor && !patient) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (doctor) {
      // Médecin: voir les messages envoyés ou reçus (si le patient a répondu)
      query = query.or(`sender_id.eq.${doctor.id},receiver_id.eq.${doctor.id}`);
    } else if (patient) {
      // Patient: voir les messages reçus ou envoyés (si autorisé)
      query = query.or(`sender_id.eq.${patient.id},receiver_id.eq.${patient.id}`);
    }

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    if (patientId && doctor) {
      // Filtrer par patient spécifique pour le médecin
      query = query.eq('receiver_id', patientId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages }, { status: 200 });

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}