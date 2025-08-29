// scripts/check-env.js
// Script de vérification des variables d'environnement pour le build

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const optionalEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'ICD_API_CLIENT_ID',
  'ICD_API_CLIENT_SECRET',
  'ICD_API_SEARCH_URL',
  'ICD_API_TOKEN_URL'
];

function checkEnvironment() {
  console.log('🔍 Vérification des variables d\'environnement...\n');
  
  let hasErrors = false;
  
  // Vérifier les variables requises
  console.log('=== VARIABLES REQUISES ===');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.error(`❌ ${varName}: NON DÉFINIE`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: DÉFINIE`);
      if (varName.includes('KEY')) {
        console.log(`   Valeur: ${value.substring(0, 20)}... (${value.length} caractères)`);
      } else {
        console.log(`   Valeur: ${value}`);
      }
    }
  });
  
  // Vérifier les variables optionnelles
  console.log('\n=== VARIABLES OPTIONNELLES ===');
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`⚠️  ${varName}: NON DÉFINIE`);
    } else {
      console.log(`✅ ${varName}: DÉFINIE`);
      if (varName.includes('KEY') || varName.includes('SECRET')) {
        console.log(`   Valeur: ${value.substring(0, 20)}... (${value.length} caractères)`);
      } else {
        console.log(`   Valeur: ${value}`);
      }
    }
  });
  
  // Afficher le résultat
  console.log('\n=== RÉSULTAT ===');
  if (hasErrors) {
    console.warn('⚠️  AVERTISSEMENT: Variables requises manquantes!');
    console.warn('L\'application ne pourra pas fonctionner correctement sans ces variables.');
    console.warn('\nPour résoudre ce problème:');
    console.warn('1. Configurez les variables dans Vercel Dashboard → Settings → Environment Variables');
    console.warn('2. Ou ajoutez-les dans un fichier .env.local pour le développement local');
    console.warn('3. Redéployez après configuration');
    // On ne fait pas échouer le build pour permettre la configuration post-déploiement
    console.warn('\nLe build continue mais l\'application ne fonctionnera pas jusqu\'à configuration des variables.');
  } else {
    console.log('✅ Toutes les variables requises sont configurées!');
    console.log('Le build peut continuer normalement.');
  }
}

// Exécuter la vérification
checkEnvironment();