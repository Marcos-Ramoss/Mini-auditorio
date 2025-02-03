const express = require('express');
const Reserva = require('../models/Reserva');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.isAuthenticated, async (req, res) => {
    const reservas = await Reserva.find();
    res.render('reservas', { reservas });
});

module.exports = router;