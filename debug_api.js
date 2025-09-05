// Script de débogage pour tester l'API appointments
// À exécuter avec: node debug_api.js

const testData = {
  date: '2025-01-31',
  time: '14:00',
  type: 'first_consultation',
  notes: 'Test appointment from debug script',
  doctorToken: 'KsiimJt1o3s='
};

console.log('🔍 Test de l\'API /api/appointments');
console.log('📤 Données envoyées:', JSON.stringify(testData, null, 2));

fetch('http://localhost:3000/api/appointments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('📥 Status:', response.status);
  console.log('📥 Headers:', Object.fromEntries(response.headers.entries()));
  return response.text();
})
.then(data => {
  console.log('📥 Réponse:', data);
})
.catch(error => {
  console.error('❌ Erreur:', error.message);
});