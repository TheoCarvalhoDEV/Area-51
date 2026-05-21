// ═══════════════════════════════════════════════════════
// Dashboard View
// ═══════════════════════════════════════════════════════

const Dashboard = {
  render(container) {
    const stats = Storage.getStats();
    const recent = Storage.getAll().slice(0, 5);
    
    let recentHtml = recent.length ? recent.map(c => `
      <div class="contract-row" onclick="window.location.hash='#editor?id=${c.id}'">
        <div class="contract-row-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <div class="contract-row-info">
          <div class="contract-row-name">${c.name || 'Contrato sem nome'}</div>
          <div class="contract-row-meta">${Contracts[c.templateId]?.title || 'Modelo Desconhecido'}</div>
        </div>
        <div class="contract-row-date">${Utils.formatRelativeDate(c.updatedAt)}</div>
      </div>
    `).join('') : `
      <div class="empty-state glass">
        <p>Você ainda não criou nenhum contrato.</p>
        <a href="#templates" class="btn btn-primary">Criar Novo</a>
      </div>
    `;

    container.innerHTML = `
      <div class="page-header animate-fade-in-down">
        <div>
          <h1 class="page-title">Visão Geral</h1>
          <p class="page-subtitle">Acompanhe e gerencie seus contratos.</p>
        </div>
        <a href="#templates" class="btn btn-primary">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Novo Contrato
        </a>
      </div>

      <div class="stats-grid stagger-1 animate-fade-in-up">
        <div class="card stat-card">
          <div class="stat-icon purple">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <div>
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total de Contratos</div>
          </div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon green">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <div>
            <div class="stat-value">${stats.thisMonth}</div>
            <div class="stat-label">Criados este Mês</div>
          </div>
        </div>
      </div>

      <div class="recent-section stagger-2 animate-fade-in-up">
        <div class="recent-header">
          <h2 class="recent-title">Editados Recentemente</h2>
        </div>
        <div class="contracts-list">
          ${recentHtml}
        </div>
      </div>
    `;
  }
};
