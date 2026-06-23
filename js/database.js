// ═══════════════════════════════════════════════════════
// Cloud Database & Encryption Module (AES-GCM client-side)
// ═══════════════════════════════════════════════════════

const CloudDB = {
  // Import raw 256-bit key (32 bytes) from key string
  async _importKey(keyString) {
    const enc = new TextEncoder();
    let rawKey = enc.encode(keyString);
    // Pad or truncate rawKey to 32 bytes
    if (rawKey.length < 32) {
      const padded = new Uint8Array(32);
      padded.set(rawKey);
      rawKey = padded;
    } else if (rawKey.length > 32) {
      rawKey = rawKey.slice(0, 32);
    }
    return window.crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  },

  // Encrypt JSON object to URL-safe base64 string
  async encrypt(data, keyString) {
    const text = JSON.stringify(data);
    const enc = new TextEncoder();
    const key = await this._importKey(keyString);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(text)
    );
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to URL-safe base64
    return btoa(String.fromCharCode(...combined))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  },

  // Decrypt URL-safe base64 string to JSON object
  async decrypt(cipherTextBase64, keyString) {
    let base64 = cipherTextBase64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const combined = new Uint8Array(atob(base64).split("").map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await this._importKey(keyString);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  },

  // Generate a random 16 character alphanumeric secret key
  generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 16; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  },

  // Save a new contract to the cloud server
  async saveContract(contractData, key) {
    const encryptedPayload = await this.encrypt(contractData, key);
    const payload = {
      name: "MeusImoveis_Contract",
      data: {
        encrypted: encryptedPayload
      }
    };
    const res = await fetch('https://api.restful-api.dev/objects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Falha ao salvar contrato no servidor");
    const result = await res.json();
    return result.id; // Returns the server object ID
  },

  // Update an existing contract on the cloud server
  async updateContract(serverId, contractData, key) {
    const encryptedPayload = await this.encrypt(contractData, key);
    const payload = {
      name: "MeusImoveis_Contract",
      data: {
        encrypted: encryptedPayload
      }
    };
    const res = await fetch(`https://api.restful-api.dev/objects/${serverId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Falha ao atualizar contrato no servidor");
    return true;
  },

  // Fetch and decrypt a contract from the cloud server
  async loadContract(serverId, key) {
    const res = await fetch(`https://api.restful-api.dev/objects/${serverId}`);
    if (!res.ok) throw new Error("Contrato expirou ou não existe no servidor");
    const result = await res.json();
    if (!result.data || !result.data.encrypted) throw new Error("Dados corrompidos ou formato inválido");
    return await this.decrypt(result.data.encrypted, key);
  }
};
