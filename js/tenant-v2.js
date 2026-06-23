// ═══════════════════════════════════════════════════════
// Tenant View - Interface para o Inquilino (Mobile)
// ═══════════════════════════════════════════════════════

const Tenant = {
  contract: null,
  template: null,
  
  render(container, param) {
    if (!param) {
      container.innerHTML = '<h3 style="text-align:center; padding:3rem;">Link inválido ou expirado.</h3>';
      return;
    }
    
    if (param.startsWith('id=')) {
      // Novo link seguro na nuvem
      const urlParams = new URLSearchParams(param);
      const serverId = urlParams.get('id');
      const key = urlParams.get('key');
      
      if (!serverId || !key) {
        container.innerHTML = '<h3 style="text-align:center; padding:3rem;">Link incompleto ou inválido.</h3>';
        return;
      }
      
      container.innerHTML = `
        <div style="text-align: center; padding: 5rem 0;">
          <div class="spinner" style="border: 4px solid var(--border); border-top: 4px solid var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1.5rem;"></div>
          <h3>Buscando contrato com segurança no servidor...</h3>
        </div>
        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      `;
      
      CloudDB.loadContract(serverId, key).then(payload => {
        this.contract = {
          templateId: payload.t,
          fields: payload.f,
          cloudId: serverId,
          cloudKey: key,
          localId: payload.localId
        };
        
        this.template = Contracts[payload.t] || (Storage._getData().customTemplates || []).find(t => t.id === payload.t);
        if (!this.template) {
          container.innerHTML = '<h3 style="text-align:center; padding:3rem;">Link inválido. Modelo de contrato não encontrado.</h3>';
          return;
        }
        
        this.renderTenantUI(container);
      }).catch(err => {
        console.error(err);
        container.innerHTML = `<h3 style="color:red; text-align:center; padding: 3rem;">Erro ao carregar o contrato com segurança: ${err.message}</h3>`;
      });
      return;
    }
    
    if (param.startsWith('data=')) {
      // Legado Base64
      let tId = '';
      try {
        const b64 = param.split('=')[1];
        const str = decodeURIComponent(Array.prototype.map.call(atob(b64), function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(str);
        
        tId = payload.t;
        this.contract = {
          templateId: payload.t,
          fields: payload.f
        };
        
        this.template = Contracts[payload.t] || (Storage._getData().customTemplates || []).find(t => t.id === payload.t);
        if (!this.template) {
          container.innerHTML = '<h3 style="text-align:center; padding:3rem;">Link inválido ou expirado. Modelo não encontrado.</h3>';
          return;
        }
        
      } catch (e) {
        container.innerHTML = '<h3 style="color:red; text-align:center; padding: 3rem;">Erro ao ler o link do contrato.</h3>';
        return;
      }
      
      this.renderTenantUI(container);
    }
  },

  renderTenantUI(container) {
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
          <div style="margin-top: 1.5rem; display: flex; align-items: flex-start; gap: 0.5rem; background: var(--card-bg); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
            <input type="checkbox" id="aceito_contrato" style="margin-top: 0.25rem; width: 18px; height: 18px;" onchange="document.getElementById('btn_salvar_inquilino').disabled = !this.checked">
            <label for="aceito_contrato" style="font-size: 0.95rem; color: var(--text-main); cursor: pointer;">
              Declaro que li e concordo com todos os termos descritos no contrato acima.
            </label>
          </div>
          
          <div style="position: relative;" onclick="if(document.getElementById('btn_salvar_inquilino').disabled) alert('⚠️ Por favor, marque a caixa acima confirmando que leu o contrato para poder salvar.')">
            <button id="btn_salvar_inquilino" class="btn btn-primary" style="width: 100%; margin-top: 1rem; padding: 1.2rem; font-size: 1.1rem; justify-content: center;" onclick="Tenant.finish()" disabled>
              Salvar e Enviar para o Locador
            </button>
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
      if (f.hidden) return;
      
      let inputHtml = '';
      const val = this.contract.fields[f.name] || '';
      if (f.type === 'textarea') {
        inputHtml = `<textarea class="form-textarea" data-field="${f.name}">${val}</textarea>`;
      } else if (f.type === 'select') {
        inputHtml = `<select class="form-input" data-field="${f.name}">`;
        f.options.forEach(opt => {
          inputHtml += `<option value="${opt.value}" ${val === opt.value ? 'selected' : ''}>${opt.label}</option>`;
        });
        inputHtml += `</select>`;
      } else {
        inputHtml = `<input type="${f.type}" class="form-input" data-field="${f.name}" value="${val}" ${f.mask ? `data-mask="${f.mask}"` : ''}>`;
      }

      html += `<div class="form-group">
        <label class="form-label">${f.label}</label>
        ${inputHtml}
      </div>`;
    });
    
    container.innerHTML = html;

    container.querySelectorAll('input, textarea, select').forEach(el => {
      const mask = el.getAttribute('data-mask');
      if (mask) {
        Utils.applyMask(el, mask);
        if (el.value) el.dispatchEvent(new Event('input'));
      }
      
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
      
      // Aplicar máscara de formatação na preview caso o dado esteja sem máscara
      if (val) {
        const fieldDef = this.template.fields.find(f => f.name === field);
        if (fieldDef && fieldDef.mask) {
          const fnName = 'mask' + fieldDef.mask.charAt(0).toUpperCase() + fieldDef.mask.slice(1);
          if (Utils[fnName]) {
            val = Utils[fnName](val);
          }
        }
      }
      
      el.textContent = val ? val : '___';
    });
  },

  finish() {
    // Validação de CPF
    let isValid = true;
    let errorMsg = '';
    
    document.querySelectorAll('input[data-mask="cpfcnpj"]').forEach(el => {
      const val = el.value.replace(/\D/g, '');
      if (val.length > 0 && val.length <= 11) {
        if (!Utils.isValidCPF(val)) {
          isValid = false;
          errorMsg = 'O CPF informado (' + el.value + ') é inválido. Por favor, corrija.';
          el.style.borderColor = 'red';
        } else {
          el.style.borderColor = '';
        }
      }
    });

    if (!isValid) {
      alert(errorMsg);
      return;
    }

    // Validação de campos vazios (opcional, mas recomendado)
    const requiredEmpty = Array.from(document.querySelectorAll('#tenant-form-container input, #tenant-form-container select')).find(el => !el.value.trim());
    if (requiredEmpty) {
      if (!confirm('Ainda há campos vazios. Tem certeza que deseja enviar o contrato incompleto?')) {
        return;
      }
    }

    const saveFinishedUI = (waUrl) => {
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
      
      const submitBtn = document.getElementById('btn_salvar_inquilino');
      if (submitBtn) submitBtn.style.display = 'none';
      const aceitoContainer = document.getElementById('aceito_contrato')?.parentElement;
      if (aceitoContainer) aceitoContainer.style.display = 'none';
    };

    if (this.contract.cloudId && this.contract.cloudKey) {
      // Modo seguro na nuvem
      const saveBtn = document.getElementById('btn_salvar_inquilino');
      const originalHTML = saveBtn ? saveBtn.innerHTML : '';
      if (saveBtn) {
        saveBtn.innerHTML = `Salvando com segurança...`;
        saveBtn.disabled = true;
      }

      const payload = {
        t: this.contract.templateId,
        f: this.contract.fields,
        localId: this.contract.localId,
        isFinalized: true
      };

      CloudDB.updateContract(this.contract.cloudId, payload, this.contract.cloudKey).then(() => {
        const importUrl = window.location.origin + window.location.pathname + '#import?id=' + this.contract.cloudId + '&key=' + this.contract.cloudKey;
        const waText = encodeURIComponent("Olá! Preenchi os meus dados no contrato com segurança. Segue o link para você visualizar/importar no seu painel:\n\n" + importUrl);
        const waUrl = "https://wa.me/?text=" + waText;
        
        saveFinishedUI(waUrl);
      }).catch(err => {
        alert("Erro ao salvar dados no servidor seguro: " + err.message);
        if (saveBtn) {
          saveBtn.innerHTML = originalHTML;
          saveBtn.disabled = false;
        }
      });

    } else {
      // Modo legado Base64
      const payload = {
        t: this.contract.templateId,
        f: this.contract.fields
      };
      const str = JSON.stringify(payload);
      const b64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
          return String.fromCharCode('0x' + p1);
      }));
      
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
      
      saveFinishedUI(waUrl);
    }
  },

  downloadPDF() {
    this.updatePreview();
    
    // Pegar o nome do inquilino para sugerir como nome de arquivo
    const nomeInquilino = this.contract.fields.nome_locatario || 'Inquilino';
    const nomeContrato = 'Contrato - ' + nomeInquilino;
    
    // Salvar o título original da página
    const originalTitle = document.title;
    
    // Mudar o título temporariamente (o Chrome usa isso como nome do arquivo .pdf)
    document.title = nomeContrato;
    
    // Chamar a tela de impressão do navegador
    window.print();
    
    // Restaurar o título original
    document.title = originalTitle;
  }
};
