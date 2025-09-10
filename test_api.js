// Script de test pour vérifier l'API patient-profile
// À exécuter avec: node test_api.js

const testData = {
  phone_number: "+33123456789",
  date_of_birth: "1990-01-01",
  address: "123 Test Street",
  city: "Paris",
  postal_code: "75001",
  gender: "male",
  social_security_number: "123456789012345",
  civility: "M.",
  birth_name: "Dupont",
  treating_physician_id: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  emergency_contact_relationship: null,
  insurance_provider: null,
  insurance_number: null,
  insurance_expiry_date: null,
  allergies: null,
  current_medications: null,
  medical_conditions: null,
  sleep_schedule: null,
  sleep_quality: null,
  preferred_language: "fr"
};

console.log('🧪 Test des données à envoyer:', JSON.stringify(testData, null, 2));

// Note: Pour exécuter ce test, vous devez:
// 1. Être connecté avec un token d'authentification valide
// 2. Remplacer YOUR_AUTH_TOKEN par un token réel
// 3. Modifier l'URL selon votre environnement

/*
fetch('http://localhost:3000/api/patient-profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_AUTH_TOKEN'
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('📡 Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('📨 Response:', data);
})
.catch(error => {
  console.error('❌ Error:', error);
});
*/

console.log('📋 Script de test créé. Pour l\'exécuter:');
console.log('1. Connectez-vous à l\'app avec somnolink4@yopmail.com');
console.log('2. Ouvrez les outils de développement (F12)');
console.log('3. Allez dans l\'onglet Console');
console.log('4. Remplissez le formulaire et soumettez-le');
console.log('5. Vérifiez les logs qui commencent par 🔍, 📤, ✅, ❌');