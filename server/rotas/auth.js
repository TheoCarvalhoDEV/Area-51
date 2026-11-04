// ═══════════════════════════════════════════════════════
// Contas e sessão. Substitui supabaseClient.auth.
//
// O que NÃO existe mais e não é fingido: confirmação de e-mail e redefinição
// de senha por e-mail. Não há serviço de envio. A tela correspondente saiu do
// front — botão que não chega a e-mail nenhum é pior que botão nenhum.
// ═══════════════════════════════════════════════════════

const express = require('express');
const crypto = require('node:crypto');
const { db } = require('../db');
const {
  criarSenha, conferirSenha, abrirSessao, fecharSessao,
  usuarioDaSessao, exigirLogin, lerCookie
} = require('../sessao');
const limite = require('../limite');
const { limitar } = limite;

const router = express.Router();

// Senha guardada com scrypt custa ~70ms para conferir, o que ja e um freio
// natural — mas freio de CPU nao e limite: com paralelismo, o atacante testa
// milhares por minuto. Cinco por minuto por IP transforma um dicionario de
// 10 mil senhas em 33 horas de tentativa contra UMA conta.
//
// O teto vale para tentativa CERTA tambem, de proposito: se a senha certa
// passasse livre, bastaria intercalar um acerto conhecido para zerar o
// contador e varrer a vontade.
const limiteLogin = limitar({
  escopo: 'auth-entrar', max: 5, janelaMs: 60_000,
  mensagem: 'Muitas tentativas de acesso. Espere um minuto e tente de novo.'
});

// Cadastro tem teto mais largo e janela mais longa: ninguem abre dez contas por
// engano, e sem isto uma unica maquina enche a tabela de usuarios.
const limiteCadastro = limitar({
  escopo: 'auth-registrar', max: 10, janelaMs: 60 * 60_000,
  mensagem: 'Muitos cadastros a partir deste endereço. Tente de novo mais tarde.'
});

// O mesmo mínimo que a tela de cadastro anuncia (auth.js do front).
const MIN_SENHA = 8;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Fronteira de confiança: validar aqui, não só na tela. O que chega no corpo
// pode nunca ter passado por um formulário.
function validar(email, senha) {
  if (!email || !EMAIL_OK.test(email)) return 'E-mail inválido.';
  if (!senha || String(senha).length < MIN_SENHA) {
    return `A senha precisa ter ao menos ${MIN_SENHA} caracteres.`;
  }
  return null;
}

const publico = (u) => ({ id: u.id, email: u.email, is_admin: !!u.is_admin });

// Salt fixo para o caso de e-mail inexistente: o hash roda mesmo assim, senão
// a resposta rápida para "não existe" e lenta para "senha errada" entregaria,
// pelo relógio, quem tem conta — exatamente o que a mensagem igual esconde.
const SALT_FANTASMA = '0'.repeat(32);

// ── Cadastro ────────────────────────────────────────────────────────────
router.post('/registrar', limiteCadastro, async (req, res) => {
  const email = String(req.body.email || '').trim();
  const senha = req.body.senha;

  const erro = validar(email, senha);
  if (erro) return res.status(400).json({ erro });

  // O hash vem ANTES da checagem de duplicado e da contagem de contas: depois
  // do `await` não pode haver nada assíncrono até o insert. Senão dois
  // cadastros simultâneos passariam juntos pela checagem — e, num banco vazio,
  // os dois nasceriam admin.
  const { salt, senha_hash } = await criarSenha(String(senha));

  const existe = db.prepare('select id from users where email = ?').get(email);
  if (existe) return res.status(409).json({ erro: 'already registered' });

  const user = {
    id: crypto.randomUUID(),
    email,
    // Primeira conta do banco vira admin. Sem isso não haveria como chegar na
    // tela de administração num banco recém-criado, e a alternativa seria um
    // usuário-semente com senha fixa no código.
    is_admin: db.prepare('select count(*) c from users').get().c === 0 ? 1 : 0
  };

  db.prepare(`
    insert into users (id, email, senha_hash, salt, is_admin, criado_em)
    values (?, ?, ?, ?, ?, ?)
  `).run(user.id, user.email, senha_hash, salt, user.is_admin, new Date().toISOString());

  abrirSessao(res, user.id);
  res.status(201).json({ user: publico(user) });
});

// ── Entrar ──────────────────────────────────────────────────────────────
router.post('/entrar', limiteLogin, async (req, res) => {
  const email = String(req.body.email || '').trim();
  const senha = String(req.body.senha || '');

  // O limite por IP acima protege a PORTA; este protege a CONTA. Mil endereços
  // fazendo cinco tentativas cada não encostam no teto por IP — e são cinco mil
  // por minuto contra a mesma senha.
  if (limite.contaBloqueada(email)) {
    return res.status(429).json({
      erro: 'Muitas tentativas nesta conta. Espere uma hora e tente de novo.'
    });
  }

  const u = db.prepare('select * from users where email = ?').get(email);
  const certa = u
    ? await conferirSenha(senha, u.salt, u.senha_hash)
    : (await conferirSenha(senha, SALT_FANTASMA, ''), false);

  // Mesma resposta para e-mail inexistente e senha errada: distinguir os dois
  // transforma o login num verificador de quem tem conta aqui.
  if (!certa) {
    limite.registrarFalhaDeLogin(email);
    return res.status(401).json({ erro: 'Invalid login credentials' });
  }

  // Acerto zera: sem isto, trancar a conta de alguém de fora seria só queimar
  // as tentativas no e-mail dela.
  limite.limparFalhasDeLogin(email);

  db.prepare('update users set ultimo_login = ? where id = ?').run(new Date().toISOString(), u.id);
  abrirSessao(res, u.id);
  res.json({ user: publico(u) });
});

// ── Sair ────────────────────────────────────────────────────────────────
router.post('/sair', (req, res) => {
  fecharSessao(req, res);
  res.json({ ok: true });
});

// ── Quem sou eu ─────────────────────────────────────────────────────────
// Sem sessão devolve 200 com user null, não 401: "não estou logado" é uma
// resposta normal desta rota, e o front a chama justamente para descobrir isso.
router.get('/sessao', (req, res) => {
  res.json({ user: usuarioDaSessao(req) });
});

// ── Trocar a senha (logado) ─────────────────────────────────────────────
router.put('/senha', exigirLogin, limiteLogin, async (req, res) => {
  const senha = req.body.senha;
  if (!senha || String(senha).length < MIN_SENHA) {
    return res.status(400).json({ erro: `A senha precisa ter ao menos ${MIN_SENHA} caracteres.` });
  }

  // A senha ATUAL é cobrada, como na exclusão de conta. Sem isto, uma sessão
  // roubada (ou um XSS) trocaria a senha e trancaria o dono fora da conta.
  const u = db.prepare('select salt, senha_hash from users where id = ?').get(req.usuario.id);
  if (!u || !(await conferirSenha(String(req.body.atual || ''), u.salt, u.senha_hash))) {
    return res.status(401).json({ erro: 'Senha atual incorreta. Nada foi alterado.' });
  }

  const { salt, senha_hash } = await criarSenha(String(senha));
  db.prepare('update users set senha_hash = ?, salt = ? where id = ?')
    .run(senha_hash, salt, req.usuario.id);

  // Trocar a senha derruba as OUTRAS sessões. Quem troca a senha em geral
  // desconfia de que alguém entrou; deixar as sessões antigas vivas anularia
  // o motivo da troca. A sessão atual sobrevive para não deslogar quem pediu.
  db.prepare('delete from sessions where user_id = ? and token != ?')
    .run(req.usuario.id, lerCookie(req) || '');

  res.json({ ok: true });
});

// ── Excluir a própria conta ─────────────────────────────────────────────
// Substitui a RPC delete_own_account. A senha é cobrada de novo aqui, e não só
// na tela: é a última confirmação antes de um apagamento em cascata.
router.delete('/conta', exigirLogin, limiteLogin, async (req, res) => {
  const senha = String(req.body.senha || '');
  const u = db.prepare('select * from users where id = ?').get(req.usuario.id);

  if (!u || !(await conferirSenha(senha, u.salt, u.senha_hash))) {
    return res.status(401).json({ erro: 'Senha incorreta. Nada foi apagado.' });
  }

  // `on delete cascade` em todas as tabelas leva contratos, imóveis, clientes,
  // financeiro, vistorias, perfil e sessões junto.
  db.prepare('delete from users where id = ?').run(req.usuario.id);
  fecharSessao(req, res);
  res.json({ ok: true });
});

module.exports = router;
