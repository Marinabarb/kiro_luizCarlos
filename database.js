const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'financeiro.db'));

// Criar tabela se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS movimentacoes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao TEXT    NOT NULL,
    valor     REAL    NOT NULL,
    data      TEXT    NOT NULL,
    tipo      TEXT    NOT NULL CHECK(tipo IN ('entrada', 'saida'))
  )
`);

module.exports = db;
