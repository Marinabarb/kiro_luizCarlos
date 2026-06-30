const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/caixaController');
const { autenticar } = require('../middlewares/auth');
const { autorizar  } = require('../middlewares/autorizar');

router.use(autenticar);

router.get ('/resumo',            ctrl.resumo);
router.get ('/relatorio/diario',  ctrl.relatorioDiario);
router.get ('/relatorio/mensal',  ctrl.relatorioMensal);
router.get ('/',                  ctrl.listar);
router.post('/',                  ctrl.registrar);
router.delete('/:id',             autorizar('ADMIN'), ctrl.excluir);

module.exports = router;
