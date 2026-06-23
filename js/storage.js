// ═══════════════════════════════════════════════════════
// Storage — CRUD de contratos integrado com Firebase/localStorage
// ═══════════════════════════════════════════════════════

const Storage = {
  KEY: 'gerador_contratos_data',
  contractsCache: [],
  profileCache: {},

  // ── Métodos Auxiliares LocalStorage (Fallback Offline) ──
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

  // ── Sincronização e Carga com a Nuvem (Firebase) ──
  async loadCloudData() {
    if (!FirebaseActive || !FirebaseAuth.currentUser) return;
    const uid = FirebaseAuth.currentUser.uid;
    
    try {
      // 1. Carregar Contratos do Firestore
      const contractsSnapshot = await FirebaseDB.collection('users')
        .doc(uid)
        .collection('contracts')
        .get();
        
      this.contractsCache = [];
      contractsSnapshot.forEach(doc => {
        this.contractsCache.push(doc.data());
      });
      
      // Ordena por updatedAt decrescente
      this.contractsCache.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      // 2. Carregar Perfil do Firestore
      const userDoc = await FirebaseDB.collection('users').doc(uid).get();
      if (userDoc.exists && userDoc.data().profile) {
        this.profileCache = userDoc.data().profile;
      } else {
        this.profileCache = {};
      }
      
      console.log(`📦 Dados da nuvem carregados: ${this.contractsCache.length} contratos.`);
    } catch (e) {
      console.error("Erro ao carregar dados da nuvem:", e);
    }
  },

  async syncLocalDataToCloud() {
    if (!FirebaseActive || !FirebaseAuth.currentUser) return;
    const uid = FirebaseAuth.currentUser.uid;
    const migratedKey = `migrated_local_data_${uid}`;

    if (localStorage.getItem(migratedKey)) {
      // Já migrado no passado, apenas carrega a nuvem para o cache
      await this.loadCloudData();
      return;
    }

    try {
      // Importa dados do localStorage
      const localData = this._getData();
      if (localData.contracts && localData.contracts.length > 0) {
        console.log(`Migrando ${localData.contracts.length} contratos locais para a nuvem...`);
        const batch = FirebaseDB.batch();
        
        localData.contracts.forEach(contract => {
          const docRef = FirebaseDB.collection('users')
            .doc(uid)
            .collection('contracts')
            .doc(contract.id);
            
          batch.set(docRef, {
            ...contract,
            userId: uid,
            updatedAt: contract.updatedAt || new Date().toISOString()
          });
        });
        await batch.commit();
      }

      // Importa perfil do localStorage
      const localProfile = JSON.parse(localStorage.getItem('gerador_admin_profile')) || {};
      if (Object.keys(localProfile).length > 0) {
        await FirebaseDB.collection('users').doc(uid).set({
          profile: localProfile
        }, { merge: true });
      }

      // Marca como migrado
      localStorage.setItem(migratedKey, 'true');
      console.log("✅ Migração de dados locais concluída com sucesso.");
    } catch (e) {
      console.error("Erro ao migrar dados locais para a nuvem:", e);
    }

    // Carrega o cache atualizado
    await this.loadCloudData();
  },

  // ── Listar todos os contratos ──
  getAll() {
    if (FirebaseActive && FirebaseAuth.currentUser) {
      return this.contractsCache.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return this._getData().contracts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  // ── Buscar por ID ──
  getById(id) {
    if (FirebaseActive && FirebaseAuth.currentUser) {
      return this.contractsCache.find(c => c.id === id) || null;
    }
    return this._getData().contracts.find(c => c.id === id) || null;
  },

  // ── Criar novo contrato ──
  create(contract) {
    const now = new Date().toISOString();
    const newContract = {
      id: Utils.generateId(),
      ...contract,
      createdAt: now,
      updatedAt: now,
    };

    if (FirebaseActive && FirebaseAuth.currentUser) {
      const uid = FirebaseAuth.currentUser.uid;
      newContract.userId = uid;
      
      // Salva no Cache
      this.contractsCache.push(newContract);
      
      // Salva na Nuvem (Background async)
      FirebaseDB.collection('users')
        .doc(uid)
        .collection('contracts')
        .doc(newContract.id)
        .set(newContract)
        .catch(err => console.error("Erro ao salvar contrato na nuvem:", err));
        
      return newContract;
    }

    // Fallback Offline
    const data = this._getData();
    data.contracts.push(newContract);
    this._saveData(data);
    return newContract;
  },

  // ── Atualizar contrato ──
  update(id, updates) {
    const now = new Date().toISOString();
    
    if (FirebaseActive && FirebaseAuth.currentUser) {
      const uid = FirebaseAuth.currentUser.uid;
      const idx = this.contractsCache.findIndex(c => c.id === id);
      if (idx === -1) return null;
      
      this.contractsCache[idx] = {
        ...this.contractsCache[idx],
        ...updates,
        updatedAt: now
      };

      // Salva na Nuvem (Background async)
      FirebaseDB.collection('users')
        .doc(uid)
        .collection('contracts')
        .doc(id)
        .set(this.contractsCache[idx], { merge: true })
        .catch(err => console.error("Erro ao atualizar contrato na nuvem:", err));

      return this.contractsCache[idx];
    }

    // Fallback Offline
    const data = this._getData();
    const idx = data.contracts.findIndex(c => c.id === id);
    if (idx === -1) return null;
    data.contracts[idx] = {
      ...data.contracts[idx],
      ...updates,
      updatedAt: now,
    };
    this._saveData(data);
    return data.contracts[idx];
  },

  // ── Excluir contrato ──
  delete(id) {
    if (FirebaseActive && FirebaseAuth.currentUser) {
      const uid = FirebaseAuth.currentUser.uid;
      this.contractsCache = this.contractsCache.filter(c => c.id !== id);
      
      // Exclui na Nuvem (Background async)
      FirebaseDB.collection('users')
        .doc(uid)
        .collection('contracts')
        .doc(id)
        .delete()
        .catch(err => console.error("Erro ao excluir contrato na nuvem:", err));
        
      return;
    }

    // Fallback Offline
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
    if (FirebaseActive && FirebaseAuth.currentUser) {
      return this.profileCache;
    }
    try {
      return JSON.parse(localStorage.getItem('gerador_admin_profile')) || {};
    } catch {
      return {};
    }
  },

  saveAdminProfile(profile) {
    if (FirebaseActive && FirebaseAuth.currentUser) {
      const uid = FirebaseAuth.currentUser.uid;
      this.profileCache = profile;
      
      // Salva na Nuvem (Background async)
      FirebaseDB.collection('users')
        .doc(uid)
        .set({ profile }, { merge: true })
        .catch(err => console.error("Erro ao salvar perfil na nuvem:", err));
        
      return;
    }
    
    // Fallback Offline
    localStorage.setItem('gerador_admin_profile', JSON.stringify(profile));
  }
};
