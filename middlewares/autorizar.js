/**
 * autorizar.js — Middleware de autorização por tipo de usuário
 * Uso: autorizar('ADMIN') ou autorizar('ADMIN', 'USUARIO_NORMAL')
 */
function autorizar(...tipos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Não autenticado.' });
    }
    if (!tipos.includes(req.usuario.tipo_usuario)) {
      return res.status(403).json({ erro: 'Acesso negado. Permissão insuficiente.' });
    }
    next();
  };
}

module.exports = { autorizar };
