import { NextRequest, NextResponse } from 'next/server';

// Interface pour les médicaments de l'API française
interface FrenchMedicament {
  cis: string;
  denomination: string;
  forme_pharmaceutique: string;
  voies_administration: string[];
  statut_autorisation: string;
  titulaire: string;
  date_amm: string;
  presentations?: Array<{
    cip13: string;
    libelle: string;
    statut_administratif: string;
    etat_commercialisation: string;
    date_declaration_commercialisation: string;
    taux_remboursement?: string;
    prix?: number;
  }>;
}

// Interface pour la réponse formatée
interface FormattedMedicament {
  id: string;
  name: string;
  type: 'medicament';
  source: 'fr-gouv';
  pharmaceuticalForm: string;
  administrationRoutes: string[];
  authorizationStatus: string;
  holder: string;
  ammDate: string;
  presentations: Array<{
    cip13: string;
    label: string;
    administrativeStatus: string;
    commercializationStatus: string;
    commercializationDate: string;
    reimbursementRate?: string;
    price?: number;
  }>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!query) {
    return NextResponse.json(
      { error: 'Le paramètre de recherche "q" est requis' },
      { status: 400 }
    );
  }

  if (query.length < 2) {
    return NextResponse.json(
      { error: 'La recherche doit contenir au moins 2 caractères' },
      { status: 400 }
    );
  }

  try {
    console.log('🔍 Recherche médicaments français:', query, 'limit:', limit);

    // Recherche dans l'API française des médicaments
    const apiUrl = `https://medicaments.api.gouv.fr/api/medicaments?query=${encodeURIComponent(query)}&limit=${limit}`;
    console.log('🌐 URL API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Somnolink-Medical-App/1.0'
      },
      // Timeout de 10 secondes
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error('❌ Erreur API française:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Erreur API: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Données reçues de l\'API française:', data.length || 0, 'résultats');

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({
        success: true,
        medications: [],
        total: 0,
        message: 'Aucun médicament trouvé'
      });
    }

    // Transformation des données pour le frontend
    // Chaque présentation devient un résultat séparé pour permettre la sélection du dosage
    const formattedResults: FormattedMedicament[] = [];

    data.forEach((med: FrenchMedicament) => {
      const baseMedicament = {
        type: 'medicament' as const,
        source: 'fr-gouv' as const,
        pharmaceuticalForm: med.forme_pharmaceutique,
        administrationRoutes: med.voies_administration || [],
        authorizationStatus: med.statut_autorisation,
        holder: med.titulaire,
        ammDate: med.date_amm
      };

      // Si le médicament a des présentations, créer un résultat par présentation
      if (med.presentations && med.presentations.length > 0) {
        med.presentations.forEach((pres: any, index: number) => {
          formattedResults.push({
            ...baseMedicament,
            id: `${med.cis}-${pres.cip13}`, // ID unique combinant CIS et CIP13
            name: `${med.denomination} - ${pres.libelle}`, // Inclure le libellé de présentation dans le nom
            presentations: [{
              cip13: pres.cip13,
              label: pres.libelle,
              administrativeStatus: pres.statut_administratif,
              commercializationStatus: pres.etat_commercialisation,
              commercializationDate: pres.date_declaration_commercialisation,
              reimbursementRate: pres.taux_remboursement,
              price: pres.prix
            }]
          });
        });
      } else {
        // Si pas de présentations, garder le format original
        formattedResults.push({
          ...baseMedicament,
          id: med.cis,
          name: med.denomination,
          presentations: []
        });
      }
    });

    console.log('✅ Résultats formatés:', formattedResults.length);

    return NextResponse.json({
      success: true,
      medications: formattedResults,
      total: formattedResults.length,
      source: 'fr-gouv',
      query: query
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la recherche de médicaments français:', error);

    // Gestion spécifique des erreurs de timeout
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout: L\'API française ne répond pas' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne lors de la recherche de médicaments' },
      { status: 500 }
    );
  }
}

// Gestion des autres méthodes HTTP
export async function POST() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  );
}