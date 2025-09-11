import { NextRequest, NextResponse } from 'next/server';

interface DoctorRecord {
  nom: string;
  prenom: string;
  specialite: string;
  ville: string;
  departement: string;
  numero_rpps: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        error: 'Query parameter is required and must be at least 2 characters'
      }, { status: 400 });
    }

    // API OpenDataSoft pour les médecins en France
    const apiUrl = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=medecins&q=${encodeURIComponent(query)}&rows=${limit}&sort=score`;

    console.log('🔍 [DOCTOR SEARCH] Calling API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Transformer les données pour notre format - filtrer uniquement les médecins
    const doctors = data.records
      .filter((record: any) => {
        const profession = record.fields.libelle_profession || '';
        // Garder les médecins généralistes et autres types de médecins
        return profession.toLowerCase().includes('médecin') ||
               profession.toLowerCase().includes('docteur') ||
               profession.toLowerCase().includes('généraliste');
      })
      .map((record: any) => ({
        id: record.recordid,
        nom: record.fields.nom || '',
        prenom: record.fields.prenom || '',
        specialite: record.fields.libelle_profession || 'Médecin généraliste',
        ville: record.fields.commune || record.fields.ville || '',
        departement: record.fields.dep_name || record.fields.departement || '',
        numero_rpps: record.fields.numero_rpps || record.fields.column_10 || '',
        fullName: `${record.fields.prenom || ''} ${record.fields.nom || ''}`.trim(),
        displayName: `${record.fields.prenom || ''} ${record.fields.nom || ''} - ${record.fields.libelle_profession || 'Médecin'} (${record.fields.commune || record.fields.ville || ''})`.trim()
      }));

    return NextResponse.json({
      success: true,
      doctors,
      total: data.nhits || 0
    });

  } catch (error) {
    console.error('Error searching doctors:', error);
    return NextResponse.json({
      error: 'Failed to search doctors',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}