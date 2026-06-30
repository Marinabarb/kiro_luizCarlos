/**
 * server.js — Ponto de entrada da aplicação
 */
const express = require('express');
const path    = require('path');
const { PORT } = require('./config');
const { criarTabelas } = require('./database/schema');

// Garantir que as tabelas existam antes de qualquer requisição
criarTabelas();

const app = express();

// ── Segurança básica: headers ─────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ── Middlewares globais ───────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Arquivos estáticos (frontend) ─────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rotas da API ──────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/usuarios',  require('./routes/usuarios'));
app.use('/api/produtos',  require('./routes/produtos'));
app.use('/api/caixa',     require('./routes/caixa'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ── Rota legada (compatibilidade com v1) ──────────────────
app.use('/movimentacoes', require('./routes/movimentacoes'));

// ── Fallback: SPA ─────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Tratamento de erros global — DEVE vir depois de todas as rotas ──
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERRO]', err.message);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});
