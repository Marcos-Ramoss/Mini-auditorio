// middlewares/authMiddleware.js
module.exports = {
    // Verifica se o usuário está autenticado
    isAuthenticated: (req, res, next) => {
        if (req.session.user) {
            return next(); // Usuário autenticado, permite o acesso
        }
        res.redirect('/login'); // Usuário não autenticado, redireciona para o login
    },

    // Verifica se o usuário é um administrador
    isAdmin: (req, res, next) => {
        if (req.session.user && req.session.user.role === 'admin') {
            return next(); // Usuário é admin, permite o acesso
        }
        res.status(403).send('Acesso negado'); // Usuário não é admin, nega o acesso
    }
};