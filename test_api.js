// Test simple de l'API appointments
// node test_api.js

const testAppointment = async () => {
  try {
    console.log('🔍 Test de l\'API appointments...');

    const response = await fetch('http://localhost:3001/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: '2025-01-31',
        time: '14:00',
        type: 'first_consultation',
        notes: 'Test depuis script Node.js',
        doctorToken: 'KsiimJt1o3s='
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers));

    const text = await response.text();
    console.log('📊 Réponse:', text);

    if (response.ok) {
      console.log('✅ API fonctionne !');
    } else {
      console.log('❌ API retourne erreur');
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  }
};

testAppointment();