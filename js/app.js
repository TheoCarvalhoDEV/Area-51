// ═══════════════════════════════════════════════════════
// App Principal & Router
// ═══════════════════════════════════════════════════════

const App = {
  routes: {
    '': 'dashboard',
    '#': 'dashboard',
    '#dashboard': 'dashboard',
    '#templates': 'templates',
    '#contracts': 'contracts',
    '#editor': 'editor',
    '#admin': 'admin',
    '#tenant': 'tenant'
  },
  
  init() {
    this.container = document.getElementById('main-content');
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
    this.setupSidebar();
  },
  
  handleRoute() {
    const hash = window.location.hash;
    // Fix: split by '?' instead of '?id=' to support both '?id=' and '?template='
    const [path, param] = hash.split('?');
    
    // Rota Especial de Importação do Inquilino
    if (path === '#import') {
      const urlParams = new URLSearchParams(param);
      const serverId = urlParams.get('id');
      const key = urlParams.get('key');
      
      if (serverId && key) {
        this.container.innerHTML = `
          <div style="text-align: center; padding: 5rem 0;">
            <div class="spinner" style="border: 4px solid var(--border); border-top: 4px solid var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1.5rem;"></div>
            <h3>Buscando e importando contrato de forma segura da nuvem...</h3>
          </div>
          <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        `;
        
        CloudDB.loadContract(serverId, key).then(payload => {
          const localContracts = Storage.getAll();
          const existing = localContracts.find(c => c.cloudId === serverId);
          
          let localId;
          if (existing) {
            // Atualiza contrato existente
            const updated = Storage.update(existing.id, {
              fields: payload.f,
              isFinalized: true
            });
            localId = updated.id;
          } else {
            // Cria um novo contrato importado
            const newContract = Storage.create({
              name: 'Contrato Importado - ' + (payload.f.nome_locatario || 'Inquilino'),
              templateId: payload.t,
              fields: payload.f,
              cloudId: serverId,
              cloudKey: key,
              isFinalized: true
            });
            localId = newContract.id;
          }
          
          alert('Contrato importado com sucesso e salvo no seu painel!');
          window.location.hash = `#editor?id=${localId}`;
        }).catch(err => {
          alert('Erro ao importar contrato seguro da nuvem: ' + err.message);
          window.location.hash = '#dashboard';
        });
        return; // Interrompe a execução normal de roteamento
      }
      
      // Fallback para o antigo formato base64 em URL
      try {
        const b64 = param.split('=')[1];
        const str = decodeURIComponent(Array.prototype.map.call(atob(b64), function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(str);
        
        const contract = {
          name: 'Contrato Importado - ' + (payload.f.nome_locatario || 'Inquilino'),
          templateId: payload.t,
          fields: payload.f,
          isFinalized: true
        };
        Storage.create(contract);
        alert('Contrato importado com sucesso e salvo no seu painel!');
        window.location.hash = '#dashboard';
      } catch(e) {
        alert('Erro ao importar contrato. O link pode estar quebrado.');
        window.location.hash = '#dashboard';
      }
      return; // Interrompe a execução normal de roteamento
    }
    
    const route = this.routes[path] || 'dashboard';
    
    // Esconder a navegação e a sidebar se for a tela do Tenant (Cliente)
    if (route === 'tenant') {
      document.body.classList.add('tenant-mode');
    } else {
      document.body.classList.remove('tenant-mode');
    }

    this.updateNav(route);
    
    // Close sidebar on mobile after navigation
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
    if (overlay && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
    }
    
    if (route === 'dashboard') Dashboard.render(this.container);
    else if (route === 'templates') Templates.render(this.container);
    else if (route === 'contracts') ContractsView.render(this.container);
    else if (route === 'editor') Editor.render(this.container, param);
    else if (route === 'admin') Admin.render(this.container);
    else if (route === 'tenant') Tenant.render(this.container, param);
  },
  
  updateNav(route) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('active');
      if (el.getAttribute('href') === '#' + route || (route==='dashboard' && el.getAttribute('href')==='#')) {
        el.classList.add('active');
      }
    });
  },
  
  setupSidebar() {
    // Mobile menu logic can go here later if needed
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
