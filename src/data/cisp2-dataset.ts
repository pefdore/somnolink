// CISP-2 Dataset - Classification Internationale des Soins Primaires
// Source: WONCA International Classification Committee
// Version: CISP-2 (2005)

export interface CISP2Entry {
  code: string;
  label: string;
  chapter: string;
  category: string;
  description?: string;
}

export const cisp2Dataset: CISP2Entry[] = [
  // A - Digestive
  { code: 'A01', label: 'Infection aiguë des voies respiratoires', chapter: 'A', category: 'Respiratory' },
  { code: 'A02', label: 'Infection chronique des voies respiratoires', chapter: 'A', category: 'Respiratory' },
  { code: 'A03', label: 'Asthme', chapter: 'A', category: 'Respiratory' },
  { code: 'A04', label: 'Bronchite chronique', chapter: 'A', category: 'Respiratory' },
  { code: 'A05', label: 'Emphysème', chapter: 'A', category: 'Respiratory' },
  { code: 'A06', label: 'Pneumonie', chapter: 'A', category: 'Respiratory' },
  { code: 'A07', label: 'Tuberculose', chapter: 'A', category: 'Respiratory' },
  { code: 'A08', label: 'Cancer du poumon', chapter: 'A', category: 'Respiratory' },
  { code: 'A09', label: 'Autre problème respiratoire', chapter: 'A', category: 'Respiratory' },

  // D - Digestive
  { code: 'D01', label: 'Douleur abdominale', chapter: 'D', category: 'Digestive' },
  { code: 'D02', label: 'Nausée/vomissement', chapter: 'D', category: 'Digestive' },
  { code: 'D03', label: 'Diarrhée', chapter: 'D', category: 'Digestive' },
  { code: 'D04', label: 'Constipation', chapter: 'D', category: 'Digestive' },
  { code: 'D05', label: 'Hémorroïdes', chapter: 'D', category: 'Digestive' },
  { code: 'D06', label: 'Ulcère gastroduodénal', chapter: 'D', category: 'Digestive' },
  { code: 'D07', label: 'Reflux gastro-œsophagien', chapter: 'D', category: 'Digestive' },
  { code: 'D08', label: 'Cancer digestif', chapter: 'D', category: 'Digestive' },
  { code: 'D09', label: 'Autre problème digestif', chapter: 'D', category: 'Digestive' },

  // F - Cardiovascular
  { code: 'F01', label: 'Hypertension artérielle', chapter: 'F', category: 'Cardiovascular' },
  { code: 'F02', label: 'Angine de poitrine', chapter: 'F', category: 'Cardiovascular' },
  { code: 'F03', label: 'Infarctus du myocarde', chapter: 'F', category: 'Cardiovascular' },
  { code: 'F04', label: 'Insuffisance cardiaque', chapter: 'F', category: 'Cardiovascular' },
  { code: 'F05', label: 'Arythmie', chapter: 'F', category: 'Cardiovascular' },
  { code: 'F06', label: 'Phlébite/embolie', chapter: 'F', category: 'Cardiovascular' },
  { code: 'F07', label: 'Artérite', chapter: 'F', category: 'Cardiovascular' },
  { code: 'F08', label: 'Accident vasculaire cérébral', chapter: 'F', category: 'Cardiovascular' },
  { code: 'F09', label: 'Autre problème cardiovasculaire', chapter: 'F', category: 'Cardiovascular' },

  // K - Musculoskeletal
  { code: 'K01', label: 'Douleur dorsale', chapter: 'K', category: 'Musculoskeletal' },
  { code: 'K02', label: 'Douleur cervicale', chapter: 'K', category: 'Musculoskeletal' },
  { code: 'K03', label: 'Arthrose', chapter: 'K', category: 'Musculoskeletal' },
  { code: 'K04', label: 'Arthrite rhumatoïde', chapter: 'K', category: 'Musculoskeletal' },
  { code: 'K05', label: 'Goutte', chapter: 'K', category: 'Musculoskeletal' },
  { code: 'K06', label: 'Fracture', chapter: 'K', category: 'Musculoskeletal' },
  { code: 'K07', label: 'Entorse/foulure', chapter: 'K', category: 'Musculoskeletal' },
  { code: 'K08', label: 'Autre problème musculosquelettique', chapter: 'K', category: 'Musculoskeletal' },

  // L - Neurological
  { code: 'L01', label: 'Céphalée/migraine', chapter: 'L', category: 'Neurological' },
  { code: 'L02', label: 'Épilepsie', chapter: 'L', category: 'Neurological' },
  { code: 'L03', label: 'Parkinson', chapter: 'L', category: 'Neurological' },
  { code: 'L04', label: 'Sclérose en plaques', chapter: 'L', category: 'Neurological' },
  { code: 'L05', label: 'Accident vasculaire cérébral', chapter: 'L', category: 'Neurological' },
  { code: 'L06', label: 'Dépression', chapter: 'L', category: 'Neurological' },
  { code: 'L07', label: 'Anxiété', chapter: 'L', category: 'Neurological' },
  { code: 'L08', label: 'Insomnie', chapter: 'L', category: 'Neurological' },
  { code: 'L09', label: 'Autre problème neurologique', chapter: 'L', category: 'Neurological' },

  // N - Urological
  { code: 'N01', label: 'Infection urinaire', chapter: 'N', category: 'Urological' },
  { code: 'N02', label: 'Incontinence urinaire', chapter: 'N', category: 'Urological' },
  { code: 'N03', label: 'Prostatite', chapter: 'N', category: 'Urological' },
  { code: 'N04', label: 'Hypertrophie prostatique', chapter: 'N', category: 'Urological' },
  { code: 'N05', label: 'Calcul rénal', chapter: 'N', category: 'Urological' },
  { code: 'N06', label: 'Insuffisance rénale', chapter: 'N', category: 'Urological' },
  { code: 'N07', label: 'Cancer urologique', chapter: 'N', category: 'Urological' },
  { code: 'N08', label: 'Nycturie', chapter: 'N', category: 'Urological' },
  { code: 'N09', label: 'Autre problème urologique', chapter: 'N', category: 'Urological' },

  // P - Pregnancy/Childbirth
  { code: 'P01', label: 'Grossesse normale', chapter: 'P', category: 'Pregnancy' },
  { code: 'P02', label: 'Complication de grossesse', chapter: 'P', category: 'Pregnancy' },
  { code: 'P03', label: 'Accouchement normal', chapter: 'P', category: 'Pregnancy' },
  { code: 'P04', label: 'Complication d\'accouchement', chapter: 'P', category: 'Pregnancy' },
  { code: 'P05', label: 'Post-partum', chapter: 'P', category: 'Pregnancy' },
  { code: 'P06', label: 'Contraception', chapter: 'P', category: 'Pregnancy' },
  { code: 'P07', label: 'Infertilité', chapter: 'P', category: 'Pregnancy' },
  { code: 'P08', label: 'Avortement', chapter: 'P', category: 'Pregnancy' },
  { code: 'P09', label: 'Autre problème de grossesse', chapter: 'P', category: 'Pregnancy' },

  // R - Metabolic/Endocrine
  { code: 'R01', label: 'Diabète', chapter: 'R', category: 'Metabolic' },
  { code: 'R02', label: 'Hypothyroïdie', chapter: 'R', category: 'Metabolic' },
  { code: 'R03', label: 'Hyperthyroïdie', chapter: 'R', category: 'Metabolic' },
  { code: 'R04', label: 'Obésité', chapter: 'R', category: 'Metabolic' },
  { code: 'R05', label: 'Dyslipidémie', chapter: 'R', category: 'Metabolic' },
  { code: 'R06', label: 'Goutte', chapter: 'R', category: 'Metabolic' },
  { code: 'R07', label: 'Ostéoporose', chapter: 'R', category: 'Metabolic' },
  { code: 'R08', label: 'Cancer endocrinien', chapter: 'R', category: 'Metabolic' },
  { code: 'R09', label: 'Autre problème métabolique', chapter: 'R', category: 'Metabolic' },

  // S - Skin
  { code: 'S01', label: 'Dermatite/eczéma', chapter: 'S', category: 'Skin' },
  { code: 'S02', label: 'Acné', chapter: 'S', category: 'Skin' },
  { code: 'S03', label: 'Psoriasis', chapter: 'S', category: 'Skin' },
  { code: 'S04', label: 'Urticaire', chapter: 'S', category: 'Skin' },
  { code: 'S05', label: 'Infection cutanée', chapter: 'S', category: 'Skin' },
  { code: 'S06', label: 'Tumeur cutanée', chapter: 'S', category: 'Skin' },
  { code: 'S07', label: 'Ulcère cutané', chapter: 'S', category: 'Skin' },
  { code: 'S08', label: 'Traumatisme cutané', chapter: 'S', category: 'Skin' },
  { code: 'S09', label: 'Autre problème cutané', chapter: 'S', category: 'Skin' },

  // T - Psychological
  { code: 'T01', label: 'Dépression', chapter: 'T', category: 'Psychological' },
  { code: 'T02', label: 'Anxiété', chapter: 'T', category: 'Psychological' },
  { code: 'T03', label: 'Trouble du sommeil', chapter: 'T', category: 'Psychological' },
  { code: 'T04', label: 'Trouble de la mémoire', chapter: 'T', category: 'Psychological' },
  { code: 'T05', label: 'Démence', chapter: 'T', category: 'Psychological' },
  { code: 'T06', label: 'Schizophrénie', chapter: 'T', category: 'Psychological' },
  { code: 'T07', label: 'Trouble bipolaire', chapter: 'T', category: 'Psychological' },
  { code: 'T08', label: 'Alcoolisme', chapter: 'T', category: 'Psychological' },
  { code: 'T09', label: 'Autre problème psychologique', chapter: 'T', category: 'Psychological' },

  // U - Social Problems
  { code: 'U01', label: 'Problème familial', chapter: 'U', category: 'Social' },
  { code: 'U02', label: 'Problème professionnel', chapter: 'U', category: 'Social' },
  { code: 'U03', label: 'Problème financier', chapter: 'U', category: 'Social' },
  { code: 'U04', label: 'Isolement social', chapter: 'U', category: 'Social' },
  { code: 'U05', label: 'Violence domestique', chapter: 'U', category: 'Social' },
  { code: 'U06', label: 'Problème de logement', chapter: 'U', category: 'Social' },
  { code: 'U07', label: 'Problème d\'immigration', chapter: 'U', category: 'Social' },
  { code: 'U08', label: 'Problème éducatif', chapter: 'U', category: 'Social' },
  { code: 'U09', label: 'Autre problème social', chapter: 'U', category: 'Social' },

  // X - Symptoms/Complaints
  { code: 'X01', label: 'Fièvre', chapter: 'X', category: 'Symptoms' },
  { code: 'X02', label: 'Fatigue', chapter: 'X', category: 'Symptoms' },
  { code: 'X03', label: 'Douleur généralisée', chapter: 'X', category: 'Symptoms' },
  { code: 'X04', label: 'Perte de poids', chapter: 'X', category: 'Symptoms' },
  { code: 'X05', label: 'Prurit', chapter: 'X', category: 'Symptoms' },
  { code: 'X06', label: 'Dyspnée', chapter: 'X', category: 'Symptoms' },
  { code: 'X07', label: 'Toux', chapter: 'X', category: 'Symptoms' },
  { code: 'X08', label: 'Éruption cutanée', chapter: 'X', category: 'Symptoms' },
  { code: 'X09', label: 'Autre symptôme', chapter: 'X', category: 'Symptoms' },

  // Y - General/Preventive
  { code: 'Y01', label: 'Vaccination', chapter: 'Y', category: 'Preventive' },
  { code: 'Y02', label: 'Dépistage', chapter: 'Y', category: 'Preventive' },
  { code: 'Y03', label: 'Consultation préventive', chapter: 'Y', category: 'Preventive' },
  { code: 'Y04', label: 'Suivi chronique', chapter: 'Y', category: 'Preventive' },
  { code: 'Y05', label: 'Certificat médical', chapter: 'Y', category: 'Preventive' },
  { code: 'Y06', label: 'Conseil de santé', chapter: 'Y', category: 'Preventive' },
  { code: 'Y07', label: 'Éducation thérapeutique', chapter: 'Y', category: 'Preventive' },
  { code: 'Y08', label: 'Arrêt du tabac', chapter: 'Y', category: 'Preventive' },
  { code: 'Y09', label: 'Autre consultation générale', chapter: 'Y', category: 'Preventive' }
];

// Fonction de recherche dans le dataset CISP-2
export function searchCISP2Dataset(query: string): CISP2Entry[] {
  if (!query || query.length < 2) return [];

  const searchTerm = query.toLowerCase().trim();

  return cisp2Dataset.filter(entry =>
    entry.code.toLowerCase().includes(searchTerm) ||
    entry.label.toLowerCase().includes(searchTerm) ||
    entry.category.toLowerCase().includes(searchTerm) ||
    entry.chapter.toLowerCase().includes(searchTerm)
  ).slice(0, 20); // Limiter à 20 résultats
}

// Fonction pour obtenir un code CISP-2 par code
export function getCISP2ByCode(code: string): CISP2Entry | undefined {
  return cisp2Dataset.find(entry => entry.code === code);
}

// Fonction pour obtenir les codes par chapitre
export function getCISP2ByChapter(chapter: string): CISP2Entry[] {
  return cisp2Dataset.filter(entry => entry.chapter === chapter);
}