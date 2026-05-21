// ═══════════════════════════════════════════════════════
// Editor View
// ═══════════════════════════════════════════════════════

const Editor = {
  contract: null,
  template: null,
  
  render(container, param) {
    let isNew = false;
    
    if (param.startsWith('template=')) {
      isNew = true;
      const tId = param.split('=')[1];
      this.template = Contracts[tId];
      if (!this.template) { window.location.hash = '#templates'; return; }
      
      this.contract = {
        name: 'Novo Contrato - ' + this.template.title,
        templateId: tId,
        fields: {}
      };
      
      // Auto-preencher dados do Locador e Timbre se disponíveis
      const profile = Storage.getAdminProfile();
      if (profile) {
        Object.keys(profile).forEach(k => {
          this.contract.fields[k] = profile[k];
        });
      }
    } else if (param.startsWith('id=')) {
      const cId = param.split('=')[1];
      this.contract = Storage.getById(cId);
      if (!this.contract) { window.location.hash = '#dashboard'; return; }
      this.template = Contracts[this.contract.templateId];
    } else {
      window.location.hash = '#dashboard'; return;
    }

    container.innerHTML = `
      <div class="editor-toolbar animate-fade-in-down">
        <input type="text" id="contract-name" class="form-input editor-toolbar-title" style="width: auto; max-width: 400px; background: transparent; border-color: transparent;" value="${this.contract.name}">
        <button class="btn btn-secondary" onclick="Editor.save(true)">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
          Salvar
        </button>
        <button class="btn btn-primary" onclick="Editor.generateTenantLink()" style="background: var(--primary);">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
          Gerar Link p/ Inquilino
        </button>
        <button class="btn btn-primary" onclick="generatePDF()">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          PDF
        </button>
      </div>

      <div class="editor-layout animate-fade-in-up">
        <div class="editor-form-panel glass" id="form-container"></div>
        <div class="editor-preview-panel glass">
          <div class="preview-header">
            <span>Visualização do Documento</span>
          </div>
          <div class="preview-document" id="preview-content">
            ${this.template.template}
          </div>
        </div>
      </div>
    `;

    this.renderForm();
    this.updatePreview();
    
    document.getElementById('contract-name').addEventListener('change', (e) => {
      this.contract.name = e.target.value;
    });
  },
  
  renderForm() {
    const container = document.getElementById('form-container');
    const sections = {};
    
    // Group fields by section
    this.template.fields.forEach(f => {
      if (!sections[f.section]) sections[f.section] = [];
      sections[f.section].push(f);
    });

    let html = '';
    for (const [secName, fields] of Object.entries(sections)) {
      // Ocultar as seções que vêm do AdminProfile ou que vão para o Inquilino
      const hiddenSections = ['locatário', 'locador', 'conta p/ pagamento'];
      const isHidden = hiddenSections.includes(secName.toLowerCase());
      
      html += `
        <div class="form-section" style="${isHidden ? 'display: none;' : ''}">
          <div class="form-section-header" onclick="this.classList.toggle('collapsed')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            <h3>${secName}</h3>
          </div>
          <div class="form-section-body">
      `;
      
      fields.forEach(f => {
        const val = this.contract.fields[f.name] || '';
        html += `<div class="form-group">
          <label class="form-label">${f.label}</label>
          ${f.type === 'textarea' 
            ? `<textarea class="form-textarea" data-field="${f.name}">${val}</textarea>`
            : `<input type="${f.type}" class="form-input" data-field="${f.name}" value="${val}" ${f.mask ? `data-mask="${f.mask}"` : ''}>`
          }
        </div>`;
      });
      
      html += `</div></div>`;
    }
    
    if (sections['Locatário']) {
      html += `
        <div class="form-section">
          <div style="padding: 1rem; text-align: center; color: var(--success); border: 1px dashed var(--success); border-radius: 8px; margin-bottom: 1rem;">
            <p style="margin:0;"><strong>✓ Seus dados e da sua Conta Bancária foram carregados automaticamente.</strong></p>
          </div>
          <div style="padding: 1rem; text-align: center; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 8px;">
            <p>A seção <strong>Locatário</strong> está oculta.</p>
            <p style="font-size: 0.9em; margin-top: 5px;">Clique em "Gerar Link p/ Inquilino" para que ele mesmo preencha estes dados.</p>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Attach listeners
    container.querySelectorAll('input, textarea').forEach(el => {
      // Masks
      const mask = el.getAttribute('data-mask');
      if (mask) Utils.applyMask(el, mask);
      
      // Live Preview
      el.addEventListener('input', () => {
        this.contract.fields[el.getAttribute('data-field')] = el.value;
        this.updatePreview();
      });
    });
  },

  updatePreview() {
    const prev = document.getElementById('preview-content');
    prev.querySelectorAll('.highlight').forEach(el => {
      const field = el.getAttribute('data-field');
      const val = this.contract.fields[field];
      el.textContent = val ? val : '___';
      if(val) el.style.borderBottom = 'none';
      else el.style.borderBottom = '2px dashed var(--primary)';
    });
  },

  save(showAlert = false) {
    if (this.contract.id) {
      Storage.update(this.contract.id, this.contract);
    } else {
      this.contract = Storage.create(this.contract);
      window.location.hash = `#editor?id=${this.contract.id}`;
    }
    if(showAlert) alert('Contrato salvo com sucesso!');
  },

  generateTenantLink() {
    this.save(false);
    
    // Create base64 payload
    const payload = {
      t: this.contract.templateId,
      f: this.contract.fields
    };
    
    // Encode properly avoiding unicode base64 issues
    const str = JSON.stringify(payload);
    const b64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
    
    const url = window.location.origin + window.location.pathname + '#tenant?data=' + b64;
    
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copiado para a área de transferência!\n\nEnvie este link no WhatsApp do Inquilino para ele preencher.');
    }).catch(err => {
      alert('Não foi possível copiar o link automaticamente. Copie a URL abaixo:\n\n' + url);
    });
  }
};
