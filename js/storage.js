// ═══════════════════════════════════════════════════════
// Storage — CRUD de contratos no localStorage
// ═══════════════════════════════════════════════════════

const Storage = {
  KEY: 'gerador_contratos_data',

  _getData() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || { contracts: [] };
    } catch {
      return { contracts: [] };
    }
  },

  _saveData(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  // ── Listar todos os contratos ──
  getAll() {
    return this._getData().contracts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  // ── Buscar por ID ──
  getById(id) {
    return this._getData().contracts.find(c => c.id === id) || null;
  },

  // ── Criar novo contrato ──
  create(contract) {
    const data = this._getData();
    const now = new Date().toISOString();
    const newContract = {
      id: Utils.generateId(),
      ...contract,
      createdAt: now,
      updatedAt: now,
    };
    data.contracts.push(newContract);
    this._saveData(data);
    return newContract;
  },

  // ── Atualizar contrato ──
  update(id, updates) {
    const data = this._getData();
    const idx = data.contracts.findIndex(c => c.id === id);
    if (idx === -1) return null;
    data.contracts[idx] = {
      ...data.contracts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this._saveData(data);
    return data.contracts[idx];
  },

  // ── Excluir contrato ──
  delete(id) {
    const data = this._getData();
    data.contracts = data.contracts.filter(c => c.id !== id);
    this._saveData(data);
  },

  // ── Estatísticas ──
  getStats() {
    const contracts = this.getAll();
    const now = new Date();
    const thisMonth = contracts.filter(c => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const types = {};
    contracts.forEach(c => { types[c.templateId] = (types[c.templateId] || 0) + 1; });
    const topType = Object.entries(types).sort((a,b) => b[1] - a[1])[0];
    return {
      total: contracts.length,
      thisMonth: thisMonth.length,
      topType: topType ? topType[0] : null,
      topTypeCount: topType ? topType[1] : 0,
      types,
    };
  },

  // ── Buscar contratos ──
  search(query) {
    if (!query) return this.getAll();
    const q = query.toLowerCase();
    return this.getAll().filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.templateId && c.templateId.toLowerCase().includes(q)) ||
      (c.fields && JSON.stringify(c.fields).toLowerCase().includes(q))
    );
  },

  // ── Perfil do Admin ──
  getAdminProfile() {
    try {
      return JSON.parse(localStorage.getItem('gerador_admin_profile')) || {};
    } catch {
      return {};
    }
  },

  saveAdminProfile(profile) {
    localStorage.setItem('gerador_admin_profile', JSON.stringify(profile));
  }
};
