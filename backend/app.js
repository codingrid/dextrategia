const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const path = require('path');
const cors = require('cors'); // Adiciona a importação do módulo 'cors'
const app = express();
const port = 5000;

app.use(cors()); // Adiciona o middleware 'cors'
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Configuração do banco de dados
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'dextrategia'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados.');
});

// Função para determinar o tipo de usuário com base no email
const getUserTypeByEmail = (email) => {
    if (email.endsWith('@admin.com')) {
        return 'admin';
    } else if (email.endsWith('@consult.com')) {
        return 'consultant';
    } else {
        return 'user';
    }
};

// Rota para registrar um novo usuário
app.post('/auth/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const userType = getUserTypeByEmail(email);

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao criptografar a senha.' });
        }

        const query = 'INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, ?)';
        db.query(query, [name, email, hashedPassword, userType], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao registrar usuário no banco de dados.' });
            }

            return res.status(201).json({
                message: 'Registro bem-sucedido!',
                redirectUrl: `/frontend/${userType}-dashboard.html`,
            });
        });
    });
});

// Rota de login
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar usuário no banco de dados.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao verificar a senha.' });
            }

            if (!isMatch) {
                return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
            }

            res.json({
                message: 'Login bem-sucedido!',
                userType: user.user_type,
                redirectUrl: `/frontend/${user.user_type}-dashboard.html`,
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});