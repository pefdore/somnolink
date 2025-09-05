// src/app/api/terminology-search/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

interface ICDEntity {
  title?: string;
  label?: string;
  name?: string;
  theCode?: string;
  code?: string;
  id?: string;
  // Autres propriétés possibles
  [key: string]: unknown;
}

const clientId = process.env.ICD_API_CLIENT_ID;
const clientSecret = process.env.ICD_API_CLIENT_SECRET;
const tokenUrl = process.env.ICD_API_TOKEN_URL;
const searchUrl = process.env.ICD_API_SEARCH_URL;
// URL de base pour ICD-11 (utilise la variable d'environnement ou valeur par défaut)
const baseSearchUrl = searchUrl || "https://id.who.int/icd/release/11/2024-01";

async function getAccessToken() {
    console.log("Tentative d'obtention du token avec ClientID:", clientId);
    console.log("Token URL utilisé:", tokenUrl);
    if (!clientId || !clientSecret || !tokenUrl) {
        throw new Error('Les variables d\'environnement de l\'API ICD ne sont pas configurées.');
    }
    const body = new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': clientId,
        'client_secret': clientSecret,
        'scope': 'icdapi_access',
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
        console.error('Erreur d\'authentification à l\'API ICD:', await response.text());
        throw new Error('Échec de l\'obtention du jeton d\'accès.');
    }
    const data = await response.json();
    return data.access_token;
}

// src/app/api/terminology-search/route.ts

export async function GET(request: Request) {
    try {
        console.log('[TERMINOLOGY_SEARCH] Variables d\'environnement:');
        console.log('ICD_API_CLIENT_ID:', clientId ? 'Défini' : 'Non défini');
        console.log('ICD_API_CLIENT_SECRET:', clientSecret ? 'Défini' : 'Non défini');
        console.log('ICD_API_TOKEN_URL:', tokenUrl);
        console.log('ICD_API_SEARCH_URL:', searchUrl);
        console.log('baseSearchUrl (hardcodée):', baseSearchUrl);

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        console.log('[TERMINOLOGY_SEARCH] Query:', query);

        // Vérifier que les variables essentielles sont configurées
        if (!clientId || !clientSecret || !tokenUrl) {
            console.warn('Variables ICD API manquantes, utilisation de données mockées');
            // Retourner des données mockées pour les tests
            return NextResponse.json([
                { code: 'I10', label: 'Hypertension essentielle (primitive)', system: 'CIM-11' },
                { code: 'E11', label: 'Diabète sucré de type 2', system: 'CIM-11' },
                { code: 'I25', label: 'Maladie ischémique chronique du cœur', system: 'CIM-11' }
            ].filter(item => item.label.toLowerCase().includes(query.toLowerCase())));
        }
        if (query.length < 3) {
            return NextResponse.json([]);
        }

        let accessToken;
        try {
            accessToken = await getAccessToken();
        } catch (error) {
            console.warn('Échec de l\'obtention du token, utilisation de données mockées');
            return NextResponse.json([
                { code: 'I10', label: 'Hypertension essentielle (primitive)', system: 'CIM-11' },
                { code: 'E11', label: 'Diabète sucré de type 2', system: 'CIM-11' },
                { code: 'I25', label: 'Maladie ischémique chronique du cœur', system: 'CIM-11' }
            ].filter(item => item.label.toLowerCase().includes(query.toLowerCase())));
        }

        // Construire l'URL de recherche correcte pour ICD-11
        const url = new URL(`${baseSearchUrl}/mms/search`);
        url.searchParams.append('q', query);
        url.searchParams.append('useFlexisearch', 'true');
        url.searchParams.append('flatResults', 'true');
        console.log('[TERMINOLOGY_SEARCH] URL de recherche construite:', url.toString());

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Accept-Language': 'fr,en;q=0.9',
                'API-Version': 'v2',
            },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`Erreur de recherche sur l'API ICD. Statut: ${response.status}, Réponse: ${await response.text()}`);
            console.warn('API ICD échouée, utilisation de données mockées');
            // Retourner des données mockées en cas d'erreur
            return NextResponse.json([
                { code: 'I10', label: 'Hypertension essentielle (primitive)', system: 'CIM-11' },
                { code: 'E11', label: 'Diabète sucré de type 2', system: 'CIM-11' },
                { code: 'I25', label: 'Maladie ischémique chronique du cœur', system: 'CIM-11' }
            ].filter(item => item.label.toLowerCase().includes(query.toLowerCase())));
        }

        const data = await response.json();
        
        // ===================================================================
        //   ACTION REQUISE : Affichez la structure de la réponse reçue
        // ===================================================================
        console.log("--- RÉPONSE BRUTE DE L'API OMS ---");
        console.log(JSON.stringify(data, null, 2)); // Affiche la structure exacte de la réponse
        console.log("---------------------------------");
        // ===================================================================

        console.log("--- RÉPONSE BRUTE DE L'API OMS ---");
        console.log(JSON.stringify(data, null, 2)); // Affiche la structure exacte de la réponse
        console.log("---------------------------------");

        // Tentative d'extraction des résultats basée sur la structure réelle
        let entities: ICDEntity[] = [];
        
        // Essayer différentes structures possibles
        if (data.destinationEntities) {
            entities = data.destinationEntities;
        } else if (data.entities) {
            entities = data.entities;
        } else if (Array.isArray(data)) {
            entities = data;
        } else if (data.searchResults) {
            entities = data.searchResults;
        }

        if (entities.length === 0) {
            console.warn(`Aucune entité trouvée pour la recherche: "${query}"`);
            console.warn("Structure de la réponse:", Object.keys(data));
        }

        const results = entities
            .filter((entity: ICDEntity) => entity && (entity.title || entity.label || entity.name))
            .map((entity: ICDEntity) => ({
                code: entity.theCode || entity.code || entity.id?.split('/').pop() || 'N/A',
                label: (entity.title || entity.label || entity.name || '').replace(/<[^>]*>?/gm, ''),
                system: 'CIM-11',
            }));

        return NextResponse.json(results);

    } catch (error: unknown) {
        console.error('[TERMINOLOGY_SEARCH_ERROR]', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        return new NextResponse(`Internal Server Error: ${errorMessage}`, { status: 500 });
    }
}