// ═══════════════════════════════════════════════════════
// Banco — node:sqlite, arquivo único.
//
// O schema é a lista MIGRACOES, aplicada em ordem no boot. A versão do banco
// mora no `pragma user_version` do próprio SQLite — não há tabela de controle.
// Antes de aplicar qualquer migration num banco com dados, sai um backup.
//
// A parte que importa deste arquivo é o mapa RECURSOS: ele descreve as tabelas
// que o app acessa por CRUD genérico, e é a ÚNICA lista branca de nomes de
// tabela que vira SQL. Rota nenhuma concatena nome vindo do cliente.
// ═══════════════════════════════════════════════════════

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const ARQUIVO = process.env.DB_FILE || path.join(__dirname, '..', 'data.db');
// Ao lado do banco por padrão: no Render isso é /data/backups, dentro do disco
// persistente. Mesmo disco = protege de erro do app (migration ruim, exclusão
// indevida), NÃO de perda do disco — para isso, cópia para fora (ver README).
const PASTA_BACKUP = process.env.BACKUP_DIR || path.join(path.dirname(ARQUIVO), 'backups');
const MANTER_BACKUPS = 7;

const db = new DatabaseSync(ARQUIVO);

db.exec('pragma journal_mode = WAL');
db.exec('pragma foreign_keys = ON');

// ── Backup ──────────────────────────────────────────────────────────────
//
// `vacuum into` é o backup nativo do SQLite: copia um retrato consistente
// mesmo com o servidor gravando, e o arquivo gerado é um banco completo —
// restaurar é copiá-lo por cima do data.db com o servidor parado.
//
// ponytail: `DatabaseSync` é síncrono, então o backup segura o event loop
// enquanto copia. Com um banco de poucos MB são milissegundos; se passar de
// centenas de MB, mover para `node:sqlite` backup() assíncrono.
function backup(banco, pasta, nome) {
  fs.mkdirSync(pasta, { recursive: true });
  const alvo = path.join(pasta, nome);
  if (fs.existsSync(alvo)) return null;   // `vacuum into` recusa sobrescrever
  banco.exec(`vacuum into '${alvo.replace(/'/g, "''")}'`);
  return alvo;
}

// Um por dia, guardando os últimos `manter`. Chamado no boot e a cada poucas
// horas: o nome é a data, então chamar de novo no mesmo dia não faz nada.
const DIARIO = /^data-\d{4}-\d{2}-\d{2}\.db$/;
function backupDiario(banco, pasta, manter = MANTER_BACKUPS) {
  const feito = backup(banco, pasta, `data-${new Date().toISOString().slice(0, 10)}.db`);
  const diarios = fs.readdirSync(pasta).filter(f => DIARIO.test(f)).sort();
  for (const f of diarios.slice(0, -manter)) fs.unlinkSync(path.join(pasta, f));
  return feito;
}

// Os arquivos de mídia (uploads/) ficam fora do banco, então o backup do banco
// sozinho restauraria linhas apontando para fotos que não existem mais. Arquivo
// de upload nunca é alterado depois de gravado (o nome é do servidor e único),
// então basta um ESPELHO incremental: copia o que ainda não foi copiado.
//
// O que some de uploads/ (exclusão, varredura de órfão) vai para
// `removidos/` no espelho e só é apagado de vez depois de `dias` — o mesmo
// prazo do backup de banco mais antigo, que ainda pode citá-lo. É o que
// salva as fotos se a varredura de órfão errar de novo.
//
// ponytail: cópia síncrona; só pesa no boot depois de muito upload novo. Se
// os vídeos crescerem, trocar por fs.promises.copyFile.
function espelharUploads(origem, destino, dias = MANTER_BACKUPS) {
  const lixo = path.join(destino, 'removidos');
  fs.mkdirSync(lixo, { recursive: true });
  const vivos = new Set(fs.existsSync(origem) ? fs.readdirSync(origem) : []);

  let copiados = 0;
  for (const nome of vivos) {
    const alvo = path.join(destino, nome);
    if (!fs.existsSync(alvo)) { fs.copyFileSync(path.join(origem, nome), alvo); copiados++; }
  }

  const agora = new Date();
  for (const nome of fs.readdirSync(destino)) {
    if (nome === 'removidos' || vivos.has(nome)) continue;
    const em = path.join(lixo, nome);
    fs.renameSync(path.join(destino, nome), em);
    fs.utimesSync(em, agora, agora);   // o prazo conta da remoção, não da cópia
  }
  const limite = Date.now() - dias * 864e5;
  for (const nome of fs.readdirSync(lixo)) {
    const p = path.join(lixo, nome);
    if (fs.statSync(p).mtimeMs < limite) fs.unlinkSync(p);
  }
  return copiados;
}

// ── Migrations ──────────────────────────────────────────────────────────
//
// Regras (ARQUITETURA.md R4):
// - Só se ACRESCENTA ao fim da lista. Migration que já rodou em produção
//   nunca é editada nem removida — o banco não roda de novo, e o código
//   passaria a descrever um schema que não existe.
// - Cada uma roda numa transação junto com o bump do `user_version`: ou
//   entra inteira, ou o banco fica exatamente como estava.
// - O índice na lista + 1 é o número da versão.
const MIGRACOES = [
  // 1 — baseline: o schema de 2026-08-26. Fica com `if not exists` de
  // propósito: bancos criados antes deste regime estão em user_version 0 e já
  // têm estas tabelas. Migrations daqui pra frente são `alter table` comuns.
  `
create table if not exists users (
  id          text primary key,
  email       text not null unique collate nocase,
  senha_hash  text not null,
  salt        text not null,
  is_admin    integer not null default 0,
  criado_em   text not null,
  ultimo_login text
);

create table if not exists sessions (
  token      text primary key,
  user_id    text not null references users(id) on delete cascade,
  expira_em  text not null
);
create index if not exists sessions_user_idx on sessions (user_id);

create table if not exists contracts (
  id           text primary key,
  user_id      text not null references users(id) on delete cascade,
  name         text not null,
  template_id  text not null,
  fields       text not null default '{}',
  is_finalized integer not null default 0,
  cloud_id     text,
  cloud_key    text,
  created_at   text not null,
  updated_at   text not null
);

create table if not exists profiles (
  id           text primary key references users(id) on delete cascade,
  profile_data text not null default '{}',
  updated_at   text not null
);

create table if not exists properties (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  address text not null,
  cep text,
  type text not null default 'Residencial',
  bedrooms integer default 0,
  bathrooms integer default 0,
  parking integer default 0,
  area real default 0,
  rent_value real default 0,
  iptu_value real default 0,
  condo_value real default 0,
  status text not null default 'Disponível',
  notes text,
  created_at text not null,
  updated_at text not null
);

create table if not exists clients (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  client_type text not null default 'Inquilino',
  person_type text not null default 'PF',
  document text not null,
  rg text,
  phone text,
  email text,
  address text,
  profession text,
  income real default 0,
  notes text,
  created_at text not null,
  updated_at text not null
);

create table if not exists financial_records (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  contract_id text,
  description text not null,
  tenant_name text,
  landlord_name text,
  due_date text not null,
  rent_value real not null default 0,
  fee_percent real not null default 10,
  fee_value real not null default 0,
  net_payout real not null default 0,
  status text not null default 'Pendente',
  paid_at text,
  notes text,
  created_at text not null,
  updated_at text not null
);

create table if not exists inspections (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  property_id text,
  contract_id text,
  tipo text not null default 'Entrada',
  status text not null default 'Rascunho',
  tenant_name text,
  inspected_on text,
  notes text,
  rooms text not null default '[]',
  closed_at text,
  created_at text not null,
  updated_at text not null
);

create table if not exists tenant_links (
  id                text primary key,
  encrypted_payload text not null,
  key_proof         text,
  finalized         integer not null default 0,
  finalized_at      text,
  finalized_ip      text,
  created_by        text references users(id) on delete cascade,
  created_at        text not null,
  expires_at        text not null
);
create index if not exists tenant_links_criador_idx
  on tenant_links (created_by, created_at desc);
`,

  // 2 — mídia da vistoria e do imóvel (branch feat/midia-vistoria, 09/2026).
  // `if not exists` porque bancos de desenvolvimento daquele branch já criaram
  // estas tabelas sem migration. A partir da 3, `alter`/`create` comuns.
  `
create table if not exists midias (
  id            text primary key,
  user_id       text not null references users(id) on delete cascade,
  inspection_id text not null references inspections(id) on delete cascade,
  ambiente      integer not null,
  tipo          text not null,
  mime          text not null,
  bytes         integer not null,
  arquivo       text not null,
  created_at    text not null
);
create index if not exists midias_vistoria_idx on midias (inspection_id, ambiente);

create table if not exists midias_imovel (
  id          text primary key,
  user_id     text not null references users(id) on delete cascade,
  property_id text not null references properties(id) on delete cascade,
  capa        integer not null default 0,
  mime        text not null,
  bytes       integer not null,
  arquivo     text not null,
  created_at  text not null
);
create index if not exists midias_imovel_idx on midias_imovel (property_id, capa desc, created_at);
`
];

// Leva o banco até a última versão da lista. `antes(versaoAtual)` roda só se
// houver migration pendente — é o gancho do backup.
function migrar(banco, lista, antes) {
  const atual = banco.prepare('pragma user_version').get().user_version;

  // Banco mais novo que o código: deploy revertido para uma versão antiga.
  // Seguir rodando seria o código antigo gravando num schema que ele não
  // conhece. Melhor não ligar e dizer por quê.
  if (atual > lista.length) {
    throw new Error(`Banco na versão ${atual}, mas este código só conhece até a ${lista.length}. ` +
      'Volte para a versão do código que criou este banco.');
  }
  if (atual === lista.length) return atual;
  if (antes) antes(atual);

  for (let v = atual; v < lista.length; v++) {
    banco.exec('begin');
    try {
      banco.exec(lista[v]);
      banco.exec(`pragma user_version = ${v + 1}`);
      banco.exec('commit');
    } catch (e) {
      banco.exec('rollback');
      throw new Error(`Migration ${v + 1} falhou e foi desfeita; o banco segue na versão ${v}. ${e.message}`);
    }
  }
  return lista.length;
}

migrar(db, MIGRACOES, (versao) => {
  // Banco recém-criado não tem o que perder; banco com tabelas tem.
  const temDados = db.prepare("select count(*) n from sqlite_master where type = 'table'").get().n > 0;
  if (temDados) {
    const salvo = backup(db, PASTA_BACKUP, `data-antes-v${versao + 1}-${Date.now()}.db`);
    console.log(`Backup antes das migrations: ${salvo}`);
  }
});

// ── Pasta dos arquivos de midia ─────────────────────────────────────────
//
// Os bytes ficam em disco, nao no banco: decisao do dono do projeto. O preco
// dela e que o backup passa a ser DUAS coisas (data.db + uploads/) e que a
// cascata do SQLite apaga a linha sem apagar o arquivo — quem recolhe o orfao e
// a varredura em rotas/midias.js.
//
// `midias` e `midias_imovel` de proposito NAO entram no mapa RECURSOS abaixo: o
// CRUD generico grava o que o corpo mandar nas colunas declaradas, e `arquivo` e
// o nome de um arquivo no disco. Nome de arquivo e decisao do servidor, nunca do
// pedido.
//
// Duas tabelas, e nao uma com `inspection_id` anulavel: a foto do imovel vive
// enquanto o imovel existir, a da vistoria morre com a vistoria. Sao dois ciclos
// de vida, e cada um e uma cascata diferente. Juntar os dois exigiria afrouxar o
// NOT NULL de `inspection_id` — que no SQLite significa reconstruir a tabela num
// banco que ja tem contrato assinado dentro. As duas dividem a MESMA pasta de
// arquivos, e e por isso que a varredura de orfao em rotas/midias.js precisa
// olhar as duas: o que ela nao enxerga, ela apaga.
const PASTA_UPLOADS = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(PASTA_UPLOADS, { recursive: true });

// ── Mapa dos recursos com CRUD genérico ─────────────────────────────────
//
// `json`: colunas que o Postgres guardava como jsonb e o PostgREST devolvia
// já parseadas. O SQLite guarda texto. A conversão acontece AQUI, na borda,
// para o front continuar recebendo a forma que sempre recebeu.
//
// `bool`: SQLite não tem boolean. Mesma história, mesma borda.
//
// `profiles` NÃO está aqui de propósito: não tem coluna user_id (a chave
// primária É o usuário) e teria de virar exceção dentro do middleware de
// escopo. Exceção dentro da função que garante o escopo é onde o furo nasce.
// Ela tem rotas próprias em rotas/perfil.js.
const RECURSOS = {
  contracts: {
    colunas: ['id', 'user_id', 'name', 'template_id', 'fields', 'is_finalized',
      'cloud_id', 'cloud_key', 'created_at', 'updated_at'],
    json: ['fields'],
    bool: ['is_finalized'],
    midia: 'fields'
  },
  properties: {
    colunas: ['id', 'user_id', 'name', 'address', 'cep', 'type', 'bedrooms',
      'bathrooms', 'parking', 'area', 'rent_value', 'iptu_value', 'condo_value',
      'status', 'notes', 'created_at', 'updated_at'],
    json: [], bool: []
  },
  clients: {
    colunas: ['id', 'user_id', 'name', 'client_type', 'person_type', 'document',
      'rg', 'phone', 'email', 'address', 'profession', 'income', 'notes',
      'created_at', 'updated_at'],
    json: [], bool: []
  },
  financial_records: {
    colunas: ['id', 'user_id', 'contract_id', 'description', 'tenant_name',
      'landlord_name', 'due_date', 'rent_value', 'fee_percent', 'fee_value',
      'net_payout', 'status', 'paid_at', 'notes', 'created_at', 'updated_at'],
    json: [], bool: []
  },
  inspections: {
    colunas: ['id', 'user_id', 'property_id', 'contract_id', 'tipo', 'status',
      'tenant_name', 'inspected_on', 'notes', 'rooms', 'closed_at',
      'created_at', 'updated_at'],
    json: ['rooms'], bool: []
  }
};

// ── Imagens fora da listagem ────────────────────────────────────────────
//
// `contracts.fields` guarda assinaturas e selfie como data: URL (~100 KB por
// contrato assinado). A listagem roda a cada login e nenhuma tela de lista
// mostra imagem — só o editor, que busca o contrato inteiro ao abrir.
//
// O perigo de mandar um objeto pela metade é ele voltar pela metade: uma tela
// que copia `fields` (reajuste, importação) e regrava apagaria as assinaturas.
// Por isso a listagem MARCA o que omitiu, e a marca viaja junto com qualquer
// cópia (`{...fields}` leva a chave). Gravação marcada é parcial por definição:
// o servidor repõe as imagens que já tinha e descarta a marca. Gravação sem
// marca é inteira — é assim que o editor apaga uma assinatura de propósito.
const MARCA_MIDIA = '_midia_omitida';
const ehMidia = (v) => typeof v === 'string' && /^\s*data:/i.test(v);

function semMidia(campos) {
  const f = { ...(campos || {}) };
  for (const k of Object.keys(f)) {
    if (ehMidia(f[k])) { delete f[k]; f[MARCA_MIDIA] = true; }
  }
  return f;
}

// O que chegou vence; do que estava guardado, só voltam as imagens ausentes.
function repoeMidia(novo, guardado) {
  if (!novo || typeof novo !== 'object' || !novo[MARCA_MIDIA]) return novo;
  const f = { ...novo };
  delete f[MARCA_MIDIA];
  for (const [k, v] of Object.entries(guardado || {})) {
    if (!(k in f) && ehMidia(v)) f[k] = v;
  }
  return f;
}

// ── Conversão de borda ──────────────────────────────────────────────────

// Linha do SQLite → forma que o front espera.
// JSON inválido no banco vira `{}`/`[]` em vez de derrubar a listagem inteira:
// um registro corrompido não pode apagar a tela do usuário.
function paraFora(linha, meta) {
  if (!linha) return linha;
  const fora = { ...linha };
  for (const c of meta.json) {
    try {
      fora[c] = JSON.parse(fora[c]);
    } catch {
      fora[c] = (fora[c] || '').trimStart().startsWith('[') ? [] : {};
    }
  }
  for (const c of meta.bool) fora[c] = !!fora[c];
  return fora;
}

// Objeto do front → valores que o SQLite aceita.
// node:sqlite só recebe null/number/string/bigint/Uint8Array: qualquer
// objeto, array ou boolean que passe direto vira TypeError em runtime.
function paraDentro(valor, coluna, meta) {
  if (meta.json.includes(coluna)) {
    if (valor === undefined || valor === null) return coluna === 'rooms' ? '[]' : '{}';
    return typeof valor === 'string' ? valor : JSON.stringify(valor);
  }
  if (valor === undefined || valor === null) return null;
  if (typeof valor === 'boolean') return valor ? 1 : 0;
  if (typeof valor === 'object') return JSON.stringify(valor);
  return valor;
}

module.exports = {
  db, RECURSOS, paraFora, paraDentro, semMidia, repoeMidia,
  MIGRACOES, migrar, backup, backupDiario, PASTA_BACKUP,
  PASTA_UPLOADS, espelharUploads
};
