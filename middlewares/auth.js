/**
 * auth.js — Middleware de autenticação JWT
 * Verifica o token no header Authorization: Bearer <token>
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function autenticar(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido. Faça login.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload; // { id, nome, email, tipo_usuario }
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado. Faça login novamente.' });
  }
}

module.exports = { autenticar };
