// ═══════════════════════════════════════════════════════
// Admin View - Configurações do Locador
// ═══════════════════════════════════════════════════════

const Admin = {
  render(container) {
    const profile = Storage.getAdminProfile();
    
    container.innerHTML = `
      <div class="admin-container animate-fade-in-up" style="max-width: 800px; margin: 0 auto; padding: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <div>
            <h1 style="color: var(--text-light); margin-bottom: 0.5rem; font-family: var(--font-ui);">Meu Perfil (Locador)</h1>
            <p style="color: var(--text-muted);">Estes dados serão preenchidos automaticamente em todos os novos contratos.</p>
          </div>
          <button class="btn btn-primary" onclick="Admin.save()">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Salvar Perfil
          </button>
        </div>

        <div class="glass" style="padding: 2rem; border-radius: 12px;">
          <!-- Seção Pessoal -->
          <h3 style="color: var(--primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">Dados Pessoais (Locador)</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
            <div class="form-group" style="grid-column: 1 / -1;">
              <label class="form-label">Nome Completo</label>
              <input type="text" class="form-input" id="admin_nome_locador" value="${profile.nome_locador || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Nacionalidade</label>
              <input type="text" class="form-input" id="admin_nac_locador" value="${profile.nac_locador || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Estado Civil</label>
              <input type="text" class="form-input" id="admin_est_civil_locador" value="${profile.est_civil_locador || ''}">
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
          <h3 style="color: var(--primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">Dados Bancários para Recebimento</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
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
              <input type="text" class="form-input" id="admin_tipo_conta" value="${profile.tipo_conta || ''}" placeholder="Ex: Conta Corrente">
            </div>
          </div>
        </div>
      </div>
    `;

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
    
    // Mostra um feedback visual no botão
    const btn = document.querySelector('button[onclick="Admin.save()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Salvo com Sucesso!';
    btn.style.backgroundColor = 'var(--success)';
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.backgroundColor = '';
    }, 2000);
  }
};
