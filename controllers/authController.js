/**
 * authController.js — Login e logout
 */
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database/connection');
const { JWT_SECRET, JWT_EXPIRA } = require('../config');
const { registrarLog } = require('../middlewares/logger');

// POST /api/auth/login
function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  const usuario = db
    .prepare('SELECT * FROM usuarios WHERE email = ? AND status = 1')
    .get(email.trim().toLowerCase());

  if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

  const payload = {
    id          : usuario.id,
    nome        : usuario.nome,
    email       : usuario.email,
    tipo_usuario: usuario.tipo_usuario,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRA });

  registrarLog(usuario.id, 'LOGIN', `Login realizado`, req.ip);

  res.json({
    token,
    usuario: payload,
    mensagem: `Bem-vindo, ${usuario.nome}!`,
  });
}

// POST /api/auth/logout  (stateless — apenas log)
function logout(req, res) {
  if (req.usuario) {
    registrarLog(req.usuario.id, 'LOGOUT', 'Logout realizado', req.ip);
  }
  res.json({ mensagem: 'Logout registrado.' });
}

// POST /api/auth/cadastro — cadastro público (cria USUARIO_NORMAL)
function cadastrar(req, res) {
  const { nome, email, senha, telefone } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (nome.trim().length < 2) {
    return res.status(400).json({ erro: 'Nome deve ter ao menos 2 caracteres.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'Senha deve ter ao menos 6 caracteres.' });
  }

  const emailNorm = email.trim().toLowerCase();

  // Validação básica de formato de e-mail
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return res.status(400).json({ erro: 'E-mail inválido.' });
  }

  // Verifica duplicidade
  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(emailNorm);
  if (existe) {
    return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
  }

  const hash = bcrypt.hashSync(senha, 12);

  const result = db.prepare(`
    INSERT INTO usuarios (nome, email, senha, telefone, tipo_usuario)
    VALUES (?, ?, ?, ?, 'USUARIO_NORMAL')
  `).run(nome.trim(), emailNorm, hash, telefone ? telefone.trim() : null);

  registrarLog(result.lastInsertRowid, 'CADASTRO', `Novo usuário: ${emailNorm}`, req.ip);

  res.status(201).json({ mensagem: 'Conta criada com sucesso! Faça login para entrar.' });
}

module.exports = { login, logout, cadastrar };
