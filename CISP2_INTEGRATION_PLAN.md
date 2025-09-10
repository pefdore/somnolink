# 🏥 Intégration CISP-2 + CIM-11 - Plan d'Architecture

## 🎯 **Objectif**
Intégrer la Classification Internationale des Soins Primaires (CISP-2) en complément de la CIM-11 pour maximiser les options de codage structuré.

## 📊 **État Actuel**
- ✅ Architecture multi-systèmes déjà supportée (`system` field)
- ✅ Composant `CimSearchModal` extensible
- ✅ API `/api/terminology-search` flexible

## 🔧 **Options d'Implémentation CISP-2**

### **Option 1: API Externe (Recommandée)**
```typescript
// Extension de l'API actuelle
const CISP2_API_URL = 'https://api.cisp2.org/search';

// Nouvelles fonctions dans terminology-search API
async function searchCISP2(term: string): Promise<CISP2Result[]> {
  const response = await fetch(`${CISP2_API_URL}?q=${term}`);
  return response.json();
}
```

### **Option 2: Dataset Local (Solution de Repli)**
```typescript
// Structure de données CISP-2
interface CISP2Entry {
  code: string;
  label: string;
  chapter: string;
  category: string;
}

// Dataset intégré dans le projet
import { cisp2Dataset } from '@/data/cisp2-dataset';
```

### **Option 3: Hybride (Recommandée)**
- API externe pour recherche avancée
- Dataset local pour les codes fréquents
- Synchronisation périodique

## 🏗️ **Architecture Proposée**

### **1. Extension de la Base de Données**
```sql
-- La structure actuelle supporte déjà multiple systèmes
ALTER TABLE antecedents ADD CONSTRAINT check_system
CHECK (system IN ('CIM-11', 'CISP-2', 'SNOMED', 'Custom'));
```

### **2. Interface Utilisateur Étendue**
```typescript
// Composant de sélection de système
const SystemSelector: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<'CIM-11' | 'CISP-2'>('CIM-11');

  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setSelectedSystem('CIM-11')}
        className={`px-3 py-1 rounded ${selectedSystem === 'CIM-11' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
      >
        CIM-11
      </button>
      <button
        onClick={() => setSelectedSystem('CISP-2')}
        className={`px-3 py-1 rounded ${selectedSystem === 'CISP-2' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
      >
        CISP-2
      </button>
    </div>
  );
};
```

### **3. API Étendue**
```typescript
// /api/terminology-search étendu
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const system = searchParams.get('system') || 'CIM-11';

  if (system === 'CISP-2') {
    return searchCISP2(query);
  } else {
    return searchCIM11(query);
  }
}
```

## 📋 **Plan de Développement**

### **Phase 1: Infrastructure**
- [ ] Étendre `CimSearchModal` pour support multi-systèmes
- [ ] Ajouter sélecteur de système dans l'interface
- [ ] Mettre à jour l'API terminology-search

### **Phase 2: CISP-2 Dataset**
- [ ] Créer dataset CISP-2 local (codes fréquents)
- [ ] Implémenter recherche locale
- [ ] Tester l'intégration

### **Phase 3: API CISP-2 (Optionnel)**
- [ ] Rechercher API CISP-2 publique
- [ ] Implémenter client API
- [ ] Gestion des erreurs et fallback

### **Phase 4: Tests & Validation**
- [ ] Tests d'intégration
- [ ] Validation des données
- [ ] Performance et UX

## 🎨 **Interface Utilisateur**

### **Design Proposé**
```
┌─────────────────────────────────────┐
│ 🔍 Recherche CIM-11 | CISP-2       │
├─────────────────────────────────────┤
│ ▶️ CIM-11  ▶️ CISP-2                 │
├─────────────────────────────────────┤
│ Rechercher dans la classification... │
├─────────────────────────────────────┤
│ 📋 Résultats:                       │
│ • A01 - Maladie infectieuse         │
│ • A02 - Tumeur maligne             │
│ • P01 - Grossesse                   │
└─────────────────────────────────────┘
```

## 🔗 **Sources CISP-2**

### **API Possibles**
1. **OMS/WONCA** - API officielle (si disponible)
2. **Services nationaux** - France, Belgique, Suisse
3. **Services académiques** - Universités médicales

### **Dataset de Repli**
- Codes CISP-2 fréquents en soins primaires
- ~500-1000 codes principaux
- Mise à jour annuelle

## 📈 **Bénéfices**

### **Pour les Médecins**
- ✅ Plus de précision dans le codage
- ✅ Meilleure classification des motifs de consultation
- ✅ Codage adapté aux soins primaires

### **Pour les Patients**
- ✅ Terminologie plus accessible
- ✅ Meilleure compréhension des diagnostics
- ✅ Historique médical plus structuré

### **Pour le Système**
- ✅ Données plus riches
- ✅ Interopérabilité améliorée
- ✅ Statistiques plus précises

## 🚀 **Recommandation**

**Commencer par l'Option 3 (Hybride)** :
1. Dataset local pour démarrage rapide
2. API externe pour complétude
3. Migration progressive

**Priorité** : Implémenter rapidement avec dataset local, puis ajouter API si disponible.

---

**Temps estimé** : 2-3 jours pour implémentation de base
**Complexité** : Moyenne (extension de l'existant)
**Risque** : Faible (architecture déjà adaptée)