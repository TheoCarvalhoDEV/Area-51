// ═══════════════════════════════════════════════════════
// Tenant View - Interface para o Inquilino (Mobile)
// ═══════════════════════════════════════════════════════

const Tenant = {
  contract: null,
  template: null,
  
  render(container, param) {
    if (!param || !param.startsWith('data=')) {
      container.innerHTML = '<h3 style="text-align:center; padding:3rem;">Link inválido ou expirado.</h3>';
      return;
    }
    
    try {
      const b64 = param.split('=')[1];
      const str = decodeURIComponent(Array.prototype.map.call(atob(b64), function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(str);
      
      this.template = Contracts[payload.t];
      this.contract = {
        templateId: payload.t,
        fields: payload.f
      };
      
    } catch (e) {
      container.innerHTML = '<h3 style="color:red; text-align:center; padding: 3rem;">Erro ao ler o link do contrato.</h3>';
      return;
    }

    container.innerHTML = `
      <div class="tenant-container animate-fade-in-up">
        <div class="tenant-header">
          <h2>Contrato de Locação</h2>
          <p>Preencha seus dados pessoais abaixo para finalizar o contrato.</p>
        </div>
        
        <div class="tenant-card glass">
          <div class="tenant-summary">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:24px; height:24px; margin-bottom:10px; color:var(--primary);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <br>
            <strong>Imóvel:</strong> ${this.contract.fields.end_imovel || 'Imóvel Residencial'}<br>
            <strong style="color:var(--primary); font-size:1.1rem;">${this.contract.fields.valor_aluguel || 'A Combinar'} / mês</strong>
          </div>
          
          <div id="tenant-form-container"></div>
          
          <button class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; padding: 1.2rem; font-size: 1.1rem; justify-content: center;" onclick="Tenant.finish()">
            Gerar Contrato (PDF)
          </button>
        </div>
        
        <!-- Hidden Preview for PDF Generation -->
        <div id="preview-wrapper" style="position: absolute; left: -9999px; top: 0;">
          <div id="preview-content" class="preview-document" style="padding: 40px; background: white; color: black; font-family: 'Playfair Display', serif;">
            ${this.template.template}
          </div>
        </div>
      </div>
    `;

    this.renderForm();
  },
  
  renderForm() {
    const container = document.getElementById('tenant-form-container');
    const tenantFields = this.template.fields.filter(f => f.section.toLowerCase() === 'locatário');
    
    let html = '<h3 style="margin-bottom: 1.5rem; color: var(--text-light); text-align:center; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">Seus Dados Pessoais</h3>';
    
    tenantFields.forEach(f => {
      html += `<div class="form-group">
        <label class="form-label">${f.label}</label>
        ${f.type === 'textarea' 
          ? `<textarea class="form-textarea" data-field="${f.name}"></textarea>`
          : `<input type="${f.type}" class="form-input" data-field="${f.name}" ${f.mask ? `data-mask="${f.mask}"` : ''}>`
        }
      </div>`;
    });
    
    container.innerHTML = html;

    container.querySelectorAll('input, textarea').forEach(el => {
      const mask = el.getAttribute('data-mask');
      if (mask) Utils.applyMask(el, mask);
      
      el.addEventListener('input', () => {
        this.contract.fields[el.getAttribute('data-field')] = el.value;
      });
    });
  },

  finish() {
    const prev = document.getElementById('preview-content');
    
    // Fill the hidden preview with all data
    prev.querySelectorAll('.highlight').forEach(el => {
      const field = el.getAttribute('data-field');
      const val = this.contract.fields[field];
      el.textContent = val ? val : '___';
      if(val) el.style.borderBottom = 'none';
      else el.style.borderBottom = '1px solid black'; // PDF looks better with solid black line than dashed blue
      el.style.color = 'black';
    });
    
    const opt = {
      margin:       [20, 20, 20, 20],
      filename:     'Contrato_Locacao.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(prev).save().then(() => {
      alert('Seu Contrato foi gerado com sucesso! Verifique a pasta de downloads do seu celular/computador.');
    });
  }
};
