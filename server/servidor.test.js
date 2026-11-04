// Testes do backend. Rodar: node --no-warnings=ExperimentalWarning server/servidor.test.js
//
// O teste que mais importa aqui é o de ESCOPO. Enquanto o backend era a
// Supabase, quem impedia a conta A de ler a conta B era a RLS do Postgres — uma
// garantia do banco, que valia mesmo se o código do servidor errasse. Agora
// quem garante é código nosso. Uma garantia que virou código precisa virar
// teste junto, senão o que se fez foi trocar uma parede por uma intenção.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Banco descartável, antes de carregar o app (db.js lê isto na carga).
const DB = path.join(os.tmpdir(), `mi-test-${process.pid}.db`);
process.env.DB_FILE = DB;
// A pasta de midia tambem precisa ser descartavel: sem isto o teste cria
// `uploads/` na raiz do repositorio e deixa arquivo la depois de rodar.
const UPLOADS = path.join(os.tmpdir(), `mi-test-uploads-${process.pid}`);
process.env.UPLOADS_DIR = UPLOADS;
for (const s of ['', '-wal', '-shm']) { try { fs.unlinkSync(DB + s); } catch {} }

const app = require('./index');

let base;
const servidor = app.listen(0);
test.before(() => { base = `http://127.0.0.1:${servidor.address().port}`; });

// A suite faz uma duzia de logins do mesmo IP; sem zerar a janela entre casos,
// o limite de 5/min derrubaria os testes que nada tem a ver com ele. O reset
// vive so aqui — rota que zera limite seria a porta que o limite fecha.
const limite = require('./limite');
test.beforeEach(() => limite.limpar());
test.after(() => {
  servidor.close();
  try { fs.rmSync(UPLOADS, { recursive: true, force: true }); } catch {}
  for (const s of ['', '-wal', '-shm']) { try { fs.unlinkSync(DB + s); } catch {} }
});

// Cada "cliente" tem seu pote de cookies: é o que permite ter duas contas vivas
// ao mesmo tempo no teste, que é o cenário do teste de escopo.
function cliente() {
  let cookie = '';
  async function req(metodo, caminho, corpo) {
    const r = await fetch(base + caminho, {
      method: metodo,
      headers: {
        ...(corpo === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(cookie ? { Cookie: cookie } : {})
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo)
    });
    const set = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    if (set.length) cookie = set.map(c => c.split(';')[0]).join('; ');
    const texto = await r.text();
    let dados = null;
    try { dados = texto ? JSON.parse(texto) : null; } catch {}
    return { status: r.status, dados, setCookie: set };
  };
  // O upload de midia manda bytes crus, entao nao passa por `req` — mas precisa
  // da MESMA sessao. Expor o cookie evita refazer login no meio da suite (a
  // senha de B e outra, e um teste adiante troca a de quem loga de novo).
  req.cookie = () => cookie;
  return req;
}

const A = cliente();
const B = cliente();
const anon = cliente();

// ── Contas e senha ──────────────────────────────────────────────────────

test('registra a primeira conta e ela nasce admin', async () => {
  const r = await A('POST', '/api/auth/registrar', { email: 'a@teste.com', senha: 'segredo123' });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.dados.user.email, 'a@teste.com');
  assert.strictEqual(r.dados.user.is_admin, true, 'a primeira conta do banco vira admin');
});

test('a segunda conta NAO nasce admin', async () => {
  const r = await B('POST', '/api/auth/registrar', { email: 'b@teste.com', senha: 'segredo456' });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.dados.user.is_admin, false);
});

test('o cookie de sessao e httpOnly e SameSite=Strict', async () => {
  const c = cliente();
  const r = await c('POST', '/api/auth/registrar', { email: 'cookie@teste.com', senha: 'segredo123' });
  const bruto = r.setCookie.join(';');
  // httpOnly e o que impede um XSS de ler a sessao. O app tem `unsafe-inline`
  // na CSP, entao essa flag nao e detalhe: e a unica coisa entre um XSS e a
  // conta do usuario.
  assert.match(bruto, /HttpOnly/i);
  assert.match(bruto, /SameSite=Strict/i);
});

test('e-mail duplicado e recusado', async () => {
  const r = await cliente()('POST', '/api/auth/registrar', { email: 'a@teste.com', senha: 'outrasenha' });
  assert.strictEqual(r.status, 409);
});

test('senha curta e e-mail invalido sao recusados no SERVIDOR', async () => {
  const c = cliente();
  assert.strictEqual((await c('POST', '/api/auth/registrar', { email: 'x@y.com', senha: '123' })).status, 400);
  // 7 caracteres: a tela pede 8, e o servidor tem de cobrar o mesmo.
  assert.strictEqual((await c('POST', '/api/auth/registrar', { email: 'x@y.com', senha: '1234567' })).status, 400);
  assert.strictEqual((await c('POST', '/api/auth/registrar', { email: 'semarroba', senha: 'segredo123' })).status, 400);
});

test('senha errada e e-mail inexistente dao a MESMA resposta', async () => {
  const c = cliente();
  const errada = await c('POST', '/api/auth/entrar', { email: 'a@teste.com', senha: 'nao-e-essa' });
  const inexistente = await c('POST', '/api/auth/entrar', { email: 'ninguem@teste.com', senha: 'nao-e-essa' });
  // Distinguir os dois transformaria o login num verificador de quem tem conta.
  assert.strictEqual(errada.status, 401);
  assert.strictEqual(inexistente.status, 401);
  assert.strictEqual(errada.dados.erro, inexistente.dados.erro);
});

test('a senha nao e guardada em claro, e o salt difere entre contas', () => {
  const { db } = require('./db');
  const a = db.prepare('select senha_hash, salt from users where email = ?').get('a@teste.com');
  const b = db.prepare('select senha_hash, salt from users where email = ?').get('b@teste.com');
  assert.ok(!a.senha_hash.includes('segredo123'));
  assert.notStrictEqual(a.salt, b.salt, 'salt igual entre contas anularia o proposito dele');

  // Mesma senha em contas diferentes tem de produzir hash diferente — e o que
  // impede descobrir, olhando a tabela, que duas pessoas usam a mesma senha.
  const { criarSenha } = require('./sessao');
  return Promise.all([criarSenha('igual'), criarSenha('igual')]).then(([x, y]) =>
    assert.notStrictEqual(x.senha_hash, y.senha_hash));
});

test('o hash de senha NAO congela o servidor', async () => {
  // Com `scryptSync`, cada login segurava o event loop ~100ms: quatro tentativas
  // simultaneas faziam QUALQUER outra requisicao esperar todas elas. Com o hash
  // no threadpool, uma rota leve responde antes de qualquer login terminar.
  const ordem = [];
  const logins = [1, 2, 3, 4].map(i =>
    cliente()('POST', '/api/auth/entrar', { email: `lento${i}@teste.com`, senha: 'qualquer1' })
      .then(() => ordem.push('login')));
  await anon('GET', '/api/auth/sessao').then(() => ordem.push('sessao'));
  await Promise.all(logins);
  assert.strictEqual(ordem[0], 'sessao', 'a rota leve nao esperou o hash dos logins');
});

// ── Sessao ──────────────────────────────────────────────────────────────

test('sem cookie, /sessao responde 200 com user null', async () => {
  const r = await anon('GET', '/api/auth/sessao');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.dados.user, null);
});

test('cookie inventado nao autentica', async () => {
  const r = await fetch(base + '/api/contracts', { headers: { Cookie: 'sessao=' + 'f'.repeat(64) } });
  assert.strictEqual(r.status, 401);
});

test('cookie com % malformado e "sem sessao", nao erro 500', async () => {
  // O parse feito a mao passava isto direto ao decodeURIComponent, que lanca.
  const r = await fetch(base + '/api/auth/sessao', { headers: { Cookie: 'outro=%E0%A4%A; sessao=%ZZ' } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual((await r.json()).user, null);
  const rota = await fetch(base + '/api/contracts', { headers: { Cookie: 'sessao=%E0%A4%A' } });
  assert.strictEqual(rota.status, 401);
});

test('sessao expirada e recusada E apagada na leitura', async () => {
  const { db } = require('./db');
  const c = cliente();
  await c('POST', '/api/auth/registrar', { email: 'expira@teste.com', senha: 'segredo123' });
  const u = db.prepare('select id from users where email = ?').get('expira@teste.com');
  db.prepare('update sessions set expira_em = ? where user_id = ?')
    .run(new Date(Date.now() - 1000).toISOString(), u.id);

  assert.strictEqual((await c('GET', '/api/contracts')).status, 401);
  const { n } = db.prepare('select count(*) n from sessions where user_id = ?').get(u.id);
  assert.strictEqual(n, 0, 'sessao vencida some na leitura, sem agendador');
});

// ── ESCOPO: o teste que substitui a RLS ─────────────────────────────────

const RECURSOS = ['contracts', 'properties', 'clients', 'financial_records', 'inspections'];

const corpoDe = (recurso, id) => ({
  contracts: { id, name: 'Contrato de A', template_id: 'residencial', fields: { valor_aluguel: '2.450,00' } },
  properties: { id, name: 'Imovel de A', address: 'Rua A, 1' },
  clients: { id, name: 'Cliente de A', document: '111' },
  financial_records: { id, description: 'Aluguel', due_date: '2026-08-10', rent_value: 2450 },
  inspections: { id, tipo: 'Entrada', rooms: [{ nome: 'Sala', estado: 'Bom' }] }
}[recurso]);

test('toda rota de recurso exige sessao', async () => {
  for (const r of RECURSOS) {
    assert.strictEqual((await anon('GET', `/api/${r}`)).status, 401, `GET ${r} sem sessao`);
    assert.strictEqual((await anon('PUT', `/api/${r}/x`, { id: 'x' })).status, 401, `PUT ${r} sem sessao`);
    assert.strictEqual((await anon('DELETE', `/api/${r}/x`)).status, 401, `DELETE ${r} sem sessao`);
  }
  assert.strictEqual((await anon('GET', '/api/perfil')).status, 401);
  assert.strictEqual((await anon('PUT', '/api/perfil', {})).status, 401);
});

test('A grava em todos os recursos e B nao enxerga nada disso', async () => {
  for (const r of RECURSOS) {
    const put = await A('PUT', `/api/${r}/id-de-a`, corpoDe(r, 'id-de-a'));
    assert.strictEqual(put.status, 200, `A deveria gravar em ${r}`);

    const deA = await A('GET', `/api/${r}`);
    assert.strictEqual(deA.dados.length, 1, `A deveria ver o proprio registro em ${r}`);

    const deB = await B('GET', `/api/${r}`);
    assert.deepStrictEqual(deB.dados, [], `B NAO pode ver o registro de A em ${r}`);
  }
});

test('B nao sobrescreve registro de A mesmo sabendo o id', async () => {
  for (const r of RECURSOS) {
    const invasao = await B('PUT', `/api/${r}/id-de-a`, { ...corpoDe(r, 'id-de-a'), name: 'INVADIDO' });
    assert.strictEqual(invasao.status, 403, `B nao pode sobrescrever ${r} de A`);
  }
  // E o dado de A continua intacto.
  const props = await A('GET', '/api/properties');
  assert.strictEqual(props.dados[0].name, 'Imovel de A');
});

test('B nao apaga registro de A mesmo sabendo o id', async () => {
  for (const r of RECURSOS) {
    const tentativa = await B('DELETE', `/api/${r}/id-de-a`);
    // 404, nao 403: dizer "existe, mas nao e seu" ja conta que aquele id existe
    // em alguma conta.
    assert.strictEqual(tentativa.status, 404, `B nao pode apagar ${r} de A`);
    assert.strictEqual((await A('GET', `/api/${r}`)).dados.length, 1, `${r} de A sobreviveu`);
  }
});

test('gravacao parcial de registro existente persiste (bug do created_at)', async () => {
  // O front manda so os campos alterados. O upsert avalia o INSERT antes do
  // `on conflict`, entao sem created_at no corpo a coluna NOT NULL estourava e
  // a rota devolvia 500: nenhuma edicao de contrato chegava ao banco. Era isso
  // que fazia o cloud_id do link do inquilino nunca gravar — e a importacao,
  // sem achar o contrato pelo cloud_id, criava uma COPIA so com os dados dele.
  const criacao = await A('PUT', '/api/contracts/parcial-1', {
    id: 'parcial-1', name: 'Contrato', template_id: 'residencial',
    fields: { valor_aluguel: '1.500,00' },
    created_at: '2020-01-01T00:00:00.000Z', updated_at: '2020-01-01T00:00:00.000Z'
  });
  assert.strictEqual(criacao.status, 200);

  const parcial = await A('PUT', '/api/contracts/parcial-1', {
    id: 'parcial-1', name: 'Contrato', template_id: 'residencial',
    fields: { valor_aluguel: '1.500,00' },
    cloud_id: '40733ad4-1b43-4151-b55e-722879043795', cloud_key: 'chave-do-link'
  });
  assert.strictEqual(parcial.status, 200, 'gravacao sem created_at nao pode dar 500');
  assert.strictEqual(parcial.dados.cloud_id, '40733ad4-1b43-4151-b55e-722879043795');
  assert.strictEqual(parcial.dados.created_at, '2020-01-01T00:00:00.000Z',
    'a data de criacao e imutavel — o update nao pode reescreve-la');

  const lido = (await A('GET', '/api/contracts')).dados.find(c => c.id === 'parcial-1');
  assert.strictEqual(lido.cloud_id, '40733ad4-1b43-4151-b55e-722879043795',
    'o cloud_id tem que sobreviver ao recarregamento');
  await A('DELETE', '/api/contracts/parcial-1');
});

test('o perfil de A nao vaza para B', async () => {
  await A('PUT', '/api/perfil', { nome_locador: 'Locador A', doc_locador: '123' });
  assert.strictEqual((await A('GET', '/api/perfil')).dados.nome_locador, 'Locador A');
  assert.deepStrictEqual((await B('GET', '/api/perfil')).dados, {},
    'B tem o proprio perfil, vazio — as rotas de perfil nao tem :id por isso');
});

test('recurso fora da lista branca nao vira SQL', async () => {
  assert.strictEqual((await A('GET', '/api/users')).status, 404);
  assert.strictEqual((await A('GET', '/api/sessions')).status, 404);
  assert.strictEqual((await A('GET', '/api/sqlite_master')).status, 404);
});

// ── Forma da resposta: a armadilha do jsonb ─────────────────────────────

test('fields volta como OBJETO, nao string', async () => {
  const r = await A('GET', '/api/contracts');
  const c = r.dados[0];
  // O PostgREST devolvia jsonb ja parseado; o SQLite guarda texto. Se a
  // conversao na borda sumir, `fields.valor_aluguel` vira undefined em todas as
  // telas e nada acusa — a tela so mostra vazio.
  assert.strictEqual(typeof c.fields, 'object');
  assert.strictEqual(c.fields.valor_aluguel, '2.450,00');
  assert.strictEqual(typeof c.is_finalized, 'boolean', 'SQLite guarda 0/1; o front espera boolean');
});

test('rooms da vistoria volta como ARRAY', async () => {
  const r = await A('GET', '/api/inspections');
  assert.ok(Array.isArray(r.dados[0].rooms));
  assert.strictEqual(r.dados[0].rooms[0].nome, 'Sala');
});

// ── Link do inquilino ───────────────────────────────────────────────────

const sha256 = (t) => require('node:crypto').createHash('sha256').update(String(t), 'utf8').digest('hex');
const CHAVE = 'chave-de-16-cars';
const PROVA = sha256(CHAVE);

test('criar link exige sessao', async () => {
  const r = await anon('POST', '/api/links', { id: 'l1', payload: 'xxx', key_proof: PROVA });
  assert.strictEqual(r.status, 401);
});

test('ciclo do link: criar, ler sem sessao, gravar com a prova certa', async () => {
  assert.strictEqual((await A('POST', '/api/links', { id: 'l1', payload: 'cifrado-v1', key_proof: PROVA })).status, 201);

  // O inquilino nao tem conta: a leitura e publica de proposito.
  const leitura = await anon('GET', '/api/links/l1');
  assert.strictEqual(leitura.status, 200);
  assert.strictEqual(leitura.dados.payload, 'cifrado-v1');

  const escrita = await anon('PUT', '/api/links/l1', { payload: 'cifrado-v2', key_proof: PROVA });
  assert.strictEqual(escrita.dados.gravou, true);
  assert.strictEqual((await anon('GET', '/api/links/l1')).dados.payload, 'cifrado-v2');
});

test('criar link com id repetido responde 409, nao 500', async () => {
  // Retentativa depois de uma conexao instavel manda o MESMO id de novo. Um 500
  // ali nao diz nada a quem chama; 409 diz "esse id ja existe, gere outro".
  // O id nao vaza nada sozinho: sem a chave (que so vive no fragmento da URL) o
  // payload continua opaco, e a leitura ja tem teto por IP.
  await A('POST', '/api/links', { id: 'l-repetido', payload: 'v1', key_proof: PROVA });
  const segunda = await A('POST', '/api/links', { id: 'l-repetido', payload: 'v2', key_proof: PROVA });
  assert.strictEqual(segunda.status, 409);

  // E o payload original continua de pe: repetir id nao sobrescreve.
  assert.strictEqual((await anon('GET', '/api/links/l-repetido')).dados.payload, 'v1');
});

test('B nao sobrescreve link de A mandando o id dele', async () => {
  const r = await B('POST', '/api/links', { id: 'l-repetido', payload: 'invasao', key_proof: PROVA });
  assert.strictEqual(r.status, 409, 'recusa sem dizer de quem e');
  assert.strictEqual((await anon('GET', '/api/links/l-repetido')).dados.payload, 'v1', 'intacto');
});

test('prova de chave errada NAO grava', async () => {
  const r = await anon('PUT', '/api/links/l1', { payload: 'invasao', key_proof: sha256('chave-errada') });
  // `gravou: false`, nao erro HTTP: quem chama precisa separar recusa de falha
  // de rede, porque so numa delas o link deve ser descartado.
  assert.strictEqual(r.dados.gravou, false);
  assert.strictEqual((await anon('GET', '/api/links/l1')).dados.payload, 'cifrado-v2', 'payload intacto');
});

test('sem prova nenhuma NAO grava', async () => {
  const r = await anon('PUT', '/api/links/l1', { payload: 'invasao' });
  assert.strictEqual(r.dados.gravou, false);
});

test('a prova guardada no banco NAO e a prova que o servidor cobra', () => {
  const { db } = require('./db');
  const linha = db.prepare('select key_proof from tenant_links where id = ?').get('l1');
  // O cliente manda SHA-256(chave); o servidor guarda SHA-256 disso. Quem le o
  // banco tem a prova guardada, mas nao a que abre a porta.
  assert.notStrictEqual(linha.key_proof, PROVA);
  assert.strictEqual(linha.key_proof, sha256(PROVA));
});

test('finalizar e caminho so de ida', async () => {
  const fim = await anon('PUT', '/api/links/l1', { payload: 'assinado', key_proof: PROVA, finalize: true });
  assert.strictEqual(fim.dados.gravou, true);

  const depois = await anon('PUT', '/api/links/l1', { payload: 'depois-de-assinar', key_proof: PROVA });
  assert.strictEqual(depois.dados.gravou, false, 'link finalizado nao aceita mais escrita');

  // Ler continua funcionando: e o que permite ao locador importar o que foi enviado.
  assert.strictEqual((await anon('GET', '/api/links/l1')).dados.payload, 'assinado');
});

test('a evidencia do aceite e carimbada pelo SERVIDOR', async () => {
  const r = await anon('GET', '/api/links/l1/evidencia');
  assert.ok(r.dados.evidencia, 'link finalizado tem evidencia');
  assert.ok(r.dados.evidencia.finalizado_em, 'com data do servidor');
  // Fica fora do payload cifrado de proposito: e a unica parte da trilha que
  // quem assina nao redige.
});

test('o IP da evidencia NAO pode ser forjado pelo inquilino', async () => {
  // O inquilino controla os cabecalhos da propria requisicao. Se o servidor
  // lesse o primeiro item do X-Forwarded-For, ele escreveria o IP que quisesse
  // na unica parte da trilha que deveria ser do servidor.
  const { db } = require('./db');
  const finalizar = async (id, xff) => {
    await A('POST', '/api/links', { id, payload: 'x', key_proof: PROVA });
    await fetch(`${base}/api/links/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': xff },
      body: JSON.stringify({ payload: 'assinado', key_proof: PROVA, finalize: true })
    });
    return db.prepare('select finalized_ip from tenant_links where id = ?').get(id).finalized_ip;
  };

  // Sem proxy declarado (rodando local): o cabecalho e ignorado por inteiro.
  const local = await finalizar('ip-local', '6.6.6.6');
  assert.notStrictEqual(local, '6.6.6.6');
  assert.match(local, /127\.0\.0\.1|::1/);

  // Atras de UM proxy reverso (TRUST_PROXY=1): vale o item que o proxy
  // acrescentou na ponta direita, nunca o que o cliente mandou na esquerda.
  app.set('trust proxy', 1);
  try {
    assert.strictEqual(await finalizar('ip-proxy', '6.6.6.6, 1.2.3.4'), '1.2.3.4');
  } finally {
    app.set('trust proxy', false);
  }
});

test('link inexistente e link expirado dao 404', async () => {
  assert.strictEqual((await anon('GET', '/api/links/nao-existe')).status, 404);

  const { db } = require('./db');
  await A('POST', '/api/links', { id: 'velho', payload: 'x', key_proof: PROVA });
  db.prepare('update tenant_links set expires_at = ? where id = ?')
    .run(new Date(Date.now() - 1000).toISOString(), 'velho');

  assert.strictEqual((await anon('GET', '/api/links/velho')).status, 404);
  const { n } = db.prepare('select count(*) n from tenant_links where id = ?').get('velho');
  assert.strictEqual(n, 0, 'expirado some na leitura — e o que substitui o pg_cron');
});

test('payload acima de 512 KB e recusado', async () => {
  const gigante = 'x'.repeat(524289);
  assert.strictEqual((await A('POST', '/api/links', { id: 'grande', payload: gigante, key_proof: PROVA })).status, 413);
});

// ── Admin ───────────────────────────────────────────────────────────────

// ── Midia da vistoria ───────────────────────────────────────────────────

test('apagar a vistoria leva as midias junto (cascata)', async () => {
  const { db, PASTA_UPLOADS } = require('./db');
  assert.ok(fs.existsSync(PASTA_UPLOADS), 'a pasta de uploads nasce com o servidor');

  await A('PUT', '/api/inspections/v-cascata', { id: 'v-cascata', tipo: 'Entrada', rooms: [] });
  const dono = (await A('GET', '/api/auth/sessao')).dados.user.id;
  db.prepare(`insert into midias (id, user_id, inspection_id, ambiente, tipo, mime, bytes, arquivo, created_at)
              values (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('m-cascata', dono, 'v-cascata', 0, 'foto', 'image/jpeg', 10, 'm-cascata.jpg', new Date().toISOString());

  assert.strictEqual(db.prepare('select count(*) n from midias').get().n, 1);
  assert.strictEqual((await A('DELETE', '/api/inspections/v-cascata')).status, 200);
  assert.strictEqual(db.prepare('select count(*) n from midias').get().n, 0,
    'a linha de midia nao pode sobreviver a vistoria que ela documenta');
});

// Bytes com a assinatura real de cada formato: o servidor confere o CONTEUDO
// (file-type), nao so o Content-Type. O texto do fim deixa cada arquivo unico.
const JPEG = (t = '') => Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]), Buffer.from(t)]);
const PNG = (t = '') => Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, 0x49, 0x48, 0x44, 0x52]), Buffer.from(t)]);
const WEBM = (t = '') => Buffer.concat([   // cabecalho EBML com DocType "webm"
  Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0x9F, 0x42, 0x86, 0x81, 0x01, 0x42, 0xF7, 0x81, 0x01, 0x42, 0xF2, 0x81,
    0x04, 0x42, 0xF3, 0x81, 0x08, 0x42, 0x82, 0x84]), Buffer.from('webm'),
  Buffer.from([0x42, 0x87, 0x81, 0x02, 0x42, 0x85, 0x81, 0x02]), Buffer.from(t)]);

// Corpo cru, nao multipart: o teste fala com a rota do mesmo jeito que o
// navegador (fetch com o Blob no body).
async function enviar(cookie, qs, mime, bytes) {
  const r = await fetch(base + '/api/midias?' + qs, {
    method: 'POST',
    headers: { 'Content-Type': mime, ...(cookie ? { Cookie: cookie } : {}) },
    body: bytes
  });
  let dados = null;
  try { dados = JSON.parse(await r.text()); } catch {}
  return { status: r.status, dados };
}

test('sobe uma foto para o ambiente da vistoria', async () => {
  await A('PUT', '/api/inspections/v1', { id: 'v1', tipo: 'Entrada', rooms: [{ nome: 'Sala', estado: 'Bom' }] });
  const r = await enviar(A.cookie(), 'vistoria=v1&ambiente=0&tipo=foto', 'image/jpeg', JPEG('fingindo-ser-jpeg'));
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.dados.tipo, 'foto');
  assert.strictEqual(r.dados.ambiente, 0);
  assert.strictEqual(r.dados.bytes, JPEG('fingindo-ser-jpeg').length);
});

test('midia exige sessao', async () => {
  const r = await enviar('', 'vistoria=v1&ambiente=0&tipo=foto', 'image/jpeg', JPEG('x'));
  assert.strictEqual(r.status, 401);
});

test('B nao sobe midia para vistoria de A, mesmo sabendo o id', async () => {
  const r = await enviar(B.cookie(), 'vistoria=v1&ambiente=0&tipo=foto', 'image/jpeg', JPEG('x'));
  // 404, nao 403: dizer "existe, mas nao e sua" ja conta que aquele id existe.
  assert.strictEqual(r.status, 404);
});

test('formato fora da lista branca e recusado', async () => {
  const r = await enviar(A.cookie(), 'vistoria=v1&ambiente=0&tipo=foto', 'application/pdf', Buffer.from('%PDF-'));
  assert.ok(r.status === 415 || r.status === 400, 'PDF nao e foto: ' + r.status);
});

test('Content-Type de imagem com conteudo que nao e imagem e recusado', async () => {
  const falso = await enviar(A.cookie(), 'vistoria=v1&ambiente=0&tipo=foto', 'image/jpeg',
    Buffer.from('<script>alert(1)</script>'));
  assert.strictEqual(falso.status, 415, 'o cabecalho e o que o cliente diz; quem decide sao os bytes');

  // Declarou JPEG, mandou PNG: entra, mas gravado como o que E.
  const trocado = await enviar(A.cookie(), 'vistoria=v1&ambiente=0&tipo=foto', 'image/jpeg', PNG('na-verdade-png'));
  assert.strictEqual(trocado.status, 201);
  assert.strictEqual(trocado.dados.mime, 'image/png');
  await A('DELETE', '/api/midias/' + trocado.dados.id);
});

test('video mandado como foto e recusado', async () => {
  const r = await enviar(A.cookie(), 'vistoria=v1&ambiente=0&tipo=foto', 'video/webm', Buffer.from('x'));
  assert.strictEqual(r.status, 415, 'o tipo declarado e o mime tem que combinar');
});

test('acima do teto da foto e recusado', async () => {
  const grande = Buffer.alloc(8 * 1024 * 1024 + 1, 1);
  const r = await enviar(A.cookie(), 'vistoria=v1&ambiente=0&tipo=foto', 'image/jpeg', grande);
  assert.strictEqual(r.status, 413);
});

test('estourar a quantidade por ambiente e recusado', async () => {
  await A('PUT', '/api/inspections/v-cheio', { id: 'v-cheio', tipo: 'Entrada', rooms: [{ nome: 'Sala' }] });
  for (let i = 0; i < 2; i++) {
    const ok = await enviar(A.cookie(), 'vistoria=v-cheio&ambiente=0&tipo=video', 'video/webm', WEBM('v' + i));
    assert.strictEqual(ok.status, 201, 'os dois primeiros videos entram');
  }
  const terceiro = await enviar(A.cookie(), 'vistoria=v-cheio&ambiente=0&tipo=video', 'video/webm', WEBM('v3'));
  assert.strictEqual(terceiro.status, 409, 'o terceiro video no mesmo ambiente nao entra');
});

test('lista as midias da vistoria, e so as da conta', async () => {
  const r = await A('GET', '/api/midias?vistoria=v1');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.dados.length, 1, 'a foto que subiu esta la');
  assert.strictEqual(r.dados[0].tipo, 'foto');
  assert.strictEqual(r.dados[0].bytes, JPEG('fingindo-ser-jpeg').length);

  const deB = await B('GET', '/api/midias?vistoria=v1');
  assert.deepStrictEqual(deB.dados, [], 'B nao enxerga a midia da vistoria de A');
});

test('o arquivo volta com os bytes e o mime que subiram', async () => {
  const id = (await A('GET', '/api/midias?vistoria=v1')).dados[0].id;
  const r = await fetch(base + '/api/midias/' + id + '/arquivo', { headers: { Cookie: A.cookie() } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.headers.get('content-type').split(';')[0], 'image/jpeg');
  assert.ok(Buffer.from(await r.arrayBuffer()).equals(JPEG('fingindo-ser-jpeg')));

  const semSessao = await fetch(base + '/api/midias/' + id + '/arquivo');
  assert.strictEqual(semSessao.status, 401, 'arquivo de midia nao e publico');

  const deB = await fetch(base + '/api/midias/' + id + '/arquivo', { headers: { Cookie: B.cookie() } });
  assert.strictEqual(deB.status, 404, 'nem para outra conta que saiba o id');
});

test('apagar a midia leva o arquivo do disco junto', async () => {
  const { db, PASTA_UPLOADS } = require('./db');
  const id = (await A('GET', '/api/midias?vistoria=v1')).dados[0].id;
  const arquivo = db.prepare('select arquivo from midias where id = ?').get(id).arquivo;
  assert.ok(fs.existsSync(path.join(PASTA_UPLOADS, arquivo)));

  assert.strictEqual((await B('DELETE', '/api/midias/' + id)).status, 404, 'B nao apaga midia de A');
  assert.strictEqual((await A('DELETE', '/api/midias/' + id)).status, 200);

  assert.strictEqual(fs.existsSync(path.join(PASTA_UPLOADS, arquivo)), false,
    'linha apagada sem arquivo apagado e lixo que ninguem mais alcanca');
});

test('a varredura recolhe arquivo orfao', async () => {
  const { PASTA_UPLOADS } = require('./db');
  const orfao = path.join(PASTA_UPLOADS, 'orfao-de-teste.jpg');
  fs.writeFileSync(orfao, 'sem linha no banco');
  assert.ok(fs.existsSync(orfao));

  await A('GET', '/api/midias?vistoria=v1');   // a leitura varre

  assert.strictEqual(fs.existsSync(orfao), false,
    'e assim que o arquivo da vistoria apagada some — a cascata do SQLite nao alcanca o disco');
});

test('remover um ambiente do meio reindexa as midias dos seguintes', async () => {
  await A('PUT', '/api/inspections/v-reidx', {
    id: 'v-reidx', tipo: 'Entrada',
    rooms: [{ nome: 'Sala' }, { nome: 'Cozinha' }, { nome: 'Quarto' }]
  });
  await enviar(A.cookie(), 'vistoria=v-reidx&ambiente=0&tipo=foto', 'image/jpeg', JPEG('da-sala'));
  await enviar(A.cookie(), 'vistoria=v-reidx&ambiente=1&tipo=foto', 'image/jpeg', JPEG('da-cozinha'));
  await enviar(A.cookie(), 'vistoria=v-reidx&ambiente=2&tipo=foto', 'image/jpeg', JPEG('do-quarto'));

  const r = await A('POST', '/api/midias/reindexar', { vistoria: 'v-reidx', removido: 0 });
  assert.strictEqual(r.status, 200);

  const lista = (await A('GET', '/api/midias?vistoria=v-reidx')).dados;
  assert.strictEqual(lista.length, 2, 'a foto do ambiente removido foi junto');
  assert.deepStrictEqual(lista.map(m => m.ambiente), [0, 1],
    'cozinha e quarto andaram uma casa para tras — senao a foto da cozinha aparece na sala');

  const deB = await B('POST', '/api/midias/reindexar', { vistoria: 'v-reidx', removido: 0 });
  assert.strictEqual(deB.status, 404, 'B nao reindexa vistoria de A');
});

// ── Midia do imovel ─────────────────────────────────────────────────────
//
// Mesmo desenho da vistoria (corpo cru, teto, lista branca), outro dono: o
// imovel. Vive na MESMA rota de proposito — `varrer()` e `/:id/arquivo` sao
// unicas, e uma varredura que nao conhecesse as duas tabelas apagaria do disco
// as fotos da tabela que ela ignora.
async function enviarImovel(cookie, qs, mime, bytes) {
  const r = await fetch(base + '/api/midias/imovel?' + qs, {
    method: 'POST',
    headers: { 'Content-Type': mime, ...(cookie ? { Cookie: cookie } : {}) },
    body: bytes
  });
  let dados = null;
  try { dados = JSON.parse(await r.text()); } catch {}
  return { status: r.status, dados };
}

test('sobe uma foto para o imovel, e a primeira vira capa sozinha', async () => {
  await A('PUT', '/api/properties/p-foto', { id: 'p-foto', name: 'Casa 4', address: 'Rua dos Garis' });
  const r = await enviarImovel(A.cookie(), 'imovel=p-foto', 'image/jpeg', JPEG('foto-da-casa'));
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.dados.bytes, JPEG('foto-da-casa').length);
  // Sem isto o cartao fica com fotos e sem capa — o estado vazio continuaria na
  // tela mesmo havendo foto, e ninguem entenderia por que.
  assert.strictEqual(r.dados.capa, true, 'a primeira foto do imovel vira a capa sozinha');
});

test('a varredura de orfao NAO apaga a foto do imovel', async () => {
  const { db, PASTA_UPLOADS } = require('./db');
  const arquivo = db.prepare('select arquivo from midias_imovel').get().arquivo;
  const caminho = path.join(PASTA_UPLOADS, arquivo);
  assert.ok(fs.existsSync(caminho), 'a foto subiu de verdade');

  await A('GET', '/api/midias?vistoria=v1');   // qualquer leitura de vistoria varre

  // As duas tabelas dividem a pasta. Uma varredura que so olhe `midias` ve o
  // arquivo do imovel como orfao e o apaga — sem erro, sem log, e o cartao
  // aparece quebrado depois. E o unico jeito de perder foto neste desenho.
  assert.strictEqual(fs.existsSync(caminho), true,
    'a varredura precisa conhecer as DUAS tabelas, senao apaga a foto do imovel');
});

test('B nao sobe foto para imovel de A, mesmo sabendo o id', async () => {
  const r = await enviarImovel(B.cookie(), 'imovel=p-foto', 'image/jpeg', JPEG('x'));
  // 404, nao 403: mesmo motivo da vistoria — 403 confirmaria que o id existe.
  assert.strictEqual(r.status, 404);
});

test('foto de imovel exige sessao', async () => {
  const r = await enviarImovel('', 'imovel=p-foto', 'image/jpeg', JPEG('x'));
  assert.strictEqual(r.status, 401);
});

test('lista as fotos de imovel da conta inteira numa requisicao so', async () => {
  // Sem filtro de propósito: a tela de imoveis desenha N cartoes e precisa das
  // fotos de todos. Um fetch por cartao seria N requisicoes para montar a lista.
  const r = await A('GET', '/api/midias/imovel');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.dados.length, 1);
  assert.strictEqual(r.dados[0].property_id, 'p-foto');
  assert.strictEqual(r.dados[0].capa, true);
  assert.strictEqual(r.dados[0].arquivo, undefined, 'nome de arquivo no disco nao sai para o cliente');

  const deB = await B('GET', '/api/midias/imovel');
  assert.deepStrictEqual(deB.dados, [], 'B nao enxerga foto de imovel de A');
});

test('o arquivo da foto do imovel volta pela MESMA rota da vistoria', async () => {
  const id = (await A('GET', '/api/midias/imovel')).dados[0].id;
  const r = await fetch(base + '/api/midias/' + id + '/arquivo', { headers: { Cookie: A.cookie() } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.headers.get('content-type').split(';')[0], 'image/jpeg');
  assert.ok(Buffer.from(await r.arrayBuffer()).equals(JPEG('foto-da-casa')));

  const semSessao = await fetch(base + '/api/midias/' + id + '/arquivo');
  assert.strictEqual(semSessao.status, 401, 'foto de imovel tambem nao e publica');

  const deB = await fetch(base + '/api/midias/' + id + '/arquivo', { headers: { Cookie: B.cookie() } });
  assert.strictEqual(deB.status, 404, 'nem para outra conta que saiba o id');
});

test('trocar a capa deixa exatamente UMA capa no imovel', async () => {
  await enviarImovel(A.cookie(), 'imovel=p-foto', 'image/png', PNG('a-segunda-foto'));
  const fotos = (await A('GET', '/api/midias/imovel')).dados;
  assert.strictEqual(fotos.length, 2, 'a segunda foto entrou');
  assert.strictEqual(fotos.filter(f => f.capa).length, 1, 'e nao virou capa tambem');

  const segunda = fotos.find(f => !f.capa);
  assert.strictEqual((await B('POST', `/api/midias/imovel/${segunda.id}/capa`)).status, 404,
    'B nao define capa em foto de A');
  assert.strictEqual((await A('POST', `/api/midias/imovel/${segunda.id}/capa`)).status, 200);

  const depois = (await A('GET', '/api/midias/imovel')).dados;
  // Duas capas e capa nenhuma dao o mesmo estrago: o cartao passa a depender de
  // qual linha o banco devolveu primeiro.
  assert.strictEqual(depois.filter(f => f.capa).length, 1, 'a anterior deixou de ser capa');
  assert.strictEqual(depois[0].id, segunda.id, 'a capa vem primeiro — e dela que o cartao tira a imagem');
});

test('apagar a capa promove outra foto, e leva o arquivo do disco junto', async () => {
  const { db, PASTA_UPLOADS } = require('./db');
  const capa = (await A('GET', '/api/midias/imovel')).dados.find(f => f.capa);
  const arquivo = db.prepare('select arquivo from midias_imovel where id = ?').get(capa.id).arquivo;

  assert.strictEqual((await B('DELETE', '/api/midias/' + capa.id)).status, 404, 'B nao apaga foto de A');
  assert.strictEqual((await A('DELETE', '/api/midias/' + capa.id)).status, 200);

  assert.strictEqual(fs.existsSync(path.join(PASTA_UPLOADS, arquivo)), false, 'o arquivo foi junto');

  const depois = (await A('GET', '/api/midias/imovel')).dados;
  assert.strictEqual(depois.length, 1);
  // Sem promover, o imovel fica com foto no banco e estado vazio na tela — o
  // usuario ve a inicial de volta e nao entende que ainda tem foto la.
  assert.strictEqual(depois[0].capa, true, 'sobrou foto, entao tem que sobrar capa');
});

test('apagar o imovel leva as fotos dele junto (cascata)', async () => {
  const { db } = require('./db');
  assert.strictEqual(db.prepare('select count(*) n from midias_imovel').get().n, 1);

  assert.strictEqual((await A('DELETE', '/api/properties/p-foto')).status, 200);

  assert.strictEqual(db.prepare('select count(*) n from midias_imovel').get().n, 0,
    'foto de imovel excluido nao pode sobreviver ao imovel');
});

test('formato fora da lista branca e recusado na foto do imovel', async () => {
  await A('PUT', '/api/properties/p-limite', { id: 'p-limite', name: 'Casa cheia', address: 'Rua X' });
  const r = await enviarImovel(A.cookie(), 'imovel=p-limite', 'application/pdf', Buffer.from('%PDF-'));
  assert.strictEqual(r.status, 415, 'PDF nao e foto');
});

test('video no imovel e recusado — o cartao so mostra imagem', async () => {
  const r = await enviarImovel(A.cookie(), 'imovel=p-limite', 'video/webm', Buffer.from('x'));
  assert.strictEqual(r.status, 415);
});

test('acima do teto da foto do imovel e recusado', async () => {
  const grande = Buffer.alloc(8 * 1024 * 1024 + 1, 1);
  const r = await enviarImovel(A.cookie(), 'imovel=p-limite', 'image/jpeg', grande);
  assert.strictEqual(r.status, 413);
});

test('estourar a quantidade de fotos por imovel e recusado', async () => {
  for (let i = 0; i < 8; i++) {
    const ok = await enviarImovel(A.cookie(), 'imovel=p-limite', 'image/jpeg', JPEG('f' + i));
    assert.strictEqual(ok.status, 201, `a foto ${i + 1} entra`);
  }
  const nona = await enviarImovel(A.cookie(), 'imovel=p-limite', 'image/jpeg', JPEG('f9'));
  // Sem teto de quantidade, um laco de fetch de sessao legitima enche o disco.
  assert.strictEqual(nona.status, 409, 'a nona nao entra');
});

// ── Limite de tentativas por IP ─────────────────────────────────────────

test('login tem teto de tentativas por IP', async () => {
  const c = cliente();
  for (let i = 0; i < 5; i++) {
    const r = await c('POST', '/api/auth/entrar', { email: 'a@teste.com', senha: 'chute-' + i });
    assert.strictEqual(r.status, 401, `tentativa ${i + 1} ainda e recusa normal de senha`);
  }
  const sexta = await c('POST', '/api/auth/entrar', { email: 'a@teste.com', senha: 'chute-5' });
  assert.strictEqual(sexta.status, 429, 'a sexta tentativa no mesmo minuto e barrada');

  // Senha CERTA tambem e barrada: o teto e da porta, nao do chute. Se a certa
  // passasse, bastaria intercalar para varrer a vontade.
  const certa = await c('POST', '/api/auth/entrar', { email: 'a@teste.com', senha: 'segredo123' });
  assert.strictEqual(certa.status, 429);

  limite.limpar();
  const depois = await c('POST', '/api/auth/entrar', { email: 'a@teste.com', senha: 'segredo123' });
  assert.strictEqual(depois.status, 200, 'passada a janela, a conta volta a entrar');
});

test('a leitura de link e limitada por IP, NAO por id', async () => {
  // E este o ataque: varrer UUIDs ate achar um link vivo. Se a chave do limite
  // levasse o id, cada UUID teria orcamento proprio e a varredura passaria
  // inteira sem encostar no teto.
  const c = cliente();
  let barrou = 0;
  for (let i = 0; i < 32; i++) {
    const r = await c('GET', '/api/links/uuid-inventado-' + i);
    if (r.status === 429) barrou++;
  }
  assert.ok(barrou > 0, 'varredura de UUIDs diferentes tem que bater no teto');
});

test('o teto do login nao consome o orcamento da leitura de link', async () => {
  const c = cliente();
  for (let i = 0; i < 6; i++) await c('POST', '/api/auth/entrar', { email: 'a@teste.com', senha: 'x' });
  const link = await c('GET', '/api/links/nao-existe');
  assert.strictEqual(link.status, 404, 'escopos separados: 404 de link inexistente, nao 429');
});

test('IPv6 do mesmo bloco /64 divide o MESMO orcamento', () => {
  // Um cliente IPv6 recebe um bloco /64 inteiro. Chavear pelo endereco seria o
  // mesmo que nao ter limite: trocar de endereco dentro do proprio bloco e uma
  // linha de configuracao.
  const a = limite.normalizarIp('2001:db8:1:2:aaaa:bbbb:cccc:dddd');
  const b = limite.normalizarIp('2001:db8:1:2:9999:8888:7777:6666');
  assert.strictEqual(a, b, 'dois enderecos do mesmo /64 tem que dar a mesma chave');

  const outro = limite.normalizarIp('2001:db8:1:3:aaaa:bbbb:cccc:dddd');
  assert.notStrictEqual(a, outro, 'bloco diferente, orcamento diferente');

  // Forma comprimida e a expandida sao o MESMO endereco.
  assert.strictEqual(limite.normalizarIp('2001:db8::1'),
                     limite.normalizarIp('2001:0db8:0:0:0:0:0:1'));

  // IPv4 passa inteiro, e o mapeamento IPv4-em-IPv6 do Node some.
  assert.strictEqual(limite.normalizarIp('177.74.156.13'), '177.74.156.13');
  assert.strictEqual(limite.normalizarIp('::ffff:177.74.156.13'), '177.74.156.13');
});

test('a conta trava depois de 20 falhas, venham de onde vierem', async () => {
  const c = cliente();
  // Limpa so a janela do IP a cada volta: o alvo do teste e o contador POR
  // CONTA, que e o unico que sobrevive a um atacante trocando de endereco.
  for (let i = 0; i < limite.FALHAS.max; i++) {
    const r = await c('POST', '/api/auth/entrar', { email: 'a@teste.com', senha: 'chute-' + i });
    assert.strictEqual(r.status, 401, `falha ${i + 1} e recusa normal`);
    limite.limpar('auth-entrar');
  }

  const bloqueada = await c('POST', '/api/auth/entrar', { email: 'a@teste.com', senha: 'segredo123' });
  assert.strictEqual(bloqueada.status, 429, 'a conta esta trancada mesmo com a senha CERTA');

  // Outra conta nao e afetada — senao trancar uma trancaria todas.
  limite.limpar('auth-entrar');
  const outra = await c('POST', '/api/auth/entrar', { email: 'b@teste.com', senha: 'segredo456' });
  assert.strictEqual(outra.status, 200, 'conta diferente, contador diferente');

  limite.limpar();
});

test('acertar a senha zera o contador de falhas da conta', async () => {
  const c = cliente();
  for (let i = 0; i < 5; i++) {
    await c('POST', '/api/auth/entrar', { email: 'a@teste.com', senha: 'errada' });
    limite.limpar('auth-entrar');
  }
  assert.strictEqual((await c('POST', '/api/auth/entrar', { email: 'a@teste.com', senha: 'segredo123' })).status, 200);

  // Se o acerto nao zerasse, dava para trancar a conta de alguem de fora so
  // queimando as tentativas no e-mail dela.
  limite.limpar('auth-entrar');
  for (let i = 0; i < 16; i++) {
    const r = await c('POST', '/api/auth/entrar', { email: 'a@teste.com', senha: 'errada' });
    assert.strictEqual(r.status, 401, `pos-acerto, falha ${i + 1} ainda e 401`);
    limite.limpar('auth-entrar');
  }
  limite.limpar();
});

test('upload de midia tem teto por conta', async () => {
  await A('PUT', '/api/inspections/v-teto', { id: 'v-teto', tipo: 'Entrada', rooms: [{ nome: 'Sala' }] });
  let barrou = false;
  // O teto e por CONTA (a rota exige sessao), nao por IP: quem sobe arquivo ja
  // esta autenticado, e o disco que enche e o da conta dele.
  for (let i = 0; i < 130 && !barrou; i++) {
    const r = await enviar(A.cookie(), 'vistoria=v-teto&ambiente=' + i + '&tipo=foto',
      'image/jpeg', JPEG('f' + i));
    if (r.status === 429) barrou = true;
  }
  assert.ok(barrou, 'um laco de upload tem que encontrar um teto — o disco nao tem cota');
  limite.limpar();
});

test('nao-admin recebe 403 nas rotas de administracao', async () => {
  for (const rota of ['users', 'contracts', 'profiles']) {
    assert.strictEqual((await B('GET', `/api/admin/${rota}`)).status, 403);
  }
});

test('admin le contratos de todos, mas cloud_key NUNCA sai', async () => {
  const r = await A('GET', '/api/admin/contracts');
  assert.strictEqual(r.status, 200);
  assert.ok(r.dados.length >= 1);
  for (const c of r.dados) {
    // cloud_key e a chave AES dos links do inquilino: com ela e o id, qualquer
    // um decifra o contrato. Era o motivo da migration 002 no Postgres.
    assert.ok(!('cloud_key' in c), 'cloud_key vazou para a tela de admin');
    assert.strictEqual(typeof c.fields, 'object');
  }
});

test('admin NAO enxerga o ERP', async () => {
  // Decisao registrada na Parte III do ARQUITETURA: supervisao de contas nao e
  // acesso ao negocio alheio. Nao ha rota de admin para imovel, cliente,
  // financeiro ou vistoria — e a ausencia e o teste.
  for (const r of ['properties', 'clients', 'financial_records', 'inspections']) {
    assert.strictEqual((await A('GET', `/api/admin/${r}`)).status, 404);
  }
});

// ── Conta ───────────────────────────────────────────────────────────────

test('excluir conta exige a senha certa e leva os dados junto', async () => {
  const c = cliente();
  await c('POST', '/api/auth/registrar', { email: 'sai@teste.com', senha: 'segredo123' });
  await c('PUT', '/api/properties/p-sai', { id: 'p-sai', name: 'Imovel', address: 'Rua X' });

  assert.strictEqual((await c('DELETE', '/api/auth/conta', { senha: 'errada' })).status, 401);
  assert.strictEqual((await c('GET', '/api/properties')).dados.length, 1, 'nada foi apagado');

  assert.strictEqual((await c('DELETE', '/api/auth/conta', { senha: 'segredo123' })).status, 200);

  const { db } = require('./db');
  assert.strictEqual(db.prepare('select count(*) n from users where email = ?').get('sai@teste.com').n, 0);
  assert.strictEqual(db.prepare('select count(*) n from properties where id = ?').get('p-sai').n, 0,
    'on delete cascade leva o ERP junto');
});

test('trocar a senha derruba as OUTRAS sessoes, nao a atual', async () => {
  const c1 = cliente();
  const c2 = cliente();
  await c1('POST', '/api/auth/registrar', { email: 'troca@teste.com', senha: 'senhavelha1' });
  await c2('POST', '/api/auth/entrar', { email: 'troca@teste.com', senha: 'senhavelha1' });

  assert.strictEqual((await c2('GET', '/api/contracts')).status, 200, 'c2 estava logado');

  // Sem a senha atual (ou com ela errada) nada muda: sessao roubada nao tranca o dono fora.
  assert.strictEqual((await c2('PUT', '/api/auth/senha', { senha: 'senhanova1' })).status, 401);
  assert.strictEqual((await c2('PUT', '/api/auth/senha', { atual: 'errada', senha: 'senhanova1' })).status, 401);
  assert.strictEqual((await c1('GET', '/api/contracts')).status, 200, 'recusa nao derruba sessao nenhuma');

  assert.strictEqual((await c2('PUT', '/api/auth/senha', { atual: 'senhavelha1', senha: 'senhanova1' })).status, 200);
  assert.strictEqual((await c2('GET', '/api/contracts')).status, 200, 'quem trocou continua dentro');
  assert.strictEqual((await c1('GET', '/api/contracts')).status, 401, 'a outra sessao caiu');
  assert.strictEqual((await cliente()('POST', '/api/auth/entrar', { email: 'troca@teste.com', senha: 'senhanova1' })).status, 200,
    'a senha nova entra');
});

// ── Servico de arquivos ─────────────────────────────────────────────────

test('rota de API desconhecida responde JSON, nao HTML', async () => {
  const r = await fetch(base + '/api/coisa-que-nao-existe');

  // 401 e nao 404: o router de recursos exige sessao antes de decidir se o
  // caminho existe. E o comportamento certo — responder 404 aqui e 401 nas
  // rotas reais diria a um anonimo quais rotas existem.
  assert.strictEqual(r.status, 401);

  // O que este teste realmente protege: um caminho errado nao pode devolver o
  // index.html com status 200. O front faria JSON.parse numa pagina inteira e o
  // erro nao diria nada sobre o que aconteceu.
  assert.match(r.headers.get('content-type') || '', /json/);

  // Logado, o mesmo caminho vira 404 de verdade — coberto tambem pelo teste da
  // lista branca de recursos.
  const logado = await A('GET', '/api/coisa-que-nao-existe');
  assert.strictEqual(logado.status, 404);
  assert.strictEqual(logado.dados.erro, 'Recurso desconhecido.');
});

test('/c serve o app -- e o endereco dos links de inquilino', async () => {
  // Utils.shareBaseUrl monta `origin + '/c'` em producao. Isto era um rewrite
  // do vercel.json; com ele apagado, sem esta rota TODO link gerado daria 404.
  const r = await fetch(base + '/c');
  assert.strictEqual(r.status, 200);
  assert.ok((await r.text()).includes('MEUS IMÓVEIS APP'));
});

test('o front e servido e vem com os cabecalhos de seguranca', async () => {
  const r = await fetch(base + '/app.html');
  assert.strictEqual(r.status, 200);
  // Estes vinham do vercel.json. Sumiram com ele e nao podiam sumir: o
  // X-Frame-Options e quem barra clickjacking, ja que `frame-ancestors` por
  // <meta> o navegador ignora.
  assert.strictEqual(r.headers.get('x-frame-options'), 'DENY');
  assert.strictEqual(r.headers.get('x-content-type-options'), 'nosniff');
  // CSP por cabecalho: e o unico jeito de `frame-ancestors` valer. Os handlers
  // inline do app precisam continuar rodando (sem script-src-attr 'none').
  const csp = r.headers.get('content-security-policy') || '';
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /script-src 'self' 'unsafe-inline'/);
  assert.doesNotMatch(csp, /script-src-attr|upgrade-insecure-requests/);
  assert.ok(r.headers.get('strict-transport-security'), 'HSTS vem do helmet');
  assert.ok((await r.text()).includes('MEUS IMÓVEIS APP'));
});

// ── Imagens fora da listagem ────────────────────────────────────────────

const ASSIN = 'data:image/png;base64,QVNTSU5BVFVSQQ==';
const SELFIE = 'data:image/jpeg;base64,U0VMRklF';

test('a listagem vem sem imagens, marcada; o GET de um vem inteiro', async () => {
  await A('PUT', '/api/contracts/c-midia', {
    id: 'c-midia', name: 'Com assinatura', template_id: 'locacao_residencial',
    fields: { nome_locatario: 'Ana', valor_aluguel: 'R$ 1.000,00',
      assinatura_locador: ASSIN, assinatura_locatario: ASSIN, selfie_locatario: SELFIE }
  });

  const lista = (await A('GET', '/api/contracts')).dados.find(c => c.id === 'c-midia');
  assert.strictEqual(lista.fields.nome_locatario, 'Ana', 'o texto continua na lista');
  assert.ok(!JSON.stringify(lista.fields).includes('data:'), 'nenhuma imagem na lista');
  assert.strictEqual(lista.fields._midia_omitida, true, 'a lista diz que omitiu');

  const um = await A('GET', '/api/contracts/c-midia');
  assert.strictEqual(um.dados.fields.selfie_locatario, SELFIE);
  assert.ok(!('_midia_omitida' in um.dados.fields));

  // O GET de um respeita o escopo como o resto: outra conta recebe 404.
  assert.strictEqual((await B('GET', '/api/contracts/c-midia')).status, 404);
});

test('regravar a partir da lista NAO apaga as assinaturas', async () => {
  // O caso real: o reajuste faz `{...contract.fields, valor_aluguel: novo}` em
  // cima do contrato da lista. A marca vai junto na copia.
  const lista = (await A('GET', '/api/contracts')).dados.find(c => c.id === 'c-midia');
  await A('PUT', '/api/contracts/c-midia', {
    name: lista.name, template_id: lista.template_id,
    fields: { ...lista.fields, valor_aluguel: 'R$ 1.100,00' }
  });

  const f = (await A('GET', '/api/contracts/c-midia')).dados.fields;
  assert.strictEqual(f.valor_aluguel, 'R$ 1.100,00', 'a alteracao entrou');
  assert.strictEqual(f.assinatura_locador, ASSIN, 'assinatura do locador preservada');
  assert.strictEqual(f.selfie_locatario, SELFIE, 'selfie preservada');
  assert.ok(!('_midia_omitida' in f), 'a marca nunca e gravada');
});

test('o que chega vence: imagem nova substitui, gravacao inteira apaga', async () => {
  // Importacao: contrato da lista + assinatura nova do inquilino.
  const lista = (await A('GET', '/api/contracts')).dados.find(c => c.id === 'c-midia');
  const NOVA = 'data:image/png;base64,Tk9WQQ==';
  // Como o Storage.update do front: name e template_id vao sempre.
  const base = { name: lista.name, template_id: lista.template_id };
  await A('PUT', '/api/contracts/c-midia', { ...base, fields: { ...lista.fields, assinatura_locatario: NOVA } });
  let f = (await A('GET', '/api/contracts/c-midia')).dados.fields;
  assert.strictEqual(f.assinatura_locatario, NOVA, 'a do inquilino e a nova');
  assert.strictEqual(f.assinatura_locador, ASSIN, 'a do locador continua');

  // Editor (contrato inteiro, SEM marca) limpando a assinatura do locador:
  // a remocao tem de valer — nao pode ressuscitar.
  const { assinatura_locador, ...semAssinatura } = f;
  await A('PUT', '/api/contracts/c-midia', { ...base, fields: semAssinatura });
  f = (await A('GET', '/api/contracts/c-midia')).dados.fields;
  assert.ok(!('assinatura_locador' in f), 'remocao deliberada respeitada');
  assert.strictEqual(f.selfie_locatario, SELFIE);
});

test('admin nao recebe assinaturas nem selfies de outras contas', async () => {
  const r = await A('GET', '/api/admin/contracts');
  assert.ok(r.dados.some(c => c.id === 'c-midia'));
  assert.ok(!JSON.stringify(r.dados).includes('data:'), 'nenhuma imagem na supervisao');
});

// ── Migrations e backup ─────────────────────────────────────────────────

test('o banco do app sobe na ultima versao das migrations', () => {
  const { db, MIGRACOES } = require('./db');
  assert.strictEqual(db.prepare('pragma user_version').get().user_version, MIGRACOES.length);
});

test('migrations: aplicam em ordem, e a que falha e desfeita inteira', () => {
  const { DatabaseSync } = require('node:sqlite');
  const { migrar } = require('./db');
  const banco = new DatabaseSync(':memory:');
  const versao = () => banco.prepare('pragma user_version').get().user_version;

  const lista = ['create table t (a text)', 'alter table t add column b text'];
  let backups = 0;
  assert.strictEqual(migrar(banco, lista, () => backups++), 2);
  assert.strictEqual(backups, 1, 'o gancho do backup roda antes de migrar');

  // Rodar de novo sem nada pendente: nao toca o banco nem chama o backup.
  migrar(banco, lista, () => backups++);
  assert.strictEqual(backups, 1);

  // A terceira cria uma tabela e depois quebra: nada dela pode ficar.
  const quebrada = [...lista, 'create table parcial (x); isto nao e sql'];
  assert.throws(() => migrar(banco, quebrada), /Migration 3 falhou/);
  assert.strictEqual(versao(), 2, 'versao nao avanca');
  assert.strictEqual(
    banco.prepare("select count(*) n from sqlite_master where name = 'parcial'").get().n, 0,
    'o que a migration fez antes de quebrar foi desfeito');

  // Codigo antigo num banco mais novo: recusa ligar em vez de gravar errado.
  assert.throws(() => migrar(banco, lista.slice(0, 1)), /conhece/);
});

test('backup diario: gera um banco legivel, um por dia, guarda so os ultimos', () => {
  const { DatabaseSync } = require('node:sqlite');
  const { db, backupDiario } = require('./db');
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'mi-bkp-'));
  try {
    // Backups "antigos" de dias anteriores, para a faxina ter o que apagar.
    for (let d = 1; d <= 8; d++) {
      fs.writeFileSync(path.join(pasta, `data-2020-01-${String(d).padStart(2, '0')}.db`), '');
    }
    fs.writeFileSync(path.join(pasta, 'data-antes-v2-123.db'), '');

    const feito = backupDiario(db, pasta, 3);
    assert.ok(feito, 'o backup de hoje foi criado');
    assert.strictEqual(backupDiario(db, pasta, 3), null, 'segunda chamada no mesmo dia nao copia de novo');

    // O arquivo e um banco completo, com os dados de verdade.
    const copia = new DatabaseSync(feito);
    assert.ok(copia.prepare('select count(*) n from users').get().n > 0);
    copia.close();

    const restantes = fs.readdirSync(pasta).sort();
    assert.strictEqual(restantes.filter(f => /^data-\d{4}/.test(f)).length, 3, 'so os 3 mais recentes');
    assert.ok(restantes.includes(path.basename(feito)), 'o de hoje sobrevive a faxina');
    assert.ok(restantes.includes('data-antes-v2-123.db'), 'backup de antes de migration nunca e apagado pela faxina');
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
});

test('espelho de uploads: copia o novo, guarda o removido por um prazo, depois apaga', () => {
  const { espelharUploads } = require('./db');
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'mi-esp-'));
  const origem = path.join(raiz, 'uploads');
  const destino = path.join(raiz, 'espelho');
  try {
    fs.mkdirSync(origem);
    fs.writeFileSync(path.join(origem, 'a.jpg'), 'A');
    fs.writeFileSync(path.join(origem, 'b.jpg'), 'B');

    assert.strictEqual(espelharUploads(origem, destino), 2);
    assert.strictEqual(espelharUploads(origem, destino), 0, 'incremental: o que ja foi copiado nao copia de novo');

    // A varredura de orfao (ou um bug dela) apaga b.jpg em uploads/.
    fs.unlinkSync(path.join(origem, 'b.jpg'));
    espelharUploads(origem, destino);
    assert.ok(!fs.existsSync(path.join(destino, 'b.jpg')));
    assert.strictEqual(fs.readFileSync(path.join(destino, 'removidos', 'b.jpg'), 'utf8'), 'B',
      'o removido fica guardado: e o que salva a foto se a varredura errar');

    // Passado o prazo, o removido sai de vez (dias = 0 => ja venceu).
    const velho = new Date(Date.now() - 864e5);
    fs.utimesSync(path.join(destino, 'removidos', 'b.jpg'), velho, velho);
    espelharUploads(origem, destino, 0);
    assert.ok(!fs.existsSync(path.join(destino, 'removidos', 'b.jpg')));
    assert.ok(fs.existsSync(path.join(destino, 'a.jpg')), 'o vivo continua');
  } finally {
    fs.rmSync(raiz, { recursive: true, force: true });
  }
});
