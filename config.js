/**
 * config.js — Configurações globais da aplicação
 */
module.exports = {
  JWT_SECRET : process.env.JWT_SECRET  || 'segredo_comercial_2026_troque_em_producao',
  JWT_EXPIRA : process.env.JWT_EXPIRA  || '8h',
  PORT       : process.env.PORT        || 3000,
};
