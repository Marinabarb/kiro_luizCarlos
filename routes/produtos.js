const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/produtosController');
const { autenticar } = require('../middlewares/auth');
const { autorizar  } = require('../middlewares/autorizar');

router.use(autenticar);

router.get ('/categorias',  ctrl.listarCategorias);
router.get ('/',            ctrl.listar);
router.get ('/:id',         ctrl.buscarPorId);
router.post('/',            autorizar('ADMIN'), ctrl.criar);
router.put ('/:id',         autorizar('ADMIN'), ctrl.editar);
router.delete('/:id',       autorizar('ADMIN'), ctrl.excluir);

module.exports = router;
