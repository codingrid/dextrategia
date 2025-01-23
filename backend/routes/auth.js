const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Banco de dados

// Rota para registrar um novo usuário
app.post('/auth/register', (req, res) => {
    const { name, email, password } = req.body;

    // Verificar se o e-mail já existe
    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkQuery, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao verificar e-mail no banco de dados' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'E-mail já cadastrado!' });
        }

        // Criptografar a senha e inserir o usuário
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao criptografar a senha' });
            }

            const insertQuery = 'INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)';
            const userType = getUserTypeByEmail(email);

            db.query(insertQuery, [name, email, hashedPassword, userType], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao registrar usuário no banco de dados' });
                }

                res.status(201).json({ message: 'Usuário registrado com sucesso!', redirectUrl: `frontend/${userType}-dashboard.html` });
            });
        });
    });
});


// Rota para login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Consultar no banco
        const [user] = await db.query('SELECT * FROM USERS WHERE email = ? AND password = ?', [email, password]);
        if (user) {
            res.json({ message: 'Login bem-sucedido!', userType: user.userType });
        } else {
            res.status(401).json({ message: 'Credenciais inválidas.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao fazer login.' });
    }
});

module.exports = router;
