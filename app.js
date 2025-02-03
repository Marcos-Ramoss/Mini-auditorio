const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');

// Carrega as variáveis de ambiente
dotenv.config();

// Conexão com o MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB', err));

// Configurações do Express
const app = express();
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da sessão
app.use(session({
    secret: process.env.ADMIN_CODE, // Chave secreta para assinar a sessão
    resave: false, // Não salva a sessão se não houver alterações
    saveUninitialized: false, // Não cria sessão até que algo seja armazenado
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI, // URL do MongoDB
        ttl: 14 * 24 * 60 * 60 // Tempo de vida da sessão (14 dias)
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use cookies seguros em produção
        httpOnly: true, // Impede acesso via JavaScript
        maxAge: 14 * 24 * 60 * 60 * 1000 // Duração do cookie (14 dias)
    }
}));

// Middleware para passar o usuário para as views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null; // Passa o usuário para as views
    next();
});

// Importa as rotas
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const reservaRoutes = require('./routes/reservas');
const homeRoutes = require('./routes/home');

// Usa as rotas
app.use('/', homeRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/reservas', reservaRoutes);

// Rota de fallback para erros 404
app.use((req, res) => {
    res.status(404).send('Página não encontrada');
});

// Inicia o servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));