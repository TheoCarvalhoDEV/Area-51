// ═══════════════════════════════════════════════════════
// App Principal & Router
// ═══════════════════════════════════════════════════════

const App = {
  routes: {
    '': 'dashboard',
    '#': 'dashboard',
    '#dashboard': 'dashboard',
    '#templates': 'templates',
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
    
    if (route === 'dashboard') Dashboard.render(this.container);
    else if (route === 'templates') Templates.render(this.container);
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
