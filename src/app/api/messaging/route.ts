import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sendNewMessageNotification } from '@/lib/email';

// POST /api/messaging - Envoyer un message (médecin uniquement)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { patientId, content, allowReply = false } = await request.json();

    // Validation
    if (!patientId || !content?.trim()) {
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
        { error: 'Accès réservé aux médecins' },
        { status: 403 }
      );
    }

    // Vérifier que le patient existe et est associé au médecin
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

    // Vérifier l'association médecin-patient
    const { data: relationship, error: relError } = await supabase
      .from('patient_doctor_relationships')
      .select('id, status')
      .eq('doctor_id', doctor.id)
      .eq('patient_id', patient.id)
      .eq('status', 'active')
      .single();

    if (relError || !relationship) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas associé à ce patient' },
        { status: 403 }
      );
    }

    // Créer ou récupérer la conversation
    const { data: conversationId, error: convError } = await supabase
      .rpc('get_or_create_conversation', {
        p_doctor_id: doctor.id,
        p_patient_id: patient.id
      });

    if (convError) {
      console.error('Erreur création conversation:', convError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la conversation' },
        { status: 500 }
      );
    }

    // Insérer le message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: doctor.id,
        sender_type: 'doctor',
        content: content.trim(),
        allow_reply: allowReply
      })
      .select('*')
      .single();

    if (messageError) {
      console.error('Erreur insertion message:', messageError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du message' },
        { status: 500 }
      );
    }

    // Mettre à jour le résumé de la conversation
    await supabase.rpc('update_conversation_summary', {
      p_conversation_id: conversationId,
      p_last_message: content.trim(),
      p_sender_type: 'doctor'
    });

    // Créer une notification pour le patient
    const { error: notifError } = await supabase
      .from('message_notifications')
      .insert({
        message_id: message.id,
        user_id: patient.user_id,
        type: 'message',
        is_read: false
      });

    if (notifError) {
      console.error('Erreur création notification:', notifError);
    }

    // Envoyer un email de notification
    if (patient.email) {
      try {
        await sendNewMessageNotification(
          patient.email,
          `${patient.first_name} ${patient.last_name}`,
          `${doctor.first_name} ${doctor.last_name}`,
          content
        );
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError);
      }
    }

    // Invalider le cache
    revalidatePath('/dashboard/doctor/messagerie');
    revalidatePath('/dashboard/patient/messagerie');

    return NextResponse.json({
      success: true,
      message: message,
      conversationId: conversationId
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// GET /api/messaging - Récupérer les messages d'une conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId est requis' },
        { status: 400 }
      );
    }

    // Vérifier l'accès à la conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, doctor_id, patient_id, allow_patient_reply')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur fait partie de la conversation
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

    const hasAccess = (doctor && doctor.id === conversation.doctor_id) ||
                     (patient && patient.id === conversation.patient_id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Accès non autorisé à cette conversation' },
        { status: 403 }
      );
    }

    // Récupérer les messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        message_attachments (*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Erreur récupération messages:', messagesError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des messages' },
        { status: 500 }
      );
    }

    // Marquer comme lus si c'est le destinataire
    const userType = doctor ? 'doctor' : 'patient';
    await supabase.rpc('mark_messages_as_read', {
      p_conversation_id: conversationId,
      p_user_type: userType
    });

    return NextResponse.json({
      messages: messages || [],
      conversation: conversation
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/messaging - Autoriser/révoquer les réponses d'un patient
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { conversationId, allowReply } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId est requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est le médecin de la conversation
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctor) {
      return NextResponse.json(
        { error: 'Accès réservé aux médecins' },
        { status: 403 }
      );
    }

    // Mettre à jour les permissions de réponse
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        allow_patient_reply: allowReply,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('doctor_id', doctor.id);

    if (updateError) {
      console.error('Erreur mise à jour permissions:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour des permissions' },
        { status: 500 }
      );
    }

    revalidatePath('/dashboard/doctor/messagerie');
    revalidatePath('/dashboard/patient/messagerie');

    return NextResponse.json({
      success: true,
      allowReply: allowReply
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}