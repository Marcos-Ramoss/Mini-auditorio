const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));
router.get('/', (req, res) => res.render('home'));


router.post('/register', async (req, res) => {
    const { username, password, role, adminCode } = req.body;

    try {
        if (role === 'admin') {
            if (adminCode !== process.env.ADMIN_CODE) {
                return res.status(400).json({ error: 'Código de validação inválido para administrador.' });
            }
        }
        console.log('Código de Admin:', process.env.ADMIN_CODE);
        // Cria um novo usuário no banco de dados
        const user = new User({ username, password, role });
        await user.save();

        // Redireciona para a página de login após o registro bem-sucedido
        res.redirect('/login');

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
});
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        res.redirect(user.role === 'admin' ?  '/reservas' : '/reservas' );
    } else {
        res.redirect('/login');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao destruir a sessão:', err);
            return res.status(500).send('Erro ao fazer logout');
        }
        res.redirect('/'); // Redireciona para a página inicial após o logout
    });
});


module.exports = router;