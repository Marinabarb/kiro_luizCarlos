/**
 * connection.js — Instância única do banco SQLite (Singleton)
 */
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'comercial.db'));

// Habilitar chaves estrangeiras
db.pragma('foreign_keys = ON');
// Melhor performance em escritas
db.pragma('journal_mode = WAL');

module.exports = db;
