// src/app/api/terminology-search/route.ts

import { NextResponse } from 'next/server';

const clientId = process.env.ICD_API_CLIENT_ID;
const clientSecret = process.env.ICD_API_CLIENT_SECRET;
const tokenUrl = process.env.ICD_API_TOKEN_URL;
const searchUrl = process.env.ICD_API_SEARCH_URL; // Sera maintenant la bonne URL !

async function getAccessToken() {
    console.log("Tentative d'obtention du token avec ClientID:", clientId);
    if (!clientId || !clientSecret || !tokenUrl) {
        throw new Error('Les variables d\'environnement de l\'API ICD ne sont pas configurées.');
    }
    const body = new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': clientId,
        'client_secret': clientSecret,
        'scope': 'icdapi_access',
    });
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
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
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        
        // L'URL de base pour la recherche ICD-11
        const baseSearchUrl = "https://id.who.int/icd/release/11/2025-01";

        if (!searchUrl) {
             throw new Error("L'URL de recherche de l'API ICD n'est pas configurée.");
        }
        if (query.length < 3) {
            return NextResponse.json([]);
        }

        const accessToken = await getAccessToken();

        // Construire l'URL de recherche correcte pour ICD-11
        const url = new URL(`${baseSearchUrl}/mms/search`);
        url.searchParams.append('q', query);
        url.searchParams.append('useFlexisearch', 'true');
        url.searchParams.append('flatResults', 'true');

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Accept-Language': 'fr,en;q=0.9',
                'API-Version': 'v2',
            },
        });

        if (!response.ok) {
            console.error(`Erreur de recherche sur l'API ICD. Statut: ${response.status}, Réponse: ${await response.text()}`);
            throw new Error('La recherche de terminologie a échoué.');
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
        let entities: any[] = [];
        
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
            .filter((entity: any) => entity && (entity.title || entity.label || entity.name))
            .map((entity: any) => ({
                code: entity.theCode || entity.code || entity.id?.split('/').pop() || 'N/A',
                label: (entity.title || entity.label || entity.name || '').replace(/<[^>]*>?/gm, ''),
                system: 'CIM-11',
            }));

        return NextResponse.json(results);

    } catch (error: any) {
        console.error('[TERMINOLOGY_SEARCH_ERROR]', error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}