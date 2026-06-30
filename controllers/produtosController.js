/**
 * produtosController.js — CRUD completo de produtos
 */
const db = require('../database/connection');
const { registrarLog } = require('../middlewares/logger');

// GET /api/produtos  (com filtros opcionais: ?busca=&categoria=&estoque_baixo=1)
function listar(req, res) {
  const { busca, categoria, estoque_baixo } = req.query;

  let sql    = 'SELECT * FROM produtos WHERE status = 1';
  const params = [];

  if (busca) {
    sql += ' AND (nome_produto LIKE ? OR codigo_barras LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }
  if (categoria) {
    sql += ' AND categoria = ?';
    params.push(categoria);
  }
  if (estoque_baixo === '1') {
    sql += ' AND quantidade_estoque <= estoque_minimo';
  }

  sql += ' ORDER BY nome_produto';

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
}

// GET /api/produtos/categorias
function listarCategorias(req, res) {
  const rows = db.prepare(`
    SELECT DISTINCT categoria FROM produtos
    WHERE status = 1 AND categoria IS NOT NULL
    ORDER BY categoria
  `).all();
  res.json(rows.map(r => r.categoria));
}

// GET /api/produtos/:id
function buscarPorId(req, res) {
  const p = db.prepare('SELECT * FROM produtos WHERE id = ? AND status = 1').get(req.params.id);
  if (!p) return res.status(404).json({ erro: 'Produto não encontrado.' });
  res.json(p);
}

// POST /api/produtos
function criar(req, res) {
  const {
    nome_produto, codigo_barras, categoria, descricao,
    preco_custo, preco_venda, quantidade_estoque, estoque_minimo, fornecedor,
  } = req.body;

  if (!nome_produto || preco_venda == null) {
    return res.status(400).json({ erro: 'Nome e preço de venda são obrigatórios.' });
  }

  if (codigo_barras) {
    const dup = db.prepare('SELECT id FROM produtos WHERE codigo_barras = ? AND status = 1').get(codigo_barras);
    if (dup) return res.status(409).json({ erro: 'Código de barras já cadastrado.' });
  }

  const result = db.prepare(`
    INSERT INTO produtos
      (nome_produto, codigo_barras, categoria, descricao, preco_custo, preco_venda,
       quantidade_estoque, estoque_minimo, fornecedor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nome_produto.trim(),
    codigo_barras || null,
    categoria     || null,
    descricao     || null,
    parseFloat(preco_custo)        || 0,
    parseFloat(preco_venda),
    parseInt(quantidade_estoque)   || 0,
    parseInt(estoque_minimo)       || 5,
    fornecedor    || null,
  );

  registrarLog(req.usuario.id, 'CRIAR_PRODUTO', `Produto: ${nome_produto}`, req.ip);
  res.status(201).json({ id: result.lastInsertRowid, mensagem: 'Produto cadastrado.' });
}

// PUT /api/produtos/:id
function editar(req, res) {
  const { id } = req.params;
  const p = db.prepare('SELECT id FROM produtos WHERE id = ? AND status = 1').get(id);
  if (!p) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const {
    nome_produto, codigo_barras, categoria, descricao,
    preco_custo, preco_venda, quantidade_estoque, estoque_minimo, fornecedor,
  } = req.body;

  if (codigo_barras) {
    const dup = db.prepare('SELECT id FROM produtos WHERE codigo_barras = ? AND id != ? AND status = 1').get(codigo_barras, id);
    if (dup) return res.status(409).json({ erro: 'Código de barras já em uso.' });
  }

  // Só atualiza campos que foram enviados no body (undefined = não enviado)
  db.prepare(`
    UPDATE produtos SET
      nome_produto       = COALESCE(?, nome_produto),
      codigo_barras      = COALESCE(?, codigo_barras),
      categoria          = COALESCE(?, categoria),
      descricao          = COALESCE(?, descricao),
      preco_custo        = COALESCE(?, preco_custo),
      preco_venda        = COALESCE(?, preco_venda),
      quantidade_estoque = COALESCE(?, quantidade_estoque),
      estoque_minimo     = COALESCE(?, estoque_minimo),
      fornecedor         = COALESCE(?, fornecedor)
    WHERE id = ?
  `).run(
    nome_produto       !== undefined ? nome_produto.trim()           : null,
    codigo_barras      !== undefined ? (codigo_barras || null)       : null,
    categoria          !== undefined ? (categoria     || null)       : null,
    descricao          !== undefined ? (descricao     || null)       : null,
    preco_custo        !== undefined ? parseFloat(preco_custo)       : null,
    preco_venda        !== undefined ? parseFloat(preco_venda)       : null,
    quantidade_estoque !== undefined ? parseInt(quantidade_estoque)  : null,
    estoque_minimo     !== undefined ? parseInt(estoque_minimo)      : null,
    fornecedor         !== undefined ? (fornecedor    || null)       : null,
    id,
  );

  registrarLog(req.usuario.id, 'EDITAR_PRODUTO', `Produto id=${id}`, req.ip);
  res.json({ mensagem: 'Produto atualizado.' });
}

// DELETE /api/produtos/:id  (exclusão lógica)
function excluir(req, res) {
  const result = db.prepare('UPDATE produtos SET status = 0 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });

  registrarLog(req.usuario.id, 'EXCLUIR_PRODUTO', `Produto id=${req.params.id}`, req.ip);
  res.json({ mensagem: 'Produto removido.' });
}

module.exports = { listar, listarCategorias, buscarPorId, criar, editar, excluir };
