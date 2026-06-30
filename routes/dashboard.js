const express = require('express');
const router  = express.Router();
const { obter } = require('../controllers/dashboardController');
const { autenticar } = require('../middlewares/auth');

router.use(autenticar);
router.get('/', obter);

module.exports = router;
