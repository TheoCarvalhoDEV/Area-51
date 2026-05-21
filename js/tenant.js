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
          
          <div class="tenant-layout animate-fade-in-up">
            
            <div class="tenant-preview-panel glass">
              <div class="preview-header" style="background: var(--bg); padding: 1rem; border-bottom: 1px solid var(--border); font-weight: bold; display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0;">
                <span>📄 Leia o Contrato Abaixo</span>
              </div>
              <div style="max-height: 50vh; overflow-y: auto; border-radius: 0 0 8px 8px; border: 1px solid var(--border-light);">
                <div id="preview-content" class="preview-document" style="padding: 2rem; background: white; color: black; font-family: Arial, Helvetica, sans-serif;">
                  ${this.template.template}
                </div>
              </div>
            </div>

            <div class="tenant-form-panel glass" id="tenant-form-container" style="margin-top: 2rem;"></div>

          </div>
          
          <button class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; padding: 1.2rem; font-size: 1.1rem; justify-content: center;" onclick="Tenant.finish()">
            Salvar e Enviar para o Locador
          </button>
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
      if (f.hidden) return;
      
      let inputHtml = '';
      if (f.type === 'textarea') {
        inputHtml = `<textarea class="form-textarea" data-field="${f.name}"></textarea>`;
      } else if (f.type === 'select') {
        inputHtml = `<select class="form-input" data-field="${f.name}">`;
        f.options.forEach(opt => {
          inputHtml += `<option value="${opt.value}">${opt.label}</option>`;
        });
        inputHtml += `</select>`;
      } else {
        inputHtml = `<input type="${f.type}" class="form-input" data-field="${f.name}" ${f.mask ? `data-mask="${f.mask}"` : ''}>`;
      }

      html += `<div class="form-group">
        <label class="form-label">${f.label}</label>
        ${inputHtml}
      </div>`;
    });
    
    container.innerHTML = html;

    container.querySelectorAll('input, textarea, select').forEach(el => {
      const mask = el.getAttribute('data-mask');
      if (mask) Utils.applyMask(el, mask);
      
      el.addEventListener('input', () => {
        const fieldName = el.getAttribute('data-field');
        this.contract.fields[fieldName] = el.value;
        this.updatePreview();
      });
    });
    
    // Atualizar preview logo no início com os dados já preenchidos pelo locador
    this.updatePreview();
  },

  updatePreview() {
    const prev = document.getElementById('preview-content');
    if (!prev) return;
    
    prev.querySelectorAll('.highlight').forEach(el => {
      const field = el.getAttribute('data-field');
      let val = this.contract.fields[field];
      
      // Formatar datas do padrão ISO (YYYY-MM-DD) para Brasileiro (DD/MM/YYYY)
      if (val && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
         const parts = val.split('-');
         val = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      
      el.textContent = val ? val : '___';
    });
  },

  finish() {
    // Create base64 payload for import
    const payload = {
      t: this.contract.templateId,
      f: this.contract.fields
    };
    const str = JSON.stringify(payload);
    const b64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
    
    // Import link that goes back to the admin's app
    const importUrl = window.location.origin + window.location.pathname + '#import?data=' + b64;
    const waText = encodeURIComponent("Olá! Preenchi os meus dados no contrato. Segue o link para você importar no painel:\n\n" + importUrl);
    const waUrl = "https://wa.me/?text=" + waText;

    // Se estiver testando no mesmo computador, já salva direto no dashboard (localStorage)
    if (typeof Storage !== 'undefined') {
      try {
        Storage.create({
          name: 'Contrato Finalizado - ' + (this.contract.fields.nome_locatario || 'Inquilino'),
          templateId: this.contract.templateId,
          fields: this.contract.fields,
          isFinalized: true
        });
      } catch(e) {}
    }

    const formContainer = document.getElementById('tenant-form-container');
    if (formContainer) {
      formContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem 0;">
          <svg fill="none" stroke="var(--success)" viewBox="0 0 24 24" style="width:64px; height:64px; margin-bottom: 1rem;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h2 style="color: var(--success); margin-bottom: 0.5rem;">Dados Preenchidos!</h2>
          <p style="color: var(--text-muted); margin-bottom: 2rem;">Agora, você precisa enviar estes dados de volta para o Locador.</p>
          
          <a href="${waUrl}" target="_blank" class="btn btn-primary" style="width: 100%; justify-content: center; background: #25D366; border: none; padding: 1.2rem; font-size: 1.1rem; margin-bottom: 1rem;">
            <svg fill="currentColor" viewBox="0 0 24 24" style="width: 24px; margin-right: 8px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Enviar para Locador
          </a>
          
          <button class="btn btn-secondary" style="width: 100%; justify-content: center; padding: 1.2rem; font-size: 1.1rem;" onclick="Tenant.downloadPDF()">
            Baixar PDF (Opcional)
          </button>
        </div>
      `;
    }
    
    // Hide original main submit button
    const submitBtn = document.querySelector('.tenant-card > button');
    if (submitBtn) submitBtn.style.display = 'none';
  },

  downloadPDF() {
    const element = document.getElementById('preview-content');
    if (!element) return;
    
    // Salvar estado original para reverter depois
    const originalPadding = element.style.padding;
    const originalBoxShadow = element.style.boxShadow;
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;
    const originalMargin = element.style.margin;
    
    // Remover estilos da tela e fixar largura em 800px para o PDF ficar bem enquadrado
    element.style.padding = '0';
    element.style.boxShadow = 'none';
    element.style.width = '800px';
    element.style.maxWidth = '800px';
    element.style.margin = '0 auto';
    
    // Salvar e modificar os highlights
    const originalHighlights = [];
    element.querySelectorAll('.highlight').forEach(el => {
      const field = el.getAttribute('data-field');
      const val = this.contract.fields[field];
      
      originalHighlights.push({
        el: el,
        text: el.textContent,
        bg: el.style.backgroundColor,
        color: el.style.color,
        borderBottom: el.style.borderBottom
      });
      
      el.textContent = val ? val : '___';
      if(val) el.style.borderBottom = 'none';
      else el.style.borderBottom = '1px solid black'; // PDF looks better with solid black line than dashed blue
      el.style.color = 'black';
      el.style.backgroundColor = 'transparent';
    });
    
    const opt = {
      margin:       [15, 15, 15, 15],
      filename:     'Contrato_Locacao.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, logging: false, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'td', 'h1', 'h2', 'ul'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // Reverter estilos do container
      element.style.padding = originalPadding;
      element.style.boxShadow = originalBoxShadow;
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;
      element.style.margin = originalMargin;
      
      // Reverter highlights
      originalHighlights.forEach(orig => {
        orig.el.textContent = orig.text;
        orig.el.style.backgroundColor = orig.bg;
        orig.el.style.color = orig.color;
        orig.el.style.borderBottom = orig.borderBottom;
      });
      
      alert('Seu Contrato foi baixado com sucesso!');
    });
  }
};
