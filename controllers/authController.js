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

module.exports = { login, logout };
