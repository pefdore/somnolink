import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const country = searchParams.get('country') || 'fr';

  if (!query || query.length < 2) {
    return NextResponse.json({
      error: 'Query parameter required (minimum 2 characters)'
    }, { status: 400 });
  }

  try {
    let medications = [];

    // 🔍 Recherche en France via OpenMedic (GRATUIT - pas de clé API !)
    if (country === 'fr' || country === 'all') {
      console.log('🔍 Recherche OpenMedic pour:', query);
      const frenchResults = await searchOpenMedicMedications(query);
      medications.push(...frenchResults);
    }

    // 🔍 Recherche internationale via OpenFDA
    if (country === 'us' || country === 'all') {
      console.log('🔍 Recherche OpenFDA pour:', query);
      const internationalResults = await searchOpenFDAMedications(query);
      medications.push(...internationalResults);
    }

    // 🧹 Supprimer les doublons et trier par pertinence
    const uniqueMedications = removeDuplicates(medications);
    const sortedMedications = sortByRelevance(uniqueMedications, query);

    console.log(`✅ Trouvé ${sortedMedications.length} médicaments pour "${query}"`);

    return NextResponse.json({
      medications: sortedMedications.slice(0, 20),
      sources: country === 'all' ? ['openmedic', 'openfda'] : [country === 'fr' ? 'openmedic' : 'openfda'],
      query: query,
      country: country
    });

  } catch (error) {
    console.error('❌ Erreur recherche médicaments:', error);
    return NextResponse.json({
      error: 'Service temporairement indisponible',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

// 🔍 Fonction pour rechercher dans OpenMedic (France - GRATUIT)
async function searchOpenMedicMedications(query: string) {
  try {
    // OpenMedic API - pas de clé API requise !
    const response = await fetch(
      `https://www.open-medicaments.fr/api/v1/medicaments?query=${encodeURIComponent(query)}&limit=15`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Somnolink-Medical-App/1.0'
        },
        // Timeout de 5 secondes
        signal: AbortSignal.timeout(5000)
      }
    );

    if (!response.ok) {
      console.warn('⚠️ OpenMedic API response not ok:', response.status);
      return getFrenchMockData(query);
    }

    const data = await response.json();
    console.log('📊 OpenMedic raw data:', data.length, 'résultats');

    if (data.length === 0) {
      return getFrenchMockData(query);
    }

    return data.map((med: any) => ({
      id: med.codeCIS,
      name: med.denomination || 'Nom non disponible', // Nom commercial français
      genericName: med.principeActif || '', // DCI
      manufacturer: med.titulaire || '',
      activeIngredients: med.composition || [],
      dosage: med.formePharmaceutique || '',
      strength: med.dosage || '',
      country: 'fr',
      source: 'openmedic',
      authorizationNumber: med.codeCIS,
      status: med.statut || '',
      reimbursement: med.remboursement || false,
      searchScore: calculateSearchScore(query, med.denomination, med.principeActif)
    })).filter((med: any) => med.name !== 'Nom non disponible');

  } catch (error) {
    console.warn('⚠️ OpenMedic API failed, using mock data:', error);
    return getFrenchMockData(query);
  }
}

// 🏥 Données mockées françaises pour les médicaments courants (médecine générale complète)
function getFrenchMockData(query: string): any[] {
  const frenchMedications = [
    // === ANALGÉSIQUES ET ANTIPYRÉTIQUES ===
    {
      id: 'FR-DOL-001',
      name: 'DOLIPRANE 1000 mg',
      genericName: 'Paracétamol',
      manufacturer: 'Sanofi',
      activeIngredients: ['Paracétamol'],
      dosage: 'Comprimé',
      strength: '1000 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 100
    },
    {
      id: 'FR-DOL-002',
      name: 'DOLIPRANE 500 mg',
      genericName: 'Paracétamol',
      manufacturer: 'Sanofi',
      activeIngredients: ['Paracétamol'],
      dosage: 'Comprimé',
      strength: '500 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 95
    },
    {
      id: 'FR-EFF-001',
      name: 'EFFERALGAN 1000 mg',
      genericName: 'Paracétamol',
      manufacturer: 'UPSA',
      activeIngredients: ['Paracétamol'],
      dosage: 'Comprimé',
      strength: '1000 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 90
    },
    {
      id: 'FR-PAR-001',
      name: 'PARACETAMOL ZYDUS 1000 mg',
      genericName: 'Paracétamol',
      manufacturer: 'Zydus',
      activeIngredients: ['Paracétamol'],
      dosage: 'Comprimé',
      strength: '1000 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 85
    },
    {
      id: 'FR-DAF-001',
      name: 'DAFALGAN 1000 mg',
      genericName: 'Paracétamol',
      manufacturer: 'UPSA',
      activeIngredients: ['Paracétamol'],
      dosage: 'Comprimé',
      strength: '1000 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 85
    },

    // === ANTI-INFLAMMATOIRES NON STÉROÏDIENS ===
    {
      id: 'FR-ASP-001',
      name: 'KARDEGIC 75 mg',
      genericName: 'Acide acétylsalicylique',
      manufacturer: 'Sanofi',
      activeIngredients: ['Acide acétylsalicylique'],
      dosage: 'Comprimé',
      strength: '75 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 95
    },
    {
      id: 'FR-ASP-002',
      name: 'ASPIRINE UPSA 500 mg',
      genericName: 'Acide acétylsalicylique',
      manufacturer: 'UPSA',
      activeIngredients: ['Acide acétylsalicylique'],
      dosage: 'Comprimé',
      strength: '500 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 90
    },
    {
      id: 'FR-IBU-001',
      name: 'ADVIL 400 mg',
      genericName: 'Ibuprofène',
      manufacturer: 'Pfizer',
      activeIngredients: ['Ibuprofène'],
      dosage: 'Comprimé',
      strength: '400 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 85
    },
    {
      id: 'FR-IBU-002',
      name: 'NUROFEN 400 mg',
      genericName: 'Ibuprofène',
      manufacturer: 'Reckitt Benckiser',
      activeIngredients: ['Ibuprofène'],
      dosage: 'Comprimé',
      strength: '400 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 85
    },
    {
      id: 'FR-VOL-001',
      name: 'VOLTARENE 50 mg',
      genericName: 'Diclofénac',
      manufacturer: 'Novartis',
      activeIngredients: ['Diclofénac'],
      dosage: 'Comprimé',
      strength: '50 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },
    {
      id: 'FR-PRO-001',
      name: 'PROFENID 100 mg',
      genericName: 'Kétoprofène',
      manufacturer: 'Sanofi',
      activeIngredients: ['Kétoprofène'],
      dosage: 'Comprimé',
      strength: '100 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },

    // === ANTIHYPERTENSEURS ===
    {
      id: 'FR-COV-001',
      name: 'COVERSYL 5 mg',
      genericName: 'Périndopril',
      manufacturer: 'Servier',
      activeIngredients: ['Périndopril'],
      dosage: 'Comprimé',
      strength: '5 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 90
    },
    {
      id: 'FR-COV-002',
      name: 'COVERSYL 10 mg',
      genericName: 'Périndopril',
      manufacturer: 'Servier',
      activeIngredients: ['Périndopril'],
      dosage: 'Comprimé',
      strength: '10 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 90
    },
    {
      id: 'FR-AML-001',
      name: 'AMLOR 5 mg',
      genericName: 'Amlodipine',
      manufacturer: 'Pfizer',
      activeIngredients: ['Amlodipine'],
      dosage: 'Comprimé',
      strength: '5 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 85
    },
    {
      id: 'FR-AML-002',
      name: 'AMLOR 10 mg',
      genericName: 'Amlodipine',
      manufacturer: 'Pfizer',
      activeIngredients: ['Amlodipine'],
      dosage: 'Comprimé',
      strength: '10 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 85
    },
    {
      id: 'FR-COA-001',
      name: 'COAPROVEL 150 mg/12,5 mg',
      genericName: 'Irbesartan/Hydrochlorothiazide',
      manufacturer: 'Sanofi',
      activeIngredients: ['Irbesartan', 'Hydrochlorothiazide'],
      dosage: 'Comprimé',
      strength: '150 mg/12,5 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },
    {
      id: 'FR-TEN-001',
      name: 'TENORMINE 100 mg',
      genericName: 'Aténalol',
      manufacturer: 'AstraZeneca',
      activeIngredients: ['Aténalol'],
      dosage: 'Comprimé',
      strength: '100 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },
    {
      id: 'FR-BIS-001',
      name: 'BISOPROLOL ARROW 5 mg',
      genericName: 'Bisoprolol',
      manufacturer: 'Arrow',
      activeIngredients: ['Bisoprolol'],
      dosage: 'Comprimé',
      strength: '5 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },
    {
      id: 'FR-LOS-001',
      name: 'LOSEC 20 mg',
      genericName: 'Oméprazole',
      manufacturer: 'AstraZeneca',
      activeIngredients: ['Oméprazole'],
      dosage: 'Gélule',
      strength: '20 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },

    // === DIURÉTIQUES ===
    {
      id: 'FR-LAS-001',
      name: 'LASILIX 40 mg',
      genericName: 'Furosémide',
      manufacturer: 'Sanofi',
      activeIngredients: ['Furosémide'],
      dosage: 'Comprimé',
      strength: '40 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 85
    },
    {
      id: 'FR-HCT-001',
      name: 'ESIDREX 25 mg',
      genericName: 'Hydrochlorothiazide',
      manufacturer: 'Novartis',
      activeIngredients: ['Hydrochlorothiazide'],
      dosage: 'Comprimé',
      strength: '25 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },

    // === ANTICOAGULANTS ET ANTIAGRÉGANTS ===
    {
      id: 'FR-PLAV-001',
      name: 'PLAVIX 75 mg',
      genericName: 'Clopidogrel',
      manufacturer: 'Sanofi',
      activeIngredients: ['Clopidogrel'],
      dosage: 'Comprimé',
      strength: '75 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 90
    },
    {
      id: 'FR-ELI-001',
      name: 'ELIQUIS 5 mg',
      genericName: 'Apixaban',
      manufacturer: 'Pfizer',
      activeIngredients: ['Apixaban'],
      dosage: 'Comprimé',
      strength: '5 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 85
    },
    {
      id: 'FR-PRA-001',
      name: 'PRADAXA 150 mg',
      genericName: 'Dabigatran',
      manufacturer: 'Boehringer',
      activeIngredients: ['Dabigatran'],
      dosage: 'Gélule',
      strength: '150 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },
    {
      id: 'FR-SIN-001',
      name: 'XARELTO 20 mg',
      genericName: 'Rivaroxaban',
      manufacturer: 'Bayer',
      activeIngredients: ['Rivaroxaban'],
      dosage: 'Comprimé',
      strength: '20 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },

    // === STATINES ===
    {
      id: 'FR-CRE-001',
      name: 'CRESTOR 10 mg',
      genericName: 'Rosuvastatine',
      manufacturer: 'AstraZeneca',
      activeIngredients: ['Rosuvastatine'],
      dosage: 'Comprimé',
      strength: '10 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 85
    },
    {
      id: 'FR-TAH-001',
      name: 'TAHOR 20 mg',
      genericName: 'Atorvastatine',
      manufacturer: 'Pfizer',
      activeIngredients: ['Atorvastatine'],
      dosage: 'Comprimé',
      strength: '20 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 85
    },
    {
      id: 'FR-ZOC-001',
      name: 'ZOCOR 20 mg',
      genericName: 'Simvastatine',
      manufacturer: 'MSD',
      activeIngredients: ['Simvastatine'],
      dosage: 'Comprimé',
      strength: '20 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },

    // === ANTI-ACIDES ET IPP ===
    {
      id: 'FR-OME-001',
      name: 'MOPRAL 20 mg',
      genericName: 'Oméprazole',
      manufacturer: 'AstraZeneca',
      activeIngredients: ['Oméprazole'],
      dosage: 'Gélule',
      strength: '20 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },
    {
      id: 'FR-INEX-001',
      name: 'INEXIUM 20 mg',
      genericName: 'Esoméprazole',
      manufacturer: 'AstraZeneca',
      activeIngredients: ['Esoméprazole'],
      dosage: 'Comprimé',
      strength: '20 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },
    {
      id: 'FR-PAN-001',
      name: 'PANTOZOL 20 mg',
      genericName: 'Pantoprazole',
      manufacturer: 'Nycomed',
      activeIngredients: ['Pantoprazole'],
      dosage: 'Comprimé',
      strength: '20 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },

    // === ANTIDIABÉTIQUES ===
    {
      id: 'FR-MET-001',
      name: 'METFORMINE ARROW 1000 mg',
      genericName: 'Metformine',
      manufacturer: 'Arrow',
      activeIngredients: ['Metformine'],
      dosage: 'Comprimé',
      strength: '1000 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },
    {
      id: 'FR-JAN-001',
      name: 'JANUVIA 100 mg',
      genericName: 'Sitagliptine',
      manufacturer: 'MSD',
      activeIngredients: ['Sitagliptine'],
      dosage: 'Comprimé',
      strength: '100 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },
    {
      id: 'FR-GLU-001',
      name: 'AMAREL 4 mg',
      genericName: 'Glimepiride',
      manufacturer: 'Sanofi',
      activeIngredients: ['Glimepiride'],
      dosage: 'Comprimé',
      strength: '4 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 70
    },
    {
      id: 'FR-JAR-001',
      name: 'JARDIANCE 10 mg',
      genericName: 'Empagliflozine',
      manufacturer: 'Boehringer',
      activeIngredients: ['Empagliflozine'],
      dosage: 'Comprimé',
      strength: '10 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },

    // === TRAITEMENTS RESPIRATOIRES ===
    {
      id: 'FR-SER-001',
      name: 'SERETIDE 50/250 µg',
      genericName: 'Salmétérol/Fluticasone',
      manufacturer: 'GSK',
      activeIngredients: ['Salmétérol', 'Fluticasone'],
      dosage: 'Inhalateur',
      strength: '50/250 µg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },
    {
      id: 'FR-VEN-001',
      name: 'VENTOLINE 100 µg',
      genericName: 'Salbutamol',
      manufacturer: 'GSK',
      activeIngredients: ['Salbutamol'],
      dosage: 'Inhalateur',
      strength: '100 µg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 85
    },
    {
      id: 'FR-SYM-001',
      name: 'SYMBICORT 160/4,5 µg',
      genericName: 'Budesonide/Formotérol',
      manufacturer: 'AstraZeneca',
      activeIngredients: ['Budesonide', 'Formotérol'],
      dosage: 'Inhalateur',
      strength: '160/4,5 µg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },
    {
      id: 'FR-PUL-001',
      name: 'PULMICORT 200 µg',
      genericName: 'Budesonide',
      manufacturer: 'AstraZeneca',
      activeIngredients: ['Budesonide'],
      dosage: 'Suspension',
      strength: '200 µg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },

    // === ANTIDÉPRESSEURS ET ANXIOLYTIQUES ===
    {
      id: 'FR-SER-002',
      name: 'SERESTA 50 mg',
      genericName: 'Oxazépam',
      manufacturer: 'Sanofi',
      activeIngredients: ['Oxazépam'],
      dosage: 'Comprimé',
      strength: '50 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },
    {
      id: 'FR-PRO-002',
      name: 'PROZAC 20 mg',
      genericName: 'Fluoxétine',
      manufacturer: 'Lilly',
      activeIngredients: ['Fluoxétine'],
      dosage: 'Gélule',
      strength: '20 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },
    {
      id: 'FR-DER-001',
      name: 'DEROXAT 20 mg',
      genericName: 'Paroxétine',
      manufacturer: 'GSK',
      activeIngredients: ['Paroxétine'],
      dosage: 'Comprimé',
      strength: '20 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },
    {
      id: 'FR-LEX-001',
      name: 'LEXOMIL 6 mg',
      genericName: 'Bromazépam',
      manufacturer: 'Roche',
      activeIngredients: ['Bromazépam'],
      dosage: 'Comprimé',
      strength: '6 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 70
    },

    // === ANTIBIOTIQUES COURANTS ===
    {
      id: 'FR-AUG-001',
      name: 'AUGMENTIN 1 g',
      genericName: 'Amoxicilline/Acide clavulanique',
      manufacturer: 'GSK',
      activeIngredients: ['Amoxicilline', 'Acide clavulanique'],
      dosage: 'Comprimé',
      strength: '1 g',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },
    {
      id: 'FR-OFL-001',
      name: 'OFLOCET 200 mg',
      genericName: 'Ofloxacine',
      manufacturer: 'Sanofi',
      activeIngredients: ['Ofloxacine'],
      dosage: 'Comprimé',
      strength: '200 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },
    {
      id: 'FR-CLA-001',
      name: 'CLAMOXYL 500 mg',
      genericName: 'Amoxicilline',
      manufacturer: 'GSK',
      activeIngredients: ['Amoxicilline'],
      dosage: 'Comprimé',
      strength: '500 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },
    {
      id: 'FR-ERY-001',
      name: 'ERYTHROCINE 500 mg',
      genericName: 'Erythromycine',
      manufacturer: 'Abbott',
      activeIngredients: ['Erythromycine'],
      dosage: 'Comprimé',
      strength: '500 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 70
    },

    // === TRAITEMENTS DIGESTIFS ===
    {
      id: 'FR-SIM-001',
      name: 'LOPERAMIDE ARROW 2 mg',
      genericName: 'Lopéramide',
      manufacturer: 'Arrow',
      activeIngredients: ['Lopéramide'],
      dosage: 'Comprimé',
      strength: '2 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },
    {
      id: 'FR-SME-001',
      name: 'SMECTA',
      genericName: 'Diosmectite',
      manufacturer: 'Ipsen',
      activeIngredients: ['Diosmectite'],
      dosage: 'Poudre',
      strength: '3 g',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 70
    },
    {
      id: 'FR-IMO-001',
      name: 'IMODIUM 2 mg',
      genericName: 'Lopéramide',
      manufacturer: 'Janssen',
      activeIngredients: ['Lopéramide'],
      dosage: 'Comprimé',
      strength: '2 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },

    // === TRAITEMENTS THYROÏDIENS ===
    {
      id: 'FR-LEV-001',
      name: 'LEVOTHYROX 100 µg',
      genericName: 'Lévothyroxine',
      manufacturer: 'Merck',
      activeIngredients: ['Lévothyroxine'],
      dosage: 'Comprimé',
      strength: '100 µg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 80
    },
    {
      id: 'FR-EUT-001',
      name: 'EUTHYROX 100 µg',
      genericName: 'Lévothyroxine',
      manufacturer: 'Merck',
      activeIngredients: ['Lévothyroxine'],
      dosage: 'Comprimé',
      strength: '100 µg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },

    // === ANTICONVULSIVANTS ===
    {
      id: 'FR-TEG-001',
      name: 'TEGRETOL 200 mg',
      genericName: 'Carbamazépine',
      manufacturer: 'Novartis',
      activeIngredients: ['Carbamazépine'],
      dosage: 'Comprimé',
      strength: '200 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },
    {
      id: 'FR-DEPA-001',
      name: 'DEPAKINE 500 mg',
      genericName: 'Valproate de sodium',
      manufacturer: 'Sanofi',
      activeIngredients: ['Valproate de sodium'],
      dosage: 'Comprimé',
      strength: '500 mg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 75
    },

    // === TRAITEMENTS OPHTALMOLOGIQUES ===
    {
      id: 'FR-LUM-001',
      name: 'LUMIGAN 0,1 mg/ml',
      genericName: 'Bimatoprost',
      manufacturer: 'Allergan',
      activeIngredients: ['Bimatoprost'],
      dosage: 'Collyre',
      strength: '0,1 mg/ml',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 70
    },

    // === VITAMINES ET SUPPLÉMENTS ===
    {
      id: 'FR-VIT-001',
      name: 'VITAMINE D3 BON 100 000 UI',
      genericName: 'Cholécalciférol',
      manufacturer: 'Bon',
      activeIngredients: ['Cholécalciférol'],
      dosage: 'Solution buvable',
      strength: '100 000 UI',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 70
    },
    {
      id: 'FR-UVE-001',
      name: 'UVEDOSE 100 000 UI',
      genericName: 'Cholécalciférol',
      manufacturer: 'CRINEX',
      activeIngredients: ['Cholécalciférol'],
      dosage: 'Capsule',
      strength: '100 000 UI',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 70
    },

    // === TRAITEMENTS DERMATOLOGIQUES ===
    {
      id: 'FR-DER-002',
      name: 'DERMOCORT 0,1%',
      genericName: 'Hydrocortisone',
      manufacturer: 'GSK',
      activeIngredients: ['Hydrocortisone'],
      dosage: 'Crème',
      strength: '0,1%',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 70
    },

    // === TRAITEMENTS GYNÉCOLOGIQUES ===
    {
      id: 'FR-JAS-001',
      name: 'JASMINE',
      genericName: 'Désogestrel',
      manufacturer: 'MSD',
      activeIngredients: ['Désogestrel'],
      dosage: 'Comprimé',
      strength: '75 µg',
      country: 'fr',
      source: 'openmedic-mock',
      searchScore: 70
    }
  ];

  const normalizedQuery = query.toLowerCase();

  return frenchMedications.filter(med =>
    med.name.toLowerCase().includes(normalizedQuery) ||
    med.genericName.toLowerCase().includes(normalizedQuery) ||
    med.activeIngredients.some(ingredient =>
      ingredient.toLowerCase().includes(normalizedQuery)
    )
  ).slice(0, 20);
}

// 🔍 Fonction pour rechercher dans OpenFDA (International)
async function searchOpenFDAMedications(query: string) {
  try {
    const response = await fetch(
      `https://api.fda.gov/drug/drugsfda.json?search=brand_name:${query}*&limit=10`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Somnolink-Medical-App/1.0'
        },
        // Timeout de 5 secondes
        signal: AbortSignal.timeout(5000)
      }
    );

    if (!response.ok) {
      console.warn('⚠️ OpenFDA API response not ok:', response.status);
      return getInternationalMockData(query);
    }

    const data = await response.json();
    console.log('📊 OpenFDA raw data:', data.results?.length || 0, 'résultats');

    if (!data.results || data.results.length === 0) {
      return getInternationalMockData(query);
    }

    return data.results?.map((drug: any) => ({
      id: drug.application_number || drug.product_number,
      name: drug.brand_name?.[0] || drug.generic_name?.[0] || 'Unknown',
      genericName: drug.generic_name?.[0] || '',
      manufacturer: drug.labeler_name || '',
      activeIngredients: drug.active_ingredients || [],
      dosage: drug.dosage_form?.[0] || '',
      strength: drug.product_type || '',
      country: 'us',
      source: 'openfda',
      searchScore: calculateSearchScore(query, drug.brand_name?.[0], drug.generic_name?.[0])
    })) || [];

  } catch (error) {
    console.warn('⚠️ OpenFDA API failed, using mock data:', error);
    return getInternationalMockData(query);
  }
}

// 🌍 Données mockées internationales pour les médicaments courants
function getInternationalMockData(query: string): any[] {
  const internationalMedications = [
    {
      id: 'US-IBU-001',
      name: 'Advil 200mg',
      genericName: 'Ibuprofen',
      manufacturer: 'Pfizer',
      activeIngredients: ['Ibuprofen'],
      dosage: 'Tablet',
      strength: '200 mg',
      country: 'us',
      source: 'openfda-mock',
      searchScore: 90
    },
    {
      id: 'US-ASP-001',
      name: 'Aspirin 325mg',
      genericName: 'Acetylsalicylic acid',
      manufacturer: 'Bayer',
      activeIngredients: ['Acetylsalicylic acid'],
      dosage: 'Tablet',
      strength: '325 mg',
      country: 'us',
      source: 'openfda-mock',
      searchScore: 85
    },
    {
      id: 'US-OME-001',
      name: 'Prilosec 20mg',
      genericName: 'Omeprazole',
      manufacturer: 'AstraZeneca',
      activeIngredients: ['Omeprazole'],
      dosage: 'Capsule',
      strength: '20 mg',
      country: 'us',
      source: 'openfda-mock',
      searchScore: 80
    },
    {
      id: 'US-SIM-001',
      name: 'Imodium 2mg',
      genericName: 'Loperamide',
      manufacturer: 'Johnson & Johnson',
      activeIngredients: ['Loperamide'],
      dosage: 'Tablet',
      strength: '2 mg',
      country: 'us',
      source: 'openfda-mock',
      searchScore: 75
    },
    {
      id: 'US-PAR-001',
      name: 'Tylenol 500mg',
      genericName: 'Acetaminophen',
      manufacturer: 'Johnson & Johnson',
      activeIngredients: ['Acetaminophen'],
      dosage: 'Tablet',
      strength: '500 mg',
      country: 'us',
      source: 'openfda-mock',
      searchScore: 70
    }
  ];

  const normalizedQuery = query.toLowerCase();

  return internationalMedications.filter(med =>
    med.name.toLowerCase().includes(normalizedQuery) ||
    med.genericName.toLowerCase().includes(normalizedQuery)
  ).slice(0, 8);
}

// 🧹 Supprimer les doublons
function removeDuplicates(medications: any[]) {
  const seen = new Set();
  return medications.filter(med => {
    const key = `${med.name}-${med.genericName}`.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// 📊 Calculer le score de pertinence pour le tri
function calculateSearchScore(query: string, brandName?: string, genericName?: string): number {
  const normalizedQuery = query.toLowerCase();
  let score = 0;

  // Score élevé si le nom commercial commence par la requête
  if (brandName && brandName.toLowerCase().startsWith(normalizedQuery)) {
    score += 100;
  }

  // Score moyen si le nom commercial contient la requête
  if (brandName && brandName.toLowerCase().includes(normalizedQuery)) {
    score += 50;
  }

  // Score pour le DCI
  if (genericName && genericName.toLowerCase().includes(normalizedQuery)) {
    score += 25;
  }

  return score;
}

// 🔄 Trier par pertinence
function sortByRelevance(medications: any[], query: string) {
  return medications.sort((a, b) => {
    // Priorité aux médicaments français
    if (a.country === 'fr' && b.country !== 'fr') return -1;
    if (b.country === 'fr' && a.country !== 'fr') return 1;

    // Puis par score de recherche
    return (b.searchScore || 0) - (a.searchScore || 0);
  });
}