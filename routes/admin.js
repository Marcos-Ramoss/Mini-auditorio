const express = require('express');
const router = express.Router();
const Reserva = require('../models/Reserva');
const authMiddleware = require('../middlewares/authMiddleware');
const moment = require('moment-timezone');

// Função para calcular o dia da semana
function getDayOfWeek(dateString) {
    const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Mês começa em 0 (janeiro = 0)
    return daysOfWeek[date.getDay()];
}

// Função para converter data para o fuso horário local
function convertToLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // Cria uma data no fuso horário local
    return localDate;
}

function parseDateToManaus(dateString) {
    const parsedDate = moment.tz(dateString, 'America/Manaus'); // Converte para o fuso horário de Manaus
    if (!parsedDate.isValid()) {
        throw new Error('Data inválida');
    }
    return parsedDate.toDate(); // Retorna como objeto Date (UTC)
}

// Rota para a página de admin (apenas para administradores)
router.get('/', authMiddleware.isAuthenticated, authMiddleware.isAdmin, (req, res) => {
    res.render('admin');
});




// Rota para processar o envio do formulário de reserva
// Rota para processar o envio do formulário de reserva
router.post('/reservas', authMiddleware.isAuthenticated, authMiddleware.isAdmin, async (req, res) => {
    try {
        const { nomeEvento, data, turno, horario, responsavel, diaSemana, dataEmail, materiais, cursoOuSetor } = req.body;

        // Validação básica dos campos obrigatórios
        if (!nomeEvento || !data || !turno || !horario || !responsavel) {
            return res.status(400).json({ success: false, message: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }

        // Converte a data para o fuso horário de Manaus
        let parsedData;
        try {
            parsedData = parseDateToManaus(data); // Converte para o fuso horário de Manaus
        } catch (error) {
            return res.status(400).json({ success: false, message: 'A data fornecida é inválida.' });
        }

        // Verifica se já existe uma reserva com a mesma data e horário
        const reservaExistente = await Reserva.findOne({
            data: parsedData,
            horario: horario.trim(),
        });

        if (reservaExistente) {
            return res.status(400).json({
                success: false,
                message: 'Já existe uma reserva para esta data e horário.',
            });
        }

        // Valida o formato da dataEmail (se fornecida)
        let parsedDataEmail;
        if (dataEmail) {
            try {
                parsedDataEmail = parseDateToManaus(dataEmail); // Converte para o fuso horário de Manaus
            } catch (error) {
                return res.status(400).json({ success: false, message: 'A data de recebimento do email é inválida.' });
            }
        }

        // Converte materiais para o formato correto (se fornecidos)
        let parsedMateriais = [];
        if (materiais && materiais.nome && materiais.quantidade) {
            parsedMateriais = Array.isArray(materiais.nome)
                ? materiais.nome.map((nome, index) => ({
                      nome: nome.trim(),
                      quantidade: parseInt(materiais.quantidade[index], 10),
                  }))
                : [{ nome: materiais.nome.trim(), quantidade: parseInt(materiais.quantidade, 10) }];

            // Valida os materiais
            const isValid = parsedMateriais.every(material => material.nome && material.quantidade > 0);
            if (!isValid) {
                return res.status(400).json({ success: false, message: 'Os materiais devem ter nome e quantidade válida.' });
            }
        }

        // Cria uma nova reserva no banco de dados
        const novaReserva = new Reserva({
            nomeEvento,
            data: parsedData, // Data convertida para UTC
            turno,
            horario,
            responsavel,
            diaSemana: diaSemana || getDayOfWeek(data), // Calcula automaticamente se não for fornecido
            dataEmail: parsedDataEmail || undefined, // Pode ser undefined
            materiais: parsedMateriais.length > 0 ? parsedMateriais : [], // Pode ser um array vazio
            cursoOuSetor: cursoOuSetor || null, // Salva como null se não for fornecido
        });

        await novaReserva.save();

        // Retorna uma resposta de sucesso
        res.status(201).json({ success: true, message: 'Reserva adicionada com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar reserva:', error);
        res.status(500).json({ success: false, message: 'Erro ao adicionar reserva.' });
    }
});

// Rota GET para carregar os dados da reserva para edição
router.get('/editar-reserva/:id', authMiddleware.isAuthenticated, authMiddleware.isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const reserva = await Reserva.findById(id);
        if (!reserva) {
            return res.status(404).send('Reserva não encontrada.');
        }
        // Renderiza a página de edição com os dados da reserva
        res.render('editar-reserva', { reserva, user: req.user });
    } catch (error) {
        console.error('Erro ao carregar página de edição:', error);
        res.status(500).send('Erro ao carregar página de edição.');
    }
});




// Rota para editar os dados da reserva (PUT)
// Rota para editar os dados da reserva (PUT)
router.put('/reservas/:id', authMiddleware.isAuthenticated, authMiddleware.isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nomeEvento, data, horario, turno, responsavel, diaSemana, dataEmail, materiais, cursoOuSetor } = req.body;

        // Validação básica dos campos obrigatórios
        if (!nomeEvento || !data || !horario || !turno || !responsavel) {
            return res.status(400).json({ success: false, message: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }

        // Converte a data para o fuso horário de Manaus
        let parsedData;
        try {
            parsedData = parseDateToManaus(data); // Converte para o fuso horário de Manaus
        } catch (error) {
            return res.status(400).json({ success: false, message: 'A data fornecida é inválida.' });
        }

        // Verifica se já existe uma reserva com a mesma data e horário (ignorando a própria reserva)
        const reservaExistente = await Reserva.findOne({
            _id: { $ne: id }, // Ignora a reserva atual
            data: parsedData,
            horario: horario.trim(),
        });

        if (reservaExistente) {
            return res.status(400).json({
                success: false,
                message: 'Já existe uma reserva para esta data e horário.',
            });
        }

        // Valida o formato da dataEmail (se fornecida)
        let parsedDataEmail;
        if (dataEmail) {
            try {
                parsedDataEmail = parseDateToManaus(dataEmail); // Converte para o fuso horário de Manaus
            } catch (error) {
                return res.status(400).json({ success: false, message: 'A data de recebimento do email é inválida.' });
            }
        }

        // Converte materiais para o formato correto (se fornecidos)
        let parsedMateriais = [];
        if (materiais && materiais.nome && materiais.quantidade) {
            parsedMateriais = Array.isArray(materiais.nome)
                ? materiais.nome.map((nome, index) => ({
                      nome: nome.trim(),
                      quantidade: parseInt(materiais.quantidade[index], 10),
                  }))
                : [{ nome: materiais.nome.trim(), quantidade: parseInt(materiais.quantidade, 10) }];

            // Valida os materiais
            const isValid = parsedMateriais.every(material => material.nome && material.quantidade > 0);
            if (!isValid) {
                return res.status(400).json({ success: false, message: 'Os materiais devem ter nome e quantidade válida.' });
            }
        }

        // Atualiza a reserva no banco de dados
        const updatedReserva = await Reserva.findByIdAndUpdate(
            id,
            {
                nomeEvento,
                data: parsedData, // Data convertida para UTC
                horario,
                turno,
                responsavel,
                diaSemana,
                dataEmail: parsedDataEmail || undefined, // Pode ser undefined
                materiais: parsedMateriais.length > 0 ? parsedMateriais : [], // Pode ser um array vazio
                cursoOuSetor: cursoOuSetor || null, // Salva como null se não for fornecido
            },
            { new: true }
        );

        if (!updatedReserva) {
            return res.status(404).json({ success: false, message: 'Reserva não encontrada.' });
        }

        res.json({ success: true, message: 'Reserva atualizada com sucesso!', reserva: updatedReserva });
    } catch (error) {
        console.error('Erro ao atualizar reserva:', error);
        res.status(500).json({ success: false, message: 'Erro ao atualizar reserva.' });
    }
});


// Rota para excluir uma reserva
router.delete('/reservas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Reserva.findByIdAndDelete(id);
        res.json({ success: true, message: 'Reserva excluída com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao excluir reserva.' });
    }
});

// Rota para atualizar uma reserva
router.put('/reservas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedReserva = await Reserva.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedReserva) {
            return res.status(404).json({ success: false, message: 'Reserva não encontrada.' });
        }

        res.json({ success: true, reserva: updatedReserva });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao atualizar reserva.' });
    }
});

module.exports = router;