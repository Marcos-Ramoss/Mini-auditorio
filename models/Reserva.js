const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
    nomeEvento: { type: String, required: true },
    data: { type: Date, required: true },
    horario: { type: String, required: true },
    turno: { type: String, required: true },
    responsavel: { type: String, required: true },
    diaSemana: { type: String, required: true },
    dataEmail: { type: Date, default: null }, // Opcional
    materiais: [{ nome: String, quantidade: Number }], // Opcional
    cursoOuSetor: { type: String, default: null }, // Campo opcional com valor padrão null
}, { timestamps: true });

module.exports = mongoose.model('Reserva', reservaSchema);