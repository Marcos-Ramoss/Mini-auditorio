const express = require('express');
const router = express.Router();

// Rota para a página inicial
router.get('/', (req, res) => {
    res.render('home'); // Renderiza a view home.ejs
});

module.exports = router;