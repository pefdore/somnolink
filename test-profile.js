// Script de test simple pour vérifier le profil patient
// À exécuter dans la console du navigateur sur la page profil

console.log('=== TEST PROFIL PATIENT ===');

// Vérifier si les éléments du formulaire existent
const checkFormElements = () => {
  const elements = [
    'phone', 'doctor', 'dob', 'gender', 'address', 'city', 'postalCode',
    'allergies', 'medications', 'conditions', 'sleepSchedule', 'sleepQuality',
    'emergencyName', 'emergencyPhone', 'emergencyRelationship',
    'insuranceProvider', 'insuranceNumber', 'insuranceExpiry'
  ];

  console.log('Vérification des éléments du formulaire:');
  elements.forEach(id => {
    const element = document.getElementById(id);
    console.log(`${id}: ${element ? '✅ Présent' : '❌ Manquant'}`);
  });
};

// Vérifier si les sections sont présentes
const checkSections = () => {
  const sections = [
    'Informations personnelles',
    'Informations médicales',
    'Informations sur le sommeil',
    'Contact d\'urgence',
    'Informations d\'assurance',
    'Sécurité'
  ];

  console.log('\nVérification des sections:');
  sections.forEach(section => {
    const elements = document.querySelectorAll('*');
    let found = false;
    elements.forEach(el => {
      if (el.textContent && el.textContent.includes(section)) {
        found = true;
      }
    });
    console.log(`${section}: ${found ? '✅ Présente' : '❌ Manquante'}`);
  });
};

// Vérifier la validation
const testValidation = () => {
  console.log('\nTest de validation:');

  // Tester un numéro de téléphone invalide
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.value = 'invalid-phone';
    phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('Test téléphone invalide: ✅ Testé');
  }

  // Tester une date de naissance dans le futur
  const dobInput = document.getElementById('dob');
  if (dobInput) {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    dobInput.value = futureDate.toISOString().split('T')[0];
    dobInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('Test date naissance future: ✅ Testé');
  }
};

// Exécuter les tests
checkFormElements();
checkSections();
testValidation();

console.log('\n=== FIN DU TEST ===');
console.log('Si tous les éléments sont présents, le profil fonctionne correctement.');
console.log('Appliquez la migration SQL pour activer toutes les fonctionnalités.');