// ═══════════════════════════════════════════════════════
// Admin View - Configurações do Locador & Nuvem
// ═══════════════════════════════════════════════════════

const Admin = {
  render(container) {
    const profile = Storage.getAdminProfile();
    let fbConfig = {};
    try {
      fbConfig = JSON.parse(localStorage.getItem('gerador_firebase_config')) || {};
    } catch(e) {}
    
    container.innerHTML = `
      <div class="admin-container animate-fade-in-up">
        
        <div class="page-header">
          <div>
            <h1 class="page-title">Meu Perfil</h1>
            <p class="page-subtitle">Estes dados serão preenchidos automaticamente em todos os novos contratos.</p>
          </div>
          <button class="btn btn-primary" onclick="Admin.save()" style="white-space: nowrap;">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Salvar
          </button>
        </div>

        <div class="card">
          <!-- Seção Pessoal -->
          <h3 class="section-title">Dados Pessoais (Locador)</h3>
          <div class="form-grid">
            <div class="form-group form-group-full">
              <label class="form-label">Nome Completo</label>
              <input type="text" class="form-input" id="admin_nome_locador" value="${profile.nome_locador || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Nacionalidade</label>
              <select class="form-input" id="admin_nac_locador">
                <option value="brasileiro(a)">Brasileiro(a)</option>
                <option value="estrangeiro(a)">Estrangeiro(a)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Estado Civil</label>
              <select class="form-input" id="admin_est_civil_locador">
                <option value="">Selecione...</option>
                <option value="solteiro(a)">Solteiro(a)</option>
                <option value="casado(a)">Casado(a)</option>
                <option value="divorciado(a)">Divorciado(a)</option>
                <option value="viúvo(a)">Viúvo(a)</option>
                <option value="separado(a) judicialmente">Separado(a) judicialmente</option>
                <option value="em união estável">União Estável</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">RG</label>
              <input type="text" class="form-input" id="admin_rg_locador" value="${profile.rg_locador || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">CPF / CNPJ</label>
              <input type="text" class="form-input" id="admin_doc_locador" data-mask="cpfcnpj" value="${profile.doc_locador || ''}">
            </div>
          </div>

          <!-- Seção Banco -->
          <h3 class="section-title">Dados Bancários para Recebimento</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Banco</label>
              <input type="text" class="form-input" id="admin_banco" value="${profile.banco || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Agência</label>
              <input type="text" class="form-input" id="admin_agencia" value="${profile.agencia || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Conta (com dígito)</label>
              <input type="text" class="form-input" id="admin_conta_banco" value="${profile.conta_banco || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Tipo de Conta</label>
              <select class="form-input" id="admin_tipo_conta">
                <option value="">Selecione...</option>
                <option value="Conta Corrente">Conta Corrente</option>
                <option value="Conta Poupança">Conta Poupança</option>
                <option value="Conta Salário">Conta Salário</option>
                <option value="Conta Pagamento">Conta Pagamento</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Seção Banco de Dados em Nuvem (Firebase) -->
        <div class="card" style="margin-top: 2rem;">
          <h3 class="section-title">Banco de Dados em Nuvem (Firebase)</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
            Insira as credenciais do seu projeto Firebase para ativar o salvamento automático na nuvem, login seguro e links curtos para inquilinos. Deixe em branco para usar o modo offline (salvando apenas no seu navegador).
          </p>
          <div class="form-grid">
            <div class="form-group form-group-full">
              <label class="form-label">API Key</label>
              <input type="text" class="form-input" id="admin_fb_apiKey" value="${fbConfig.apiKey || ''}" placeholder="AIzaSy...">
            </div>
            <div class="form-group">
              <label class="form-label">Project ID</label>
              <input type="text" class="form-input" id="admin_fb_projectId" value="${fbConfig.projectId || ''}" placeholder="meu-projeto-123">
            </div>
            <div class="form-group">
              <label class="form-label">Auth Domain</label>
              <input type="text" class="form-input" id="admin_fb_authDomain" value="${fbConfig.authDomain || ''}" placeholder="meu-projeto-123.firebaseapp.com">
            </div>
            <div class="form-group">
              <label class="form-label">Storage Bucket</label>
              <input type="text" class="form-input" id="admin_fb_storageBucket" value="${fbConfig.storageBucket || ''}" placeholder="meu-projeto-123.appspot.com">
            </div>
            <div class="form-group">
              <label class="form-label">Messaging Sender ID</label>
              <input type="text" class="form-input" id="admin_fb_messagingSenderId" value="${fbConfig.messagingSenderId || ''}" placeholder="1234567890">
            </div>
            <div class="form-group form-group-full">
              <label class="form-label">App ID</label>
              <input type="text" class="form-input" id="admin_fb_appId" value="${fbConfig.appId || ''}" placeholder="1:1234567890:web:abcdef...">
            </div>
          </div>
        </div>
      </div>
    `;

    // Seta os valores iniciais dos selects
    if (profile.nac_locador) container.querySelector('#admin_nac_locador').value = profile.nac_locador;
    if (profile.est_civil_locador) container.querySelector('#admin_est_civil_locador').value = profile.est_civil_locador;
    if (profile.tipo_conta) container.querySelector('#admin_tipo_conta').value = profile.tipo_conta;

    // Aplica as máscaras
    container.querySelectorAll('input[data-mask]').forEach(el => {
      Utils.applyMask(el, el.getAttribute('data-mask'));
    });
  },

  save() {
    const profile = {
      nome_locador: document.getElementById('admin_nome_locador').value,
      nac_locador: document.getElementById('admin_nac_locador').value,
      est_civil_locador: document.getElementById('admin_est_civil_locador').value,
      rg_locador: document.getElementById('admin_rg_locador').value,
      doc_locador: document.getElementById('admin_doc_locador').value,
      banco: document.getElementById('admin_banco').value,
      agencia: document.getElementById('admin_agencia').value,
      conta_banco: document.getElementById('admin_conta_banco').value,
      tipo_conta: document.getElementById('admin_tipo_conta').value
    };

    Storage.saveAdminProfile(profile);

    // Salvar configuração do Firebase
    const apiKey = document.getElementById('admin_fb_apiKey').value.trim();
    const projectId = document.getElementById('admin_fb_projectId').value.trim();
    const authDomain = document.getElementById('admin_fb_authDomain').value.trim();
    const storageBucket = document.getElementById('admin_fb_storageBucket').value.trim();
    const messagingSenderId = document.getElementById('admin_fb_messagingSenderId').value.trim();
    const appId = document.getElementById('admin_fb_appId').value.trim();

    let configChanged = false;
    if (apiKey && projectId) {
      const newConfig = { apiKey, projectId, authDomain, storageBucket, messagingSenderId, appId };
      const currentConfigStr = localStorage.getItem('gerador_firebase_config');
      if (JSON.stringify(newConfig) !== currentConfigStr) {
        localStorage.setItem('gerador_firebase_config', JSON.stringify(newConfig));
        configChanged = true;
      }
    } else {
      if (localStorage.getItem('gerador_firebase_config')) {
        localStorage.removeItem('gerador_firebase_config');
        configChanged = true;
      }
    }
    
    // Mostra um feedback visual no botão
    const btn = document.querySelector('button[onclick="Admin.save()"]');
    const originalText = btn.innerHTML;
    
    if (configChanged) {
      btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H12v4"></path></svg> Reiniciando...';
      btn.style.backgroundColor = 'var(--primary)';
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Salvo com Sucesso!';
      btn.style.backgroundColor = 'var(--success)';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '';
      }, 2000);
    }
  }
};
