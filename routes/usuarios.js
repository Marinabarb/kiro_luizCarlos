const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/usuariosController');
const { autenticar } = require('../middlewares/auth');
const { autorizar  } = require('../middlewares/autorizar');

// Todas as rotas exigem autenticação
router.use(autenticar);

router.get ('/',           autorizar('ADMIN'), ctrl.listar);
router.get ('/:id',        autorizar('ADMIN'), ctrl.buscarPorId);
router.post('/',           autorizar('ADMIN'), ctrl.criar);
router.put ('/:id',        ctrl.editar);          // admin ou próprio usuário
router.put ('/:id/senha',  ctrl.alterarSenha);    // admin ou próprio usuário
router.delete('/:id',      autorizar('ADMIN'), ctrl.excluir);

module.exports = router;
