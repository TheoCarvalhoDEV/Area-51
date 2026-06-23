// ═══════════════════════════════════════════════════════
// Firebase Configuration & Initialization Module
// ═══════════════════════════════════════════════════════

let FirebaseDB = null;
let FirebaseAuth = null;
let FirebaseActive = false;

(function() {
  const configStr = localStorage.getItem('gerador_firebase_config');
  if (configStr) {
    try {
      const config = JSON.parse(configStr);
      // Verifica se a configuração possui os campos obrigatórios
      if (config.apiKey && config.projectId) {
        firebase.initializeApp(config);
        FirebaseDB = firebase.firestore();
        FirebaseAuth = firebase.auth();
        FirebaseActive = true;
        console.log("🔥 Firebase inicializado com sucesso usando as credenciais configuradas.");
      }
    } catch (e) {
      console.error("❌ Erro ao inicializar Firebase com a configuração salva:", e);
    }
  }

  if (!FirebaseActive) {
    console.warn("⚠️ Firebase não configurado ou inativo. O app está operando em modo OFFLINE (usando localStorage). Configure suas credenciais em 'Meu Perfil' para ativar a nuvem!");
  }
})();
