// ═══════════════════════════════════════════════════════
// Utilitários — Máscaras, formatação, validação, DOM helpers
// ═══════════════════════════════════════════════════════

const Utils = {
  // ── Máscaras de Input ──
  maskCPF(v) {
    return v.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2').slice(0,14);
  },
  maskCNPJ(v) {
    return v.replace(/\D/g,'').replace(/^(\d{2})(\d)/,'$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3')
      .replace(/\.(\d{3})(\d)/,'.$1/$2')
      .replace(/(\d{4})(\d)/,'$1-$2').slice(0,18);
  },
  maskCPFCNPJ(v) {
    const digits = v.replace(/\D/g,'');
    return digits.length <= 11 ? Utils.maskCPF(v) : Utils.maskCNPJ(v);
  },
  maskPhone(v) {
    const d = v.replace(/\D/g,'');
    if (d.length <= 10) return d.replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{4})(\d)/,'$1-$2');
    return d.replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d)/,'$1-$2').slice(0,15);
  },
  maskCEP(v) {
    return v.replace(/\D/g,'').replace(/(\d{5})(\d)/,'$1-$2').slice(0,9);
  },
  maskCurrency(v) {
    let d = v.replace(/\D/g,'');
    if (!d) return '';
    d = (parseInt(d) / 100).toFixed(2);
    return 'R$ ' + d.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },
  maskDate(v) {
    return v.replace(/\D/g,'').replace(/(\d{2})(\d)/,'$1/$2').replace(/(\d{2})(\d)/,'$1/$2').slice(0,10);
  },
  maskPercentage(v) {
    let d = v.replace(/[^\d,]/g,'');
    return d ? d + '%' : '';
  },

  // ── Formatação ──
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  },
  formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  },
  formatRelativeDate(date) {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'agora';
    if (diff < 3600) return Math.floor(diff/60) + ' min atrás';
    if (diff < 86400) return Math.floor(diff/3600) + 'h atrás';
    if (diff < 604800) return Math.floor(diff/86400) + 'd atrás';
    return Utils.formatDate(date);
  },
  dateExtended(dateStr) {
    if (!dateStr) return '____________________';
    const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parts[2];
    return `${day} de ${months[month] || '___'} de ${year}`;
  },
  currencyExtended(val) {
    if (!val) return '(____________________)';
    return val;
  },

  // ── Validação ──
  isValidCPF(cpf) {
    cpf = cpf.replace(/\D/g,'');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== parseInt(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    return rest === parseInt(cpf[10]);
  },

  // ── Aplicar Máscaras em Inputs ──
  applyMask(input, maskType) {
    input.addEventListener('input', () => {
      let fnName = 'mask' + maskType.charAt(0).toUpperCase() + maskType.slice(1);
      if (maskType.toLowerCase() === 'cpfcnpj') fnName = 'maskCPFCNPJ';
      if (maskType.toLowerCase() === 'cep') fnName = 'maskCEP';
      
      const fn = Utils[fnName];
      if (fn) {
        const oldVal = input.value;
        const newVal = fn(oldVal);
        if (oldVal !== newVal) {
          input.value = newVal;
        }
      }
    });
  },

  // ── DOM Helpers ──
  $(sel, ctx = document) { return ctx.querySelector(sel); },
  $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; },
  
  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') el.className = v;
      else if (k === 'innerHTML') el.innerHTML = v;
      else if (k === 'textContent') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v);
    }
    children.forEach(c => {
      if (typeof c === 'string') el.appendChild(document.createTextNode(c));
      else if (c) el.appendChild(c);
    });
    return el;
  },

  // ── IDs ──
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  // ── Debounce ──
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
};
