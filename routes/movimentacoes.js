/**
 * movimentacoes.js — Rota legada redirecionada para /api/caixa
 * Mantida para compatibilidade com a v1 do sistema.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../database/connection');

// GET /movimentacoes — lê da tabela caixa (nova estrutura)
router.get('/', (req, res) => {
  try {
    const rows = db
      .prepare('SELECT * FROM caixa ORDER BY data_movimentacao DESC, id DESC')
      .all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar movimentações.' });
  }
});

module.exports = router;
