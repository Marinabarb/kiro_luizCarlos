/**
 * seed.js — Dados iniciais: admin padrão + produtos de exemplo
 * Executar com: node database/seed.js
 */
const bcrypt = require('bcryptjs');
const db = require('./connection');
const { criarTabelas } = require('./schema');

criarTabelas();

// ── Admin padrão ──────────────────────────────────────────
const adminExiste = db
  .prepare("SELECT id FROM usuarios WHERE email = ?")
  .get('admin@admin.com');

if (!adminExiste) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO usuarios (nome, email, senha, tipo_usuario)
    VALUES (?, ?, ?, 'ADMIN')
  `).run('Administrador', 'admin@admin.com', hash);
  console.log('✅ Admin criado: admin@admin.com / admin123');
} else {
  console.log('ℹ️  Admin já existe, pulando.');
}

// ── Produtos de exemplo ───────────────────────────────────
const produtosExemplo = [
  { nome: 'Caneta Azul', codigo: '7891234560001', cat: 'Papelaria', custo: 0.50, venda: 1.50, estoque: 100, minimo: 20 },
  { nome: 'Caderno 100fls', codigo: '7891234560002', cat: 'Papelaria', custo: 4.00, venda: 9.90, estoque: 50, minimo: 10 },
  { nome: 'Borracha', codigo: '7891234560003', cat: 'Papelaria', custo: 0.30, venda: 0.99, estoque: 3, minimo: 15 },
  { nome: 'Régua 30cm', codigo: '7891234560004', cat: 'Papelaria', custo: 0.80, venda: 2.50, estoque: 30, minimo: 10 },
];

const stmtProd = db.prepare(`
  INSERT OR IGNORE INTO produtos
    (nome_produto, codigo_barras, categoria, preco_custo, preco_venda, quantidade_estoque, estoque_minimo)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

produtosExemplo.forEach(p => {
  stmtProd.run(p.nome, p.codigo, p.cat, p.custo, p.venda, p.estoque, p.minimo);
});
console.log('✅ Produtos de exemplo inseridos.');

console.log('\n🚀 Seed concluído. Execute: npm start');
