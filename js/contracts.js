// ═══════════════════════════════════════════════════════
// Contracts View (Gestão de Clientes)
// ═══════════════════════════════════════════════════════

const ContractsView = {
  render(container) {
    // Se Utils.formatDate não existir em utils.js, adicionamos uma fallback temporária
    if (!Utils.formatDate) {
       Utils.formatDate = (val) => {
          if (!val) return '---';
          if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
             const parts = val.split('-');
             return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
          return val;
       };
    }
    
    const allContracts = Storage.getAll();
    
    // Filtra contratos residenciais e comerciais
    const residenciais = allContracts.filter(c => c.templateId && c.templateId.toLowerCase().includes('residencial'));
    const comerciais = allContracts.filter(c => c.templateId && c.templateId.toLowerCase().includes('comercial'));
    
    // Função auxiliar para renderizar a lista de clientes
    const renderList = (contracts, emptyMessage) => {
      if (contracts.length === 0) {
        return `
          <div class="empty-state glass">
            <p>${emptyMessage}</p>
            <a href="#templates" class="btn btn-primary">Criar Novo Contrato</a>
          </div>
        `;
      }
      
      return contracts.map(c => {
        const nomeCliente = c.fields && c.fields.nome_locatario ? c.fields.nome_locatario : 'Locatário não preenchido';
        const valor = c.fields && c.fields.valor_aluguel ? c.fields.valor_aluguel : 'R$ ---';
        const inicio = c.fields && c.fields.data_inicio ? Utils.formatDate(c.fields.data_inicio) : '---';
        const tituloContrato = c.name || 'Contrato sem nome';

        return `
          <div class="contract-row" onclick="window.location.hash='#editor?id=${c.id}'">
            <div class="contract-row-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <div class="contract-row-info">
              <div class="contract-row-name">${nomeCliente}</div>
              <div class="contract-row-meta"><strong>${tituloContrato}</strong> • Início: ${inicio}</div>
            </div>
            <div class="contract-row-date" style="font-size: 0.95rem; font-weight: 600; color: var(--primary);">
              ${valor}
            </div>
          </div>
        `;
      }).join('');
    };

    let html = `
      <div class="page-header animate-fade-in-down">
        <div>
          <h1 class="page-title">Gestão de Contratos</h1>
          <p class="page-subtitle">Acompanhe seus locatários separados por categoria.</p>
        </div>
        <a href="#templates" class="btn btn-primary">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Novo Contrato
        </a>
      </div>

      <div class="contracts-tabs animate-fade-in-up" style="margin-bottom: 1.5rem; display: flex; gap: 1rem;">
        <button class="btn btn-primary" id="tab-residencial" onclick="ContractsView.switchTab('residencial')" style="flex: 1; justify-content: center; background: var(--primary); box-shadow: var(--shadow-md);">
          Residenciais (${residenciais.length})
        </button>
        <button class="btn btn-secondary" id="tab-comercial" onclick="ContractsView.switchTab('comercial')" style="flex: 1; justify-content: center; background: var(--card-bg); color: var(--text-main);">
          Comerciais (${comerciais.length})
        </button>
      </div>

      <div class="recent-section animate-fade-in-up" id="list-residencial">
        <div class="recent-header">
          <h2 class="recent-title">Contratos Residenciais</h2>
        </div>
        <div class="contracts-list">
          ${renderList(residenciais, 'Você ainda não tem contratos residenciais cadastrados.')}
        </div>
      </div>

      <div class="recent-section animate-fade-in-up" id="list-comercial" style="display: none;">
        <div class="recent-header">
          <h2 class="recent-title">Contratos Comerciais</h2>
        </div>
        <div class="contracts-list">
          ${renderList(comerciais, 'Você ainda não tem contratos comerciais cadastrados.')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  },
  
  switchTab(tab) {
    const btnResidencial = document.getElementById('tab-residencial');
    const btnComercial = document.getElementById('tab-comercial');
    const listResidencial = document.getElementById('list-residencial');
    const listComercial = document.getElementById('list-comercial');
    
    if (tab === 'residencial') {
      btnResidencial.className = 'btn btn-primary';
      btnResidencial.style.background = 'var(--primary)';
      btnResidencial.style.color = '#fff';
      btnResidencial.style.boxShadow = 'var(--shadow-md)';
      
      btnComercial.className = 'btn btn-secondary';
      btnComercial.style.background = 'var(--card-bg)';
      btnComercial.style.color = 'var(--text-main)';
      btnComercial.style.boxShadow = 'none';
      
      listResidencial.style.display = 'block';
      listComercial.style.display = 'none';
    } else {
      btnComercial.className = 'btn btn-primary';
      btnComercial.style.background = 'var(--primary)';
      btnComercial.style.color = '#fff';
      btnComercial.style.boxShadow = 'var(--shadow-md)';
      
      btnResidencial.className = 'btn btn-secondary';
      btnResidencial.style.background = 'var(--card-bg)';
      btnResidencial.style.color = 'var(--text-main)';
      btnResidencial.style.boxShadow = 'none';
      
      listComercial.style.display = 'block';
      listResidencial.style.display = 'none';
    }
  }
};
