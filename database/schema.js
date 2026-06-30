/**
 * schema.js — Criação de todas as tabelas do sistema
 * Executado automaticamente ao iniciar o servidor.
 */
const db = require('./connection');

function criarTabelas() {
  db.exec(`
    -- ─────────────────────────────────────────
    -- USUÁRIOS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS usuarios (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE,
      senha         TEXT    NOT NULL,
      telefone      TEXT,
      status        INTEGER NOT NULL DEFAULT 1,        -- 1=ativo, 0=inativo
      tipo_usuario  TEXT    NOT NULL DEFAULT 'USUARIO_NORMAL'
                            CHECK(tipo_usuario IN ('ADMIN','USUARIO_NORMAL')),
      data_criacao  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ─────────────────────────────────────────
    -- PRODUTOS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS produtos (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_produto      TEXT    NOT NULL,
      codigo_barras     TEXT    UNIQUE,
      categoria         TEXT,
      descricao         TEXT,
      preco_custo       REAL    NOT NULL DEFAULT 0,
      preco_venda       REAL    NOT NULL DEFAULT 0,
      quantidade_estoque INTEGER NOT NULL DEFAULT 0,
      estoque_minimo    INTEGER NOT NULL DEFAULT 5,
      fornecedor        TEXT,
      data_cadastro     TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      status            INTEGER NOT NULL DEFAULT 1     -- 1=ativo, 0=inativo
    );

    -- ─────────────────────────────────────────
    -- FLUXO DE CAIXA
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS caixa (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_movimentacao   TEXT    NOT NULL CHECK(tipo_movimentacao IN ('entrada','saida')),
      descricao           TEXT    NOT NULL,
      valor               REAL    NOT NULL,
      categoria           TEXT    NOT NULL DEFAULT 'outros',
      forma_pagamento     TEXT    NOT NULL DEFAULT 'dinheiro',
      usuario_responsavel INTEGER NOT NULL REFERENCES usuarios(id),
      data_movimentacao   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ─────────────────────────────────────────
    -- LOGS DE AÇÕES
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id  INTEGER REFERENCES usuarios(id),
      acao        TEXT    NOT NULL,
      detalhes    TEXT,
      ip          TEXT,
      data_hora   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `);
}

module.exports = { criarTabelas };
