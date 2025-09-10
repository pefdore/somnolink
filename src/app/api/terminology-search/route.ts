// src/app/api/terminology-search/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { searchCISP2Dataset } from '@/data/cisp2-dataset';

interface ICDEntity {
  title?: string;
  label?: string;
  name?: string;
  theCode?: string;
  code?: string;
  id?: string;
  keywords?: string[];
  // Autres propriétés possibles
  [key: string]: unknown;
}

interface MockDataItem {
  code: string;
  label: string;
  keywords: string[];
  system: 'CIM-11';
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
        const system = searchParams.get('system') || 'CIM-11';
        console.log('[TERMINOLOGY_SEARCH] Query:', query, 'System:', system);

        // Gestion des recherches CISP-2 (dataset local)
        if (system === 'CISP-2') {
            if (query.length < 2) {
                return NextResponse.json([]);
            }

            const results = searchCISP2Dataset(query);
            return NextResponse.json(results.map(item => ({
                code: item.code,
                label: item.label,
                system: 'CISP-2'
            })));
        }

        // Vérifier que les variables essentielles sont configurées
        if (!clientId || !clientSecret || !tokenUrl) {
            console.warn('Variables ICD API manquantes, utilisation de données mockées étendues');
            // Base de données CIM-11 étendue avec descriptions naturelles
            const mockData = [
                // Cardiovasculaire
                { code: 'I10', label: 'Hypertension artérielle', keywords: ['hta', 'tension', 'pression', 'hypertendu', 'hypertension'] },
                { code: 'I25', label: 'Maladie coronarienne', keywords: ['coeur', 'cardiaque', 'coronarien', 'angine', 'infarctus'] },
                { code: 'I48', label: 'Fibrillation auriculaire', keywords: ['arythmie', 'coeur', 'palpitations', 'fibrillation'] },

                // Respiratoire
                { code: 'J45', label: 'Asthme', keywords: ['asthme', 'respiration', 'souffle', 'crise', 'bronchique'] },
                { code: 'J44', label: 'BPCO', keywords: ['bpcop', 'bronchite', 'chronique', 'fumée', 'tabac', 'toux'] },
                { code: 'J40', label: 'Bronchite chronique', keywords: ['bronchite', 'toux', 'fumée', 'tabac'] },

                // Digestif
                { code: 'K21', label: 'Reflux gastro-œsophagien', keywords: ['renvois', 'brulures', 'estomac', 'reflux', 'gerd'] },
                { code: 'K25', label: 'Ulcère gastrique', keywords: ['estomac', 'ulcere', 'brulures', 'digestion'] },

                // Urologique
                { code: 'N40', label: 'Hypertrophie prostatique', keywords: ['prostate', 'uriner', 'miction', 'benigne', 'adénome'] },
                { code: 'N28', label: 'Insuffisance rénale', keywords: ['rein', 'urines', 'dialyse', 'rénale', 'insuffisance'] },

                // Endocrinien
                { code: 'E11', label: 'Diabète de type 2', keywords: ['diabète', 'sucre', 'glycemie', 'insuline', 'hyperglycémie'] },
                { code: 'E10', label: 'Diabète de type 1', keywords: ['diabète', 'insuline', 'juvenil', 'autoimmune'] },
                { code: 'E03', label: 'Hypothyroïdie', keywords: ['thyroïde', 'hormones', 'fatigue', 'poids', 'froid'] },

                // Oncologique
                { code: 'C50', label: 'Cancer du sein', keywords: ['sein', 'cancer', 'tumeur', 'mammaire', 'mastectomie'] },
                { code: 'C61', label: 'Cancer de la prostate', keywords: ['prostate', 'cancer', 'tumeur', 'psa', 'prostatique'] },
                { code: 'C34', label: 'Cancer du poumon', keywords: ['poumon', 'cancer', 'tumeur', 'fumée', 'tabac'] },
                { code: 'C18', label: 'Cancer colorectal', keywords: ['colon', 'rectum', 'cancer', 'tumeur', 'digestif'] },

                // Musculosquelettique
                { code: 'M54', label: 'Lombalgie', keywords: ['dos', 'lombaires', 'douleur', 'reins', 'sciatique'] },
                { code: 'M17', label: 'Gonarthrose', keywords: ['genou', 'arthrose', 'douleur', 'marche', 'articulation'] },
                { code: 'M16', label: 'Coxarthrose', keywords: ['hanche', 'arthrose', 'douleur', 'marche', 'articulation'] },

                // Neurologique
                { code: 'G43', label: 'Migraine', keywords: ['migraine', 'tete', 'céphalée', 'nausée', 'lumière'] },
                { code: 'G35', label: 'Sclérose en plaques', keywords: ['sep', 'neurologique', 'fatigue', 'tremblements'] },
                { code: 'G20', label: 'Maladie de Parkinson', keywords: ['parkinson', 'tremblements', 'rigidité', 'marche'] },

                // Psychiatrique
                { code: 'F32', label: 'Dépression', keywords: ['depression', 'triste', 'fatigue', 'sommeil', 'anxiété'] },
                { code: 'F41', label: 'Trouble anxieux', keywords: ['anxiété', 'stress', 'angoisse', 'attaque', 'panique'] },
                { code: 'F51', label: 'Insomnie', keywords: ['sommeil', 'insomnie', 'réveils', 'fatigue', 'dormir'] },

                // Autres conditions fréquentes
                { code: 'M79', label: 'Douleurs dorsales', keywords: ['dos', 'douleur', 'lombalgie', 'cervicalgie', 'sciatique'] },
                { code: 'J06', label: 'Infection respiratoire', keywords: ['rhume', 'grippe', 'toux', 'fièvre', 'nez'] },
                { code: 'N39', label: 'Infection urinaire', keywords: ['urine', 'cystite', 'brulures', 'uriner', 'infection'] }
            ].map(item => ({ ...item, system: 'CIM-11' as const }));

            // Logique de recherche améliorée pour la terminologie médicale
            const searchTerm = query.toLowerCase().trim();
            const searchWords = searchTerm.split(' ').filter(word => word.length > 0);

            const filteredResults = mockData.filter(item => {
                const label = item.label.toLowerCase();
                const code = item.code.toLowerCase();

                // 1. Recherche exacte dans le code
                if (code.includes(searchTerm)) return true;

                // 2. Recherche dans le label complet
                if (label.includes(searchTerm)) return true;

                // 3. Recherche par mots individuels (tous les mots doivent être présents)
                if (searchWords.length > 1) {
                    const allWordsPresent = searchWords.every(word =>
                        label.includes(word) || code.includes(word)
                    );
                    if (allWordsPresent) return true;
                }

                // 4. Recherche flexible pour la terminologie médicale
                // Support pour abréviations et variations
                const medicalMappings = {
                    'sein': ['sein', 'mammaire'],
                    'prostate': ['prostate', 'prostatique'],
                    'poumon': ['poumon', 'pulmonaire'],
                    'coeur': ['coeur', 'cardiaque'],
                    'rein': ['rein', 'rénale', 'renal'],
                    'foie': ['foie', 'hépatique'],
                    'tumeur': ['tumeur', 'cancer', 'néoplasme', 'malign'],
                    'maligne': ['maligne', 'cancer', 'carcinome'],
                    'hypertension': ['hypertension', 'hta'],
                    'diabete': ['diabète', 'diabétique'],
                    'asthme': ['asthme', 'asthmatique']
                };

                for (const [key, variations] of Object.entries(medicalMappings)) {
                    if (searchWords.some(word => variations.includes(word))) {
                        if (label.includes(key) || variations.some(v => label.includes(v))) {
                            return true;
                        }
                    }
                }

                return false;
            });

            // Trier par pertinence (codes exacts en premier, puis par longueur de match)
            const sortedResults = filteredResults.sort((a, b) => {
                const aLabel = a.label.toLowerCase();
                const bLabel = b.label.toLowerCase();

                // Priorité aux codes exacts
                if (a.code.toLowerCase() === searchTerm) return -1;
                if (b.code.toLowerCase() === searchTerm) return 1;

                // Puis par nombre de mots trouvés
                const aMatches = searchWords.filter(word => aLabel.includes(word)).length;
                const bMatches = searchWords.filter(word => bLabel.includes(word)).length;

                if (aMatches !== bMatches) return bMatches - aMatches;

                // Enfin par longueur du label (plus court = plus spécifique)
                return a.label.length - b.label.length;
            });

            return NextResponse.json(sortedResults.slice(0, 20)); // Limiter à 20 résultats
        }
        if (query.length < 3) {
            return NextResponse.json([]);
        }

        let accessToken;
        try {
            accessToken = await getAccessToken();
        } catch (error) {
            console.warn('Échec de l\'obtention du token, utilisation de données mockées étendues');
            const mockData = [
                { code: 'I10', label: 'Hypertension essentielle (primitive)', system: 'CIM-11' },
                { code: 'E11', label: 'Diabète sucré de type 2', system: 'CIM-11' },
                { code: 'I25', label: 'Maladie ischémique chronique du cœur', system: 'CIM-11' },
                { code: 'N40', label: 'Hyperplasie de la prostate', system: 'CIM-11' },
                { code: 'J45', label: 'Asthme', system: 'CIM-11' },
                { code: 'K21', label: 'Reflux gastro-œsophagien', system: 'CIM-11' },
                { code: 'M54', label: 'Dorsalgie', system: 'CIM-11' },
                { code: 'F32', label: 'Épisode dépressif majeur', system: 'CIM-11' },
                { code: 'G43', label: 'Migraine', system: 'CIM-11' },
                { code: 'R05', label: 'Toux', system: 'CIM-11' },
                { code: 'C50', label: 'Tumeur maligne du sein', system: 'CIM-11' },
                { code: 'C61', label: 'Tumeur maligne de la prostate', system: 'CIM-11' },
                { code: 'C34', label: 'Tumeur maligne du poumon', system: 'CIM-11' },
                { code: 'C18', label: 'Tumeur maligne du côlon', system: 'CIM-11' },
                { code: 'J44', label: 'Maladie pulmonaire obstructive chronique', system: 'CIM-11' },
                { code: 'I48', label: 'Fibrillation auriculaire', system: 'CIM-11' },
                { code: 'N28', label: 'Autres affections du rein et de l\'uretère', system: 'CIM-11' },
                { code: 'M79', label: 'Autres dorsalgies', system: 'CIM-11' },
                { code: 'F41', label: 'Autres troubles anxieux', system: 'CIM-11' },
                { code: 'G44', label: 'Autres syndromes céphalalgiques', system: 'CIM-11' }
            ];

            // Logique de recherche intelligente orientée utilisateur
            const searchTerm = query.toLowerCase().trim();
            const searchWords = searchTerm.split(' ').filter(word => word.length > 0);

            // Calculer le score de pertinence pour chaque résultat
            const scoredResults = (mockData as MockDataItem[]).map(item => {
                let score = 0;
                const label = item.label.toLowerCase();
                const code = item.code.toLowerCase();
                const keywords = item.keywords;

                // 1. Recherche exacte dans le code (score élevé)
                if (code === searchTerm) score += 100;
                else if (code.includes(searchTerm)) score += 50;

                // 2. Recherche exacte dans le label (score élevé)
                if (label === searchTerm) score += 90;
                else if (label.includes(searchTerm)) score += 40;

                // 3. Recherche dans les mots-clés spécialisés (très pertinent)
                keywords.forEach(keyword => {
                    if (searchTerm.includes(keyword) || keyword.includes(searchTerm)) {
                        score += 30;
                    }
                });

                // 4. Recherche par mots individuels dans les mots-clés
                const keywordMatches = searchWords.filter(word =>
                    keywords.some(keyword => keyword.includes(word) || word.includes(keyword))
                ).length;
                score += keywordMatches * 15;

                // 5. Recherche partielle dans le label
                const labelMatches = searchWords.filter(word => label.includes(word)).length;
                score += labelMatches * 10;

                // 6. Recherche partielle dans les mots-clés
                const partialKeywordMatches = searchWords.filter(word =>
                    keywords.some(keyword => keyword.includes(word))
                ).length;
                score += partialKeywordMatches * 8;

                // 7. Bonus pour les termes médicaux courants
                const medicalTerms = ['cancer', 'tumeur', 'diabète', 'hypertension', 'asthme', 'dépression', 'migraine'];
                if (medicalTerms.some(term => searchTerm.includes(term))) {
                    score += 5;
                }

                return { ...item, score };
            });

            // Filtrer les résultats pertinents (score > 0) et trier par pertinence
            const filteredResults = scoredResults
                .filter(item => item.score > 0)
                .sort((a, b) => {
                    // Trier d'abord par score
                    if (b.score !== a.score) return b.score - a.score;

                    // Puis par nombre de mots-clés correspondants
                    const aKeywords = a.keywords.length;
                    const bKeywords = b.keywords.length;
                    if (aKeywords !== bKeywords) return bKeywords - aKeywords;

                    // Enfin par longueur du label (plus court = plus spécifique)
                    return a.label.length - b.label.length;
                })
                .map(({ score, ...item }) => item); // Retirer le score du résultat final

            return NextResponse.json(filteredResults.slice(0, 20));
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
            console.warn('API ICD échouée, utilisation de données mockées étendues');
            // Retourner des données mockées plus complètes en cas d'erreur
            const mockData: MockDataItem[] = [
                { code: 'I10', label: 'Hypertension artérielle', keywords: ['hta', 'tension', 'pression', 'hypertendu', 'hypertension'], system: 'CIM-11' },
                { code: 'E11', label: 'Diabète de type 2', keywords: ['diabète', 'sucre', 'glycemie', 'insuline', 'hyperglycémie'], system: 'CIM-11' },
                { code: 'I25', label: 'Maladie coronarienne', keywords: ['coeur', 'cardiaque', 'coronarien', 'angine', 'infarctus'], system: 'CIM-11' },
                { code: 'N40', label: 'Hypertrophie prostatique', keywords: ['prostate', 'uriner', 'miction', 'benigne', 'adénome'], system: 'CIM-11' },
                { code: 'J45', label: 'Asthme', keywords: ['asthme', 'respiration', 'souffle', 'crise', 'bronchique'], system: 'CIM-11' },
                { code: 'C50', label: 'Cancer du sein', keywords: ['sein', 'cancer', 'tumeur', 'mammaire', 'mastectomie'], system: 'CIM-11' },
                { code: 'M54', label: 'Lombalgie', keywords: ['dos', 'lombaires', 'douleur', 'reins', 'sciatique'], system: 'CIM-11' },
                { code: 'F32', label: 'Dépression', keywords: ['depression', 'triste', 'fatigue', 'sommeil', 'anxiété'], system: 'CIM-11' },
                { code: 'G43', label: 'Migraine', keywords: ['migraine', 'tete', 'céphalée', 'nausée', 'lumière'], system: 'CIM-11' }
            ];

            // Logique de recherche intelligente
            const searchTerm = query.toLowerCase().trim();
            const searchWords = searchTerm.split(' ').filter(word => word.length > 0);

            const scoredResults = mockData.map(item => {
                let score = 0;
                const label = item.label.toLowerCase();
                const code = item.code.toLowerCase();
                const keywords = item.keywords;

                if (code.includes(searchTerm)) score += 50;
                if (label.includes(searchTerm)) score += 40;

                keywords.forEach(keyword => {
                    if (searchTerm.includes(keyword) || keyword.includes(searchTerm)) {
                        score += 30;
                    }
                });

                const keywordMatches = searchWords.filter(word =>
                    keywords.some(keyword => keyword.includes(word) || word.includes(keyword))
                ).length;
                score += keywordMatches * 15;

                return { ...item, score };
            });

            const filteredResults = scoredResults
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(({ score, ...item }) => item);

            return NextResponse.json(filteredResults.slice(0, 20));
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