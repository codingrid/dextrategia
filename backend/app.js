const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Configuração do Banco de Dados
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

// Configuração do nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ingridlimapt@gmail.com',
        pass: 'nhdo xpoy sdwt ouck' // Substitua pela senha de app do Gmail
    }
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, 'seu_secret_key', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Rotas de Autenticação
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            db.query('SELECT * FROM consultants WHERE email = ?', [email], async (err, consultResults) => {
                if (err) return res.status(500).json({ error: err.message });
                if (consultResults.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

                const consultant = consultResults[0];
                const validPassword = await bcrypt.compare(password, consultant.password);
                if (!validPassword) return res.status(401).json({ error: 'Senha inválida' });

                const token = jwt.sign(
                    { id: consultant.id, email: consultant.email, type: 'consultant' }, 
                    'seu_secret_key'
                );
                res.json({ token, user_type: 'consultant' });
            });
            return;
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Senha inválida' });

        const token = jwt.sign(
            { id: user.id, email: user.email, type: user.user_type }, 
            'seu_secret_key'
        );
        res.json({ token, user_type: user.user_type });
    });
});

app.post('/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!email.match(/@(gmail\.com|hotmail\.com|outlook\.com)$/)) {
        return res.status(400).json({ error: 'Domínio de email não permitido' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.query(
        'INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, "user")',
        [name, email, hashedPassword],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Usuário registrado com sucesso' });
        }
    );
});

// Rotas de Consultores
app.get('/api/consultants', authenticateToken, (req, res) => {
    db.query(
        'SELECT id, name, email, especialidade, valor_hora, linkedin_url FROM consultants',
        (err, results) => {
            if (err) {
                console.error('Erro ao listar consultores:', err);
                return res.status(500).json({ error: 'Erro ao listar consultores' });
            }
            res.json(results);
        }
    );
});

app.post('/auth/consultants', async (req, res) => {
    try {
        const { name, email, password, especialidade, valor_hora, linkedin_url } = req.body;
        
        if (!email.endsWith('@consult.admin')) {
            return res.status(400).json({ error: 'Email deve terminar com @consult.admin' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query(
            'INSERT INTO consultants (name, email, password, especialidade, valor_hora, linkedin_url) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, especialidade, valor_hora, linkedin_url],
            (err, result) => {
                if (err) {
                    console.error('Erro ao criar consultor:', err);
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: 'Consultor criado com sucesso' });
            }
        );
    } catch (error) {
        console.error('Erro ao criar consultor:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rotas de Agendamentos
app.post('/api/agendamentos', async (req, res) => {
    const {
        nome,
        email,
        tipo_servico,
        consultor,
        data_consulta,
        hora_consulta,
        tipo_reuniao,
        descricao,
        valor
    } = req.body;

    try {
        const query = `
            INSERT INTO agendamentos 
            (nome, email, tipo_servico, consultor, data_consulta, 
             hora_consulta, tipo_reuniao, descricao, valor) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [
            nome, email, tipo_servico, consultor, data_consulta,
            hora_consulta, tipo_reuniao, descricao, valor
        ], (err, result) => {
            if (err) {
                console.error('Erro ao salvar agendamento:', err);
                return res.status(500).json({ error: 'Erro ao salvar agendamento' });
            }
            
            res.json({ 
                success: true, 
                id: result.insertId,
                message: 'Agendamento criado com sucesso'
            });
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota de Pagamentos
app.post('/api/payments', (req, res) => {
    const {
        nome,
        email,
        servico,
        valor_total,
        forma_pagamento,
        consultor,
        data_consulta,
        hora_consulta,
        agendamento_id
    } = req.body;

    const query = `
        INSERT INTO payments 
        (nome, email, servico, valor_total, forma_pagamento, consultor, 
         data_consulta, hora_consulta, agendamento_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmado')
    `;

    db.query(query, [
        nome,
        email,
        servico,
        valor_total,
        forma_pagamento,
        consultor,
        data_consulta,
        hora_consulta,
        agendamento_id
    ], async (err, result) => {
        if (err) {
            console.error('Erro ao salvar pagamento:', err);
            return res.status(500).json({ error: 'Erro ao processar pagamento' });
        }

        // Configuração do email
        const mailOptions = {
            from: 'estudosdeingrid@gmail.com',
            to: email,
            subject: 'Confirmação de Agendamento - Dextrategia',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Confirmação de Agendamento</h2>
                    <p>Olá ${nome},</p>
                    <p>Seu agendamento foi confirmado com sucesso!</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3>Detalhes do Agendamento:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Serviço:</strong> ${servico}</li>
                            <li><strong>Consultor:</strong> ${consultor}</li>
                            <li><strong>Data:</strong> ${new Date(data_consulta).toLocaleDateString()}</li>
                            <li><strong>Horário:</strong> ${hora_consulta}</li>
                            <li><strong>Valor:</strong> €${valor_total}</li>
                            <li><strong>Forma de Pagamento:</strong> ${forma_pagamento}</li>
                        </ul>
                    </div>

                    <p>Caso tenha alguma dúvida, entre em contato conosco.</p>
                    <p>Atenciosamente,<br>Equipe Dextrategia</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            res.json({ 
                success: true, 
                id: result.insertId,
                message: 'Pagamento processado e email enviado com sucesso'
            });
        } catch (emailError) {
            console.error('Erro ao enviar email:', emailError);
            res.json({ 
                success: true, 
                id: result.insertId,
                warning: 'Pagamento processado mas houve erro ao enviar email'
            });
        }
    });
});

// Rotas de arquivos estáticos
app.get('/frontend/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/frontend/user-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/user-dashboard.html'));
});

app.get('/frontend/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin-dashboard.html'));
});

app.get('/frontend/admin.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.css'));
});

app.get('/frontend/images/dextrategia_logo.png', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/images/dextrategia_logo.png'));
});

app.get('/frontend/agendar-consulta.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/agendar-consulta.html'));
});

app.get('/frontend/agendar.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/agendar.css'));
});

app.get('/frontend/agendar.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/agendar.js'));
});

app.get('/frontend/pagamentos.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pagamentos.html'));
});

app.get('/frontend/pagamentos.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pagamentos.css'));
});

app.get('/frontend/pagamentos.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pagamentos.js'));
});

app.get('/frontend/confirmacao.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/confirmacao.html'));
});

app.get('/frontend/images/background.png', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/images/background.png'));
});

app.get('/frontend/consultant-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/consultant-dashboard.html'));
});

app.get('/frontend/admin.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '../frontend/admin.js'));
});

// Inicialização do servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});