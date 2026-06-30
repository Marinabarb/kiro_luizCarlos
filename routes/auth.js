const express = require('express');
const router  = express.Router();
const { login, logout, cadastrar } = require('../controllers/authController');
const { autenticar }    = require('../middlewares/auth');

router.post('/login',    login);
router.post('/logout',   autenticar, logout);
router.post('/cadastro', cadastrar);   // rota pública — cadastro de novo usuário

module.exports = router;
