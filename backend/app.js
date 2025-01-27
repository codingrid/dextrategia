const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');


const app = express();
app.use(cors());
app.use(express.json());

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

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));


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

// Criar admin inicial
const createInitialAdmin = async () => {
  const adminEmail = 'fernando@admin.com';
  const adminPassword = await bcrypt.hash('1234', 10);
  
  db.query('SELECT * FROM users WHERE email = ?', [adminEmail], (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      db.query(
        'INSERT INTO users (name, email, password, is_admin, user_type) VALUES (?, ?, ?, 1, "admin")',
        ['Admin', adminEmail, adminPassword]
      );
    }
  });
};

createInitialAdmin();

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Senha inválida' });

    const token = jwt.sign({ id: user.id, email: user.email, type: user.user_type }, 'seu_secret_key');
    res.json({ token, user_type: user.user_type });
  });
});

// Registro de usuário
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

app.post('/auth/admin', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    db.query(
      'INSERT INTO users (name, email, password, is_admin, user_type) VALUES (?, ?, ?, 1, "admin")',
      [nome, email, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Admin criado com sucesso' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar consultor
app.post('/auth/consultants', async (req, res) => {
  try {
    const { nome, email, senha, especialidade, valor_hora, linkedin_url, pacotes_horas } = req.body;
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    db.query(
      'INSERT INTO users (name, email, password, especialidade, valor_hora, linkedin_url, pacotes_horas, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, "consultor")',
      [nome, email, hashedPassword, especialidade, valor_hora, linkedin_url, JSON.stringify(pacotes_horas)],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Consultor criado com sucesso' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// No app.js, adicione a rota para salvar pagamentos
app.post('/api/payments', (req, res) => {
  const { nome, email, servico, valor_total, forma_pagamento, consultor, data_consulta, hora_consulta } = req.body;
  
  const query = `
      INSERT INTO payments (nome, email, servico, valor_total, forma_pagamento, consultor, data_consulta, hora_consulta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
  const values = [nome, email, servico, valor_total, forma_pagamento, consultor, data_consulta, hora_consulta];
  
  db.query(query, values, (err, result) => {
      if (err) {
          console.error('Erro ao salvar pagamento:', err);
          res.status(500).json({ error: 'Erro ao processar pagamento' });
          return;
      }
      res.json({ success: true, id: result.insertId });
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});