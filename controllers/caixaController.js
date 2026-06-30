/**
 * caixaController.js — Fluxo de caixa: entradas, saídas, relatórios
 */
const db = require('../database/connection');
const { registrarLog } = require('../middlewares/logger');

// GET /api/caixa  (?inicio=YYYY-MM-DD&fim=YYYY-MM-DD&tipo=entrada|saida&categoria=)
function listar(req, res) {
  const { inicio, fim, tipo, categoria } = req.query;

  let sql    = `
    SELECT c.*, u.nome AS nome_usuario
    FROM caixa c
    LEFT JOIN usuarios u ON u.id = c.usuario_responsavel
    WHERE 1=1
  `;
  const params = [];

  if (inicio) { sql += ' AND date(c.data_movimentacao) >= ?'; params.push(inicio); }
  if (fim)    { sql += ' AND date(c.data_movimentacao) <= ?'; params.push(fim); }
  if (tipo)   { sql += ' AND c.tipo_movimentacao = ?';        params.push(tipo); }
  if (categoria) { sql += ' AND c.categoria = ?';             params.push(categoria); }

  sql += ' ORDER BY c.data_movimentacao DESC, c.id DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
}

// GET /api/caixa/resumo  — totalizadores
function resumo(req, res) {
  const { inicio, fim } = req.query;

  let where  = 'WHERE 1=1';
  const params = [];

  if (inicio) { where += ' AND date(data_movimentacao) >= ?'; params.push(inicio); }
  if (fim)    { where += ' AND date(data_movimentacao) <= ?'; params.push(fim); }

  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo_movimentacao='entrada' THEN valor ELSE 0 END), 0) AS total_entradas,
      COALESCE(SUM(CASE WHEN tipo_movimentacao='saida'   THEN valor ELSE 0 END), 0) AS total_saidas
    FROM caixa ${where}
  `).get(...params);

  res.json({
    total_entradas: row.total_entradas,
    total_saidas  : row.total_saidas,
    saldo         : row.total_entradas - row.total_saidas,
  });
}

// GET /api/caixa/relatorio/diario
function relatorioDiario(req, res) {
  const hoje = req.query.data || new Date().toISOString().slice(0, 10);

  const movs = db.prepare(`
    SELECT * FROM caixa
    WHERE date(data_movimentacao) = ?
    ORDER BY data_movimentacao DESC
  `).all(hoje);

  const totais = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo_movimentacao='entrada' THEN valor ELSE 0 END), 0) AS entradas,
      COALESCE(SUM(CASE WHEN tipo_movimentacao='saida'   THEN valor ELSE 0 END), 0) AS saidas
    FROM caixa WHERE date(data_movimentacao) = ?
  `).get(hoje);

  res.json({ data: hoje, movimentacoes: movs, totais });
}

// GET /api/caixa/relatorio/mensal
function relatorioMensal(req, res) {
  const hoje  = new Date();
  const ano   = req.query.ano  || hoje.getFullYear();
  const mes   = req.query.mes  || String(hoje.getMonth() + 1).padStart(2, '0');
  const prefixo = `${ano}-${String(mes).padStart(2, '0')}`;

  const porDia = db.prepare(`
    SELECT
      date(data_movimentacao) AS dia,
      SUM(CASE WHEN tipo_movimentacao='entrada' THEN valor ELSE 0 END) AS entradas,
      SUM(CASE WHEN tipo_movimentacao='saida'   THEN valor ELSE 0 END) AS saidas
    FROM caixa
    WHERE strftime('%Y-%m', data_movimentacao) = ?
    GROUP BY dia
    ORDER BY dia
  `).all(prefixo);

  const totais = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo_movimentacao='entrada' THEN valor ELSE 0 END), 0) AS entradas,
      COALESCE(SUM(CASE WHEN tipo_movimentacao='saida'   THEN valor ELSE 0 END), 0) AS saidas
    FROM caixa WHERE strftime('%Y-%m', data_movimentacao) = ?
  `).get(prefixo);

  res.json({ ano, mes, por_dia: porDia, totais });
}

// POST /api/caixa
function registrar(req, res) {
  const { tipo_movimentacao, descricao, valor, categoria, forma_pagamento } = req.body;

  if (!tipo_movimentacao || !descricao || valor == null) {
    return res.status(400).json({ erro: 'Tipo, descrição e valor são obrigatórios.' });
  }
  if (!['entrada','saida'].includes(tipo_movimentacao)) {
    return res.status(400).json({ erro: 'Tipo deve ser "entrada" ou "saida".' });
  }
  const valorNum = parseFloat(valor);
  if (isNaN(valorNum) || valorNum <= 0) {
    return res.status(400).json({ erro: 'Valor deve ser positivo.' });
  }

  const result = db.prepare(`
    INSERT INTO caixa
      (tipo_movimentacao, descricao, valor, categoria, forma_pagamento, usuario_responsavel)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    tipo_movimentacao,
    descricao.trim(),
    valorNum,
    categoria      || 'outros',
    forma_pagamento|| 'dinheiro',
    req.usuario.id,
  );

  registrarLog(req.usuario.id, 'CAIXA_' + tipo_movimentacao.toUpperCase(),
    `${descricao} R$${valorNum}`, req.ip);

  const nova = db.prepare('SELECT * FROM caixa WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(nova);
}

// DELETE /api/caixa/:id  (somente ADMIN)
function excluir(req, res) {
  const result = db.prepare('DELETE FROM caixa WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ erro: 'Movimentação não encontrada.' });

  registrarLog(req.usuario.id, 'EXCLUIR_CAIXA', `id=${req.params.id}`, req.ip);
  res.json({ mensagem: 'Movimentação removida.' });
}

module.exports = { listar, resumo, relatorioDiario, relatorioMensal, registrar, excluir };
