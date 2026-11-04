// Check do Storage.carregarCompleto: contrato da lista (sem imagens) ganha as
// imagens do servidor sem perder o que o cache tem de mais novo.
// Rodar: node public/js/contrato-completo.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const load = (f, name) => new Function(`${fs.readFileSync(path.join(__dirname, f), 'utf8')}; return ${name};`)();
global.Utils = load('utils.js', 'Utils');
global.App = { user: null };

const ASSIN = 'data:image/png;base64,QQ==';
const NOVA = 'data:image/png;base64,Tk9WQQ==';
const SELFIE = 'data:image/jpeg;base64,Uw==';

let pedidos = 0;
global.Api = {
  usuario: null,
  // O servidor ainda tem a versão ANTERIOR à importação: é a corrida em que a
  // leitura do editor chega antes da gravação da importação.
  async get() {
    pedidos++;
    return { fields: {
      nome_locatario: 'Nome antigo', assinatura_locador: ASSIN,
      assinatura_locatario: ASSIN, selfie_locatario: SELFIE
    } };
  }
};

const Storage = load('storage.js', 'Storage');

(async () => {
  // Cache: veio da lista (marcado) e a importação acabou de mesclar o inquilino.
  Storage.contractsCache = [{ id: 'c1', fields: {
    _midia_omitida: true, nome_locatario: 'Nome novo', assinatura_locatario: NOVA
  } }];

  const c = await Storage.carregarCompleto('c1');
  assert.strictEqual(c.fields.nome_locatario, 'Nome novo', 'texto do cache vence o do servidor');
  assert.strictEqual(c.fields.assinatura_locatario, NOVA, 'imagem do cache vence a do servidor');
  assert.strictEqual(c.fields.assinatura_locador, ASSIN, 'imagem ausente vem do servidor');
  assert.strictEqual(c.fields.selfie_locatario, SELFIE);
  assert.ok(!('_midia_omitida' in c.fields), 'a marca sai: o contrato agora é inteiro');
  assert.strictEqual(Storage.getById('c1'), c, 'atualiza o próprio objeto do cache');

  // Já inteiro (ou criado nesta sessão): não pede nada ao servidor.
  await Storage.carregarCompleto('c1');
  assert.strictEqual(pedidos, 1);
  assert.strictEqual(await Storage.carregarCompleto('nao-existe'), null);

  console.log('ok — midia: contrato da lista completa as imagens sem perder o cache');
})().catch(e => { console.error(e); process.exit(1); });
