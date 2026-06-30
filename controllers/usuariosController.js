/**
 * usuariosController.js — CRUD de usuários (somente ADMIN)
 */
const bcrypt = require('bcryptjs');
const db     = require('../database/connection');
const { registrarLog } = require('../middlewares/logger');

// GET /api/usuarios
function listar(req, res) {
  const rows = db.prepare(`
    SELECT id, nome, email, telefone, status, tipo_usuario, data_criacao
    FROM usuarios ORDER BY nome
  `).all();
  res.json(rows);
}

// GET /api/usuarios/:id
function buscarPorId(req, res) {
  const u = db.prepare(`
    SELECT id, nome, email, telefone, status, tipo_usuario, data_criacao
    FROM usuarios WHERE id = ?
  `).get(req.params.id);

  if (!u) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.json(u);
}

// POST /api/usuarios
function criar(req, res) {
  const { nome, email, senha, telefone, tipo_usuario } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
  }

  const emailNorm = email.trim().toLowerCase();
  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(emailNorm);
  if (existe) return res.status(409).json({ erro: 'E-mail já cadastrado.' });

  const hash = bcrypt.hashSync(senha, 10);
  const tipo = ['ADMIN','USUARIO_NORMAL'].includes(tipo_usuario) ? tipo_usuario : 'USUARIO_NORMAL';

  const result = db.prepare(`
    INSERT INTO usuarios (nome, email, senha, telefone, tipo_usuario)
    VALUES (?, ?, ?, ?, ?)
  `).run(nome.trim(), emailNorm, hash, telefone || null, tipo);

  registrarLog(req.usuario.id, 'CRIAR_USUARIO', `Usuário criado: ${emailNorm}`, req.ip);

  res.status(201).json({ id: result.lastInsertRowid, mensagem: 'Usuário criado com sucesso.' });
}

// PUT /api/usuarios/:id
function editar(req, res) {
  const { nome, email, telefone, tipo_usuario, status } = req.body;
  const { id } = req.params;

  const u = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(id);
  if (!u) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  // Usuário normal só pode editar a si mesmo
  if (req.usuario.tipo_usuario !== 'ADMIN' && req.usuario.id !== Number(id)) {
    return res.status(403).json({ erro: 'Sem permissão para editar este usuário.' });
  }

  const emailNorm = email ? email.trim().toLowerCase() : null;
  if (emailNorm) {
    const duplicado = db.prepare('SELECT id FROM usuarios WHERE email = ? AND id != ?').get(emailNorm, id);
    if (duplicado) return res.status(409).json({ erro: 'E-mail já em uso por outro usuário.' });
  }

  db.prepare(`
    UPDATE usuarios SET
      nome         = COALESCE(?, nome),
      email        = COALESCE(?, email),
      telefone     = COALESCE(?, telefone),
      tipo_usuario = COALESCE(?, tipo_usuario),
      status       = COALESCE(?, status)
    WHERE id = ?
  `).run(
    nome   ? nome.trim() : null,
    emailNorm,
    telefone !== undefined ? (telefone || null) : null,
    req.usuario.tipo_usuario === 'ADMIN' && tipo_usuario ? tipo_usuario : null,
    req.usuario.tipo_usuario === 'ADMIN' && status != null ? Number(status) : null,
    id
  );

  registrarLog(req.usuario.id, 'EDITAR_USUARIO', `Usuário editado: id=${id}`, req.ip);
  res.json({ mensagem: 'Usuário atualizado.' });
}

// PUT /api/usuarios/:id/senha
function alterarSenha(req, res) {
  const { senha_atual, nova_senha } = req.body;
  const { id } = req.params;

  if (req.usuario.tipo_usuario !== 'ADMIN' && req.usuario.id !== Number(id)) {
    return res.status(403).json({ erro: 'Sem permissão.' });
  }

  if (!nova_senha || nova_senha.length < 6) {
    return res.status(400).json({ erro: 'Nova senha deve ter ao menos 6 caracteres.' });
  }

  const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  if (!u) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  // Admin pode trocar sem informar senha atual; usuário normal precisa confirmar
  if (req.usuario.tipo_usuario !== 'ADMIN') {
    if (!senha_atual || !bcrypt.compareSync(senha_atual, u.senha)) {
      return res.status(401).json({ erro: 'Senha atual incorreta.' });
    }
  }

  const hash = bcrypt.hashSync(nova_senha, 10);
  db.prepare('UPDATE usuarios SET senha = ? WHERE id = ?').run(hash, id);

  registrarLog(req.usuario.id, 'ALTERAR_SENHA', `Senha alterada: id=${id}`, req.ip);
  res.json({ mensagem: 'Senha alterada com sucesso.' });
}

// DELETE /api/usuarios/:id  (exclusão lógica)
function excluir(req, res) {
  const { id } = req.params;

  if (req.usuario.id === Number(id)) {
    return res.status(400).json({ erro: 'Você não pode desativar sua própria conta.' });
  }

  const result = db.prepare('UPDATE usuarios SET status = 0 WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  registrarLog(req.usuario.id, 'DESATIVAR_USUARIO', `Usuário desativado: id=${id}`, req.ip);
  res.json({ mensagem: 'Usuário desativado.' });
}

module.exports = { listar, buscarPorId, criar, editar, alterarSenha, excluir };
