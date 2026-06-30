/**
 * logger.js — Registra ações importantes no banco (tabela logs)
 */
const db = require('../database/connection');

function registrarLog(usuarioId, acao, detalhes = '', ip = '') {
  try {
    db.prepare(`
      INSERT INTO logs (usuario_id, acao, detalhes, ip)
      VALUES (?, ?, ?, ?)
    `).run(usuarioId || null, acao, detalhes, ip);
  } catch (err) {
    // Log não deve derrubar a requisição
    console.error('[LOG ERROR]', err.message);
  }
}

module.exports = { registrarLog };
