const express = require('express');
const router  = express.Router();
const { login, logout } = require('../controllers/authController');
const { autenticar }    = require('../middlewares/auth');

router.post('/login',  login);
router.post('/logout', autenticar, logout);

module.exports = router;
