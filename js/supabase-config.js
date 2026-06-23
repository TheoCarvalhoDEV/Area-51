// ═══════════════════════════════════════════════════════
// Supabase Configuration & Initialization Module
// ═══════════════════════════════════════════════════════

const supabaseUrl = 'https://hbmqmzsssccrsyqdyixd.supabase.co';
const supabaseKey = 'sb_publishable_zKudHzqDlkkSHp4Q5n7KrQ_wBW7mHFb';

let supabaseClient = null;
let SupabaseActive = false;

(function() {
  if (typeof supabase !== 'undefined') {
    try {
      const { createClient } = supabase;
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      SupabaseActive = true;
      console.log("⚡ Supabase inicializado com sucesso usando as credenciais fornecidas.");
    } catch (e) {
      console.error("❌ Erro ao inicializar Supabase:", e);
    }
  } else {
    console.error("❌ SDK do Supabase não encontrado. Verifique a importação no index.html.");
  }
})();
