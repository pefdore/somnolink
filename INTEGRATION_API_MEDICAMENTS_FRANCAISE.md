# Intégration de l'API Française des Médicaments

## 🎯 **Objectif**
Intégrer l'API officielle française des médicaments (https://github.com/Gizmo091/fr.gouv.medicaments.rest) pour remplacer/améliorer la recherche de médicaments actuelle.

## 📊 **Analyse de l'API**

### **Avantages de l'API Française**
- ✅ **Données officielles** : Base de données officielle française
- ✅ **Mise à jour régulière** : Données toujours à jour
- ✅ **Complète** : CIS, CIP, AMM, remboursement, etc.
- ✅ **Structurée** : Format JSON cohérent
- ✅ **Gratuite** : API publique sans clé requise

### **Structure des données**
```json
{
  "id": "CIS_code",
  "denomination": "ASPIRINE UPSA 500 mg",
  "forme_pharmaceutique": "comprimé",
  "voies_administration": ["orale"],
  "statut_autorisation": "Autorisation active",
  "titulaire": "UPSA SAS",
  "date_amm": "2020-01-15",
  "cis": "60000000",
  "presentations": [
    {
      "cip13": "3400930000000",
      "libelle": "500 mg cp",
      "statut_administratif": "Présentation active",
      "etat_commercialisation": "Commercialisée",
      "date_declaration_commercialisation": "2020-01-15",
      "cis": "60000000",
      "taux_remboursement": "65%",
      "prix": 2.50
    }
  ]
}
```

## 🏗️ **Architecture proposée**

### **1. Nouveau service API** (`src/app/api/medicaments-fr/route.ts`)
```typescript
// Endpoint pour rechercher des médicaments français
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = searchParams.get('limit') || '20';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  try {
    // Recherche dans l'API française
    const response = await fetch(
      `https://medicaments.api.gouv.fr/api/medicaments?query=${encodeURIComponent(query)}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();

    // Transformation des données pour le frontend
    const formattedResults = data.map((med: any) => ({
      id: med.cis,
      name: med.denomination,
      type: 'medicament',
      source: 'fr-gouv',
      pharmaceuticalForm: med.forme_pharmaceutique,
      administrationRoutes: med.voies_administration,
      authorizationStatus: med.statut_autorisation,
      holder: med.titulaire,
      ammDate: med.date_amm,
      presentations: med.presentations?.map((pres: any) => ({
        cip13: pres.cip13,
        label: pres.libelle,
        administrativeStatus: pres.statut_administratif,
        commercializationStatus: pres.etat_commercialisation,
        commercializationDate: pres.date_declaration_commercialisation,
        reimbursementRate: pres.taux_remboursement,
        price: pres.prix
      })) || []
    }));

    return NextResponse.json({
      success: true,
      medications: formattedResults,
      total: formattedResults.length
    });

  } catch (error) {
    console.error('Erreur API médicaments français:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche de médicaments' },
      { status: 500 }
    );
  }
}
```

### **2. Mise à jour du composant de recherche**
```typescript
// Dans AntecedentsManagementModal.tsx
const searchFrenchMedications = async (query: string) => {
  if (query.length < 2) {
    setMedicationResults([]);
    return;
  }

  setIsSearching(prev => ({ ...prev, medication: true }));

  try {
    console.log('🔍 Recherche médicaments français:', query);

    // Nouvelle API française en priorité
    const frenchResponse = await fetch(`/api/medicaments-fr?q=${encodeURIComponent(query)}`);

    if (frenchResponse.ok) {
      const frenchData = await frenchResponse.json();
      if (frenchData.medications?.length > 0) {
        setMedicationResults(frenchData.medications);
        setIsSearching(prev => ({ ...prev, medication: false }));
        return;
      }
    }

    // Fallback vers l'API actuelle si nécessaire
    const fallbackResponse = await fetch(`/api/drug-search?q=${encodeURIComponent(query)}&country=${searchCountry}`);
    const fallbackData = await fallbackResponse.json();

    if (fallbackData.error) {
      console.error('❌ Erreur API médicaments:', fallbackData.error);
      setMedicationResults([]);
    } else {
      console.log('✅ Médicaments trouvés (fallback):', fallbackData.medications?.length || 0);
      setMedicationResults(fallbackData.medications || []);
    }

  } catch (error) {
    console.error('❌ Erreur recherche médicaments:', error);
    setMedicationResults([]);
  } finally {
    setIsSearching(prev => ({ ...prev, medication: false }));
  }
};
```

### **3. Améliorations UX**

#### **Affichage enrichi**
```typescript
// Nouveau format d'affichage pour les médicaments français
<div className="font-medium text-purple-600 truncate">
  {medication.name}
</div>
<div className="text-sm text-gray-700 truncate">
  {medication.pharmaceuticalForm} • {medication.holder}
</div>
<div className="text-xs text-gray-500 truncate">
  CIP: {medication.presentations[0]?.cip13} • {medication.presentations[0]?.reimbursementRate} remboursé
</div>
<div className="text-xs text-green-600 font-medium">
  🇫🇷 Données officielles françaises
</div>
```

#### **Filtres avancés**
- Par statut d'autorisation (autorisation active, archivée, etc.)
- Par voie d'administration (orale, injectable, etc.)
- Par taux de remboursement
- Par laboratoire titulaire

## 🚀 **Plan d'implémentation**

### **Phase 1 : Intégration de base**
1. Créer le nouvel endpoint API
2. Tester la connectivité avec l'API française
3. Adapter le format des données
4. Intégrer comme source primaire

### **Phase 2 : Améliorations UX**
1. Nouveau design d'affichage des résultats
2. Ajout de filtres avancés
3. Indicateurs visuels pour la source des données
4. Cache local pour les recherches fréquentes

### **Phase 3 : Fonctionnalités avancées**
1. Historique des recherches
2. Favoris de médicaments
3. Export des informations médicaments
4. Intégration avec l'ordonnance électronique

## 📈 **Bénéfices attendus**

- **Fiabilité** : Données officielles et à jour
- **Conformité** : Respect des normes françaises
- **Performance** : API optimisée pour la recherche médicale
- **UX** : Meilleure présentation des informations
- **Évolutivité** : Base solide pour futures fonctionnalités

## 🔧 **Configuration requise**

```bash
# Variables d'environnement (si nécessaire pour cache)
NEXT_PUBLIC_MEDICAMENTS_CACHE_DURATION=3600000  # 1 heure
NEXT_PUBLIC_MEDICAMENTS_API_TIMEOUT=5000       # 5 secondes
```

## ✅ **Validation**

- [ ] Tests de connectivité API
- [ ] Validation du format des données
- [ ] Tests de performance
- [ ] Validation UX avec médecins
- [ ] Tests de fallback vers APIs existantes

---

**Cette intégration apporterait une valeur significative à l'application en fournissant des données de médicaments fiables et officielles françaises.**