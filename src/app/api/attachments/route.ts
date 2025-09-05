import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const messageId = formData.get('messageId') as string;

    if (!file || !messageId) {
      return NextResponse.json(
        { error: 'Fichier et messageId sont obligatoires' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est un médecin
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctor) {
      return NextResponse.json(
        { error: 'Docteur non trouvé ou non autorisé' },
        { status: 403 }
      );
    }

    // Vérifier que le message appartient au médecin
    const { data: message } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (!message || message.sender_id !== doctor.id) {
      return NextResponse.json(
        { error: 'Message non trouvé ou non autorisé' },
        { status: 403 }
      );
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `attachment_${timestamp}.${fileExtension}`;
    const filePath = `attachments/${messageId}/${fileName}`;

    // Uploader le fichier vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('messaging-attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erreur lors de l\'upload:', uploadError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload du fichier' },
        { status: 500 }
      );
    }

    // Enregistrer la pièce jointe dans la base de données
    const { data: attachment, error: attachmentError } = await supabase
      .from('attachments')
      .insert({
        message_id: messageId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type
      })
      .select('*')
      .single();

    if (attachmentError) {
      console.error('Erreur lors de l\'enregistrement:', attachmentError);
      
      // Supprimer le fichier uploadé en cas d'erreur
      await supabase.storage
        .from('messaging-attachments')
        .remove([filePath]);

      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement de la pièce jointe' },
        { status: 500 }
      );
    }

    console.log('Pièce jointe uploadée avec succès:', attachment.id);
    
    // Invalider le cache pour la messagerie
    revalidatePath('/dashboard/doctor/messagerie');
    revalidatePath('/dashboard/patient/messagerie');

    return NextResponse.json({ 
      success: true, 
      attachment 
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
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId est requis' },
        { status: 400 }
      );
    }

    // Récupérer les pièces jointes pour le message
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des pièces jointes:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des pièces jointes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attachments }, { status: 200 });

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}