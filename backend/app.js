const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const nodemailer = require('nodemailer');
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

// Rota para criar consultor
app.post('/auth/consultants', async (req, res) => {
  try {
      const { name, email, password, especialidade, valor_hora, linkedin_url } = req.body;
      
      if (!email.endsWith('@consult.admin')) {
          return res.status(400).json({ error: 'Email deve terminar com @consult.admin' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Query simplificada sem user_id
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




// Rota PUT - Atualizar consultor
app.put('/api/consultants/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, especialidade, valor_hora, linkedin_url, pacotes_horas, password } = req.body;

  try {
      let query = 'UPDATE consultants SET name = ?, especialidade = ?, valor_hora = ?, linkedin_url = ?, pacotes_horas = ?'; // Mudado de users para consultants
      let params = [name, especialidade, valor_hora, linkedin_url, JSON.stringify(pacotes_horas)];

      if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          query += ', password = ?';
          params.push(hashedPassword);
      }

      query += ' WHERE id = ?'; // Removido o filtro de user_type
      params.push(id);

      db.query(query, params, (err, result) => {
          if (err) {
              console.error('Erro ao atualizar consultor:', err);
              return res.status(500).json({ error: 'Erro ao atualizar consultor' });
          }
          res.json({ message: 'Consultor atualizado com sucesso' });
      });
  } catch (error) {
      console.error('Erro ao atualizar consultor:', error);
      res.status(500).json({ error: 'Erro ao atualizar consultor' });
  }
});

// Rota DELETE - Excluir consultor
app.delete('/api/consultants/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.query(
      'DELETE FROM consultants WHERE id = ?', // Mudado de users para consultants e removido user_type
      [id],
      (err, result) => {
          if (err) {
              console.error('Erro ao excluir consultor:', err);
              return res.status(500).json({ error: 'Erro ao excluir consultor' });
          }
          res.json({ message: 'Consultor excluído com sucesso' });
      }
  );
});










app.post('/api/admin/create', authenticateToken, async (req, res) => {
    const { name, email, password } = req.body;

    if (!email.endsWith('@admin.com')) {
        return res.status(400).json({ error: 'Email deve terminar com @admin.com' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query(
            'INSERT INTO users (name, email, password, is_admin, user_type) VALUES (?, ?, ?, 1, "admin")',
            [name, email, hashedPassword],
            (err, result) => {
                if (err) {
                    console.error('Erro ao criar administrador:', err);
                    return res.status(500).json({ error: 'Erro ao criar administrador' });
                }
                res.status(201).json({ 
                    id: result.insertId,
                    name,
                    email
                });
            }
        );
    } catch (error) {
        console.error('Erro ao criar administrador:', error);
        res.status(500).json({ error: 'Erro ao criar administrador' });
    }
});

app.get('/api/meetings/recent', authenticateToken, (req, res) => {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    db.query(
        `SELECT p.*, u.name as consultant_name 
         FROM payments p 
         JOIN users u ON p.consultor = u.name 
         WHERE p.data_consulta >= ?
         ORDER BY p.data_consulta DESC`,
        [fifteenDaysAgo.toISOString().split('T')[0]],
        (err, results) => {
            if (err) {
                console.error('Erro ao listar reuniões:', err);
                return res.status(500).json({ error: 'Erro ao listar reuniões' });
            }
            res.json(results);
        }
    );
});





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
// Listar todos os consultores


// Configuração do nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'estudosdeingrid@gmail.com', // Substitua pelo seu email
        pass: 'ingrideff' // Use uma senha de aplicativo do Gmail
    }
});

// Rota para criar agendamento
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
  ], (err, result) => {
      if (err) {
          console.error('Erro ao salvar pagamento:', err);
          return res.status(500).json({ error: 'Erro ao processar pagamento' });
      }
      
      // Se o pagamento foi salvo com sucesso, envia o email de confirmação
      const mailOptions = {
          from: 'seu-email@gmail.com', // Substitua pelo seu email
          to: email,
          subject: 'Confirmação de Pagamento - Dextrategia',
          html: `
              <h2>Confirmação de Pagamento</h2>
              <p>Olá ${nome},</p>
              <p>Seu pagamento foi confirmado com sucesso!</p>
              <p><strong>Detalhes:</strong></p>
              <ul>
                  <li>Serviço: ${servico}</li>
                  <li>Consultor: ${consultor}</li>
                  <li>Data: ${new Date(data_consulta).toLocaleDateString()}</li>
                  <li>Hora: ${hora_consulta}</li>
                  <li>Valor: €${valor_total}</li>
                  <li>Forma de Pagamento: ${forma_pagamento}</li>
              </ul>
              <p>Agradecemos sua preferência!</p>
          `
      };

      transporter.sendMail(mailOptions, (emailErr) => {
          if (emailErr) {
              console.error('Erro ao enviar email:', emailErr);
              // Ainda retornamos sucesso pois o pagamento foi processado
              return res.json({ 
                  success: true, 
                  id: result.insertId, 
                  warning: 'Pagamento processado mas houve erro ao enviar email' 
              });
          }
          res.json({ success: true, id: result.insertId });
      });
  });
});

// Rota para enviar email de confirmação
app.post('/api/send-confirmation-email', async (req, res) => {
  const {
      nome,
      email,
      servico,
      valor_total,
      forma_pagamento,
      consultor,
      data_consulta,
      hora_consulta
  } = req.body;

  const mailOptions = {
      from: 'ingridextra@gmail.com', // Substitua pelo seu email
      to: email,
      subject: 'Confirmação de Agendamento - Dextrategia',
      html: `
          <h2>Confirmação de Agendamento</h2>
          <p>Olá ${nome},</p>
          <p>Seu agendamento foi confirmado com sucesso!</p>
          <p><strong>Detalhes:</strong></p>
          <ul>
              <li>Serviço: ${servico}</li>
              <li>Consultor: ${consultor}</li>
              <li>Data: ${new Date(data_consulta).toLocaleDateString()}</li>
              <li>Hora: ${hora_consulta}</li>
              <li>Valor: €${valor_total}</li>
              <li>Forma de Pagamento: ${forma_pagamento}</li>
          </ul>
          <p>Agradecemos sua preferência!</p>
          <p>Equipe Dextrategia</p>
      `
  };

  try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'Email enviado com sucesso' });
  } catch (error) {
      console.error('Erro ao enviar email:', error);
      res.status(500).json({ error: 'Erro ao enviar email de confirmação' });
  }
});


// Rota para processar pagamento e enviar email
app.post('/api/send-confirmation-email', async (req, res) => {
  const {
      nome,
      email,
      servico,
      valor_total,
      forma_pagamento,
      consultor,
      data_consulta,
      hora_consulta
  } = req.body;

  const mailOptions = {
      from: 'dextra@gmail.com', // Substitua pelo seu email
      to: email,
      subject: 'Confirmação de Agendamento - Dextrategia',
      html: `
          <h2>Confirmação de Agendamento</h2>
          <p>Olá ${nome},</p>
          <p>Seu agendamento foi confirmado com sucesso!</p>
          <p><strong>Detalhes:</strong></p>
          <ul>
              <li>Serviço: ${servico}</li>
              <li>Consultor: ${consultor}</li>
              <li>Data: ${new Date(data_consulta).toLocaleDateString()}</li>
              <li>Hora: ${hora_consulta}</li>
              <li>Valor: €${valor_total}</li>
              <li>Forma de Pagamento: ${forma_pagamento}</li>
          </ul>
          <p>Agradecemos sua preferência!</p>
          <p>Equipe Dextrategia</p>
      `
  };

  try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'Email enviado com sucesso' });
  } catch (error) {
      console.error('Erro ao enviar email:', error);
      res.status(500).json({ error: 'Erro ao enviar email de confirmação' });
  }
});

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
  
  // Primeiro tenta encontrar na tabela users
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Se não encontrou em users, procura em consultants
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

    // Caso tenha encontrado em users, continua com a lógica existente
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