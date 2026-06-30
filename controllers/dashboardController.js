/**
 * dashboardController.js — Dados consolidados para o painel inicial
 */
const db = require('../database/connection');

// GET /api/dashboard
function obter(req, res) {
  const hoje = new Date().toISOString().slice(0, 10);

  // Saldo geral
  const saldoGeral = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo_movimentacao='entrada' THEN valor ELSE 0 END), 0) AS entradas,
      COALESCE(SUM(CASE WHEN tipo_movimentacao='saida'   THEN valor ELSE 0 END), 0) AS saidas
    FROM caixa
  `).get();

  // Vendas do dia
  const vendasHoje = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) AS total
    FROM caixa
    WHERE tipo_movimentacao = 'entrada'
      AND categoria = 'vendas'
      AND date(data_movimentacao) = ?
  `).get(hoje);

  // Produtos
  const totalProdutos = db.prepare(
    "SELECT COUNT(*) AS total FROM produtos WHERE status = 1"
  ).get();

  const estoqueBaixo = db.prepare(`
    SELECT COUNT(*) AS total FROM produtos
    WHERE status = 1 AND quantidade_estoque <= estoque_minimo
  `).get();

  // Últimas 8 movimentações
  const ultimasMovs = db.prepare(`
    SELECT c.*, u.nome AS nome_usuario
    FROM caixa c
    LEFT JOIN usuarios u ON u.id = c.usuario_responsavel
    ORDER BY c.data_movimentacao DESC, c.id DESC
    LIMIT 8
  `).all();

  // Gráfico: últimos 7 dias
  const grafico = db.prepare(`
    SELECT
      date(data_movimentacao) AS dia,
      SUM(CASE WHEN tipo_movimentacao='entrada' THEN valor ELSE 0 END) AS entradas,
      SUM(CASE WHEN tipo_movimentacao='saida'   THEN valor ELSE 0 END) AS saidas
    FROM caixa
    WHERE date(data_movimentacao) >= date('now','-6 days')
    GROUP BY dia
    ORDER BY dia
  `).all();

  res.json({
    saldo          : saldoGeral.entradas - saldoGeral.saidas,
    total_entradas : saldoGeral.entradas,
    total_saidas   : saldoGeral.saidas,
    vendas_hoje    : vendasHoje.total,
    total_produtos : totalProdutos.total,
    estoque_baixo  : estoqueBaixo.total,
    ultimas_movs   : ultimasMovs,
    grafico_7dias  : grafico,
  });
}

module.exports = { obter };
