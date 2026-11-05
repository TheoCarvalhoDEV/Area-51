// ═══════════════════════════════════════════════════════
// Admin View - Configurações do Locador
// ═══════════════════════════════════════════════════════

const Admin = {
  render(container) {
    const profile = Storage.getAdminProfile();
    const isPJ = Utils.isPJLocador(profile);

    container.innerHTML = `
      <div class="admin-container animate-fade-in-up">
        
        <div class="page-header">
          <div>
            <div class="page-kicker">Conta</div>
            <h1 class="page-title">Meu perfil</h1>
            <p class="page-subtitle">Estes dados entram sozinhos em todo contrato novo.</p>
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
            <div class="form-group">
              <label for="admin_nome_locador" class="form-label">${isPJ ? 'Razão Social' : 'Nome Completo'}</label>
              <input type="text" class="form-input" id="admin_nome_locador" value="${Utils.esc(profile.nome_locador)}">
            </div>
            <div class="form-group pf-only" ${isPJ ? 'style="display:none;"' : ''}>
              <label for="admin_nac_locador" class="form-label">Nacionalidade</label>
              <select class="form-input" id="admin_nac_locador">
                <option value="brasileiro(a)">Brasileiro(a)</option>
                <option value="estrangeiro(a)">Estrangeiro(a)</option>
              </select>
            </div>
            <div class="form-group pf-only" ${isPJ ? 'style="display:none;"' : ''}>
              <label for="admin_est_civil_locador" class="form-label">Estado Civil</label>
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
            <div class="form-group pf-only" ${isPJ ? 'style="display:none;"' : ''}>
              <label for="admin_rg_locador" class="form-label">RG</label>
              <input type="text" class="form-input" id="admin_rg_locador" value="${Utils.esc(profile.rg_locador)}">
            </div>
            <div class="form-group">
              <label for="admin_doc_locador" class="form-label">${isPJ ? 'CNPJ' : 'CPF'}</label>
              <input type="text" class="form-input" id="admin_doc_locador" data-mask="cpfcnpj" value="${Utils.esc(profile.doc_locador)}">
            </div>
          </div>

          <!-- Seção Banco -->
          <h3 class="section-title">Dados Bancários para Recebimento</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="admin_banco" class="form-label">Banco</label>
              <input type="text" class="form-input" id="admin_banco" value="${Utils.esc(profile.banco)}">
            </div>
            <div class="form-group">
              <label for="admin_agencia" class="form-label">Agência</label>
              <input type="text" class="form-input" id="admin_agencia" value="${Utils.esc(profile.agencia)}">
            </div>
            <div class="form-group">
              <label for="admin_conta_banco" class="form-label">Conta (com dígito)</label>
              <input type="text" class="form-input" id="admin_conta_banco" value="${Utils.esc(profile.conta_banco)}">
            </div>
            <div class="form-group">
              <label for="admin_tipo_conta" class="form-label">Tipo de Conta</label>
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

        <form class="card" style="margin-top: 24px;" onsubmit="event.preventDefault(); Admin.trocarSenha(this)">
          <h3 class="section-title">Trocar senha</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="senha_atual">Senha atual</label>
              <input type="password" class="form-input" id="senha_atual" autocomplete="current-password" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="senha_nova">Senha nova</label>
              <input type="password" class="form-input" id="senha_nova" autocomplete="new-password" minlength="8" required placeholder="Mín. 8 caracteres">
            </div>
            <div class="form-group">
              <label class="form-label" for="senha_confirma">Repita a senha nova</label>
              <input type="password" class="form-input" id="senha_confirma" autocomplete="new-password" minlength="8" required>
            </div>
          </div>
          <button type="submit" class="btn btn-secondary">Trocar senha</button>
        </form>

        <div class="card card-perigo" style="margin-top: 24px;">
          <h3 class="section-title" style="color: var(--danger);">Excluir conta</h3>
          <p class="page-subtitle" style="margin: 0 0 14px;">
            Apaga permanentemente sua conta, seu perfil e todos os seus contratos (LGPD, art. 18).
            Esta ação não pode ser desfeita.
          </p>
          <div class="form-group" style="max-width: 320px; margin-bottom: 12px;">
            <label class="form-label" for="admin_senha_exclusao">Sua senha, para confirmar</label>
            <input type="password" class="form-input" id="admin_senha_exclusao" autocomplete="current-password">
          </div>
          <button class="btn btn-danger" onclick="Admin.deleteAccount()">Excluir minha conta e todos os dados</button>
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
    // O tipo (PF/PJ) é definido no cadastro e não muda aqui — vem do perfil salvo.
    const atual = Storage.getAdminProfile() || {};
    const isPJ = Utils.isPJLocador(atual);

    const profile = {
      // Preserva o que esta tela não edita — em especial `termos_aceite`, a
      // evidência do aceite dos Termos gravada no cadastro.
      ...atual,
      tipo_locador: isPJ ? 'pj' : 'pf',
      nome_locador: document.getElementById('admin_nome_locador').value,
      nac_locador: isPJ ? '' : document.getElementById('admin_nac_locador').value,
      est_civil_locador: isPJ ? '' : document.getElementById('admin_est_civil_locador').value,
      rg_locador: isPJ ? '' : document.getElementById('admin_rg_locador').value,
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
  },

  // Exclusão da própria conta (LGPD, art. 18): DELETE /api/auth/conta apaga tudo em cascata.
  // O servidor cobra a senha atual e o mínimo de 8; aqui só se adianta o aviso
  // de confirmação, que o servidor não tem como saber.
  trocarSenha(form) {
    const atual = form.querySelector('#senha_atual').value;
    const nova = form.querySelector('#senha_nova').value;
    if (nova !== form.querySelector('#senha_confirma').value) {
      Utils.toast('A confirmação não bate com a senha nova.', 'error');
      return;
    }
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    Api.trocarSenha(atual, nova).then(() => {
      form.reset();
      Utils.toast('Senha trocada. Outros aparelhos conectados foram desconectados.');
    }).catch(err => {
      Utils.toast('A senha não foi trocada: ' + (err.message || err), 'error');
    }).finally(() => { botao.disabled = false; });
  },

  deleteAccount() {
    if (!App.user) return;
    // Senha, não uma palavra digitada: a rota apaga tudo de forma irreversível e
    // é chamável em uma linha de console. Digitar "EXCLUIR" prova intenção de
    // quem está na tela, não que a sessão é mesmo do dono — e uma sessão roubada
    // (ou um XSS) tem as duas coisas.
    // Campo de senha de verdade, não `prompt()`: o prompt nativo não mascara o
    // que se digita, e a senha ficava legível na tela para quem estivesse ao lado.
    const campo = document.getElementById('admin_senha_exclusao');
    const senha = campo ? campo.value : '';
    if (!senha) {
      Utils.toast('Digite sua senha no campo acima. Nada foi apagado.', 'error');
      if (campo) campo.focus();
      return;
    }
    if (!confirm('Isso apaga sua conta, seu perfil e TODOS os seus contratos, sem volta. Continuar?')) return;

    // A senha e cobrada de novo no servidor, nao so aqui: esta tela e a
    // penultima confirmacao, nao a ultima.
    Api.excluirConta(senha).then(() => {
      localStorage.removeItem(Storage.PENDING_PROFILE_KEY);
      window.location.hash = '#';
      window.location.reload();
    }).catch(err => {
      console.error(err);
      Utils.toast('Erro ao excluir a conta: ' + (err.message || err), 'error');
    });
  }
};
