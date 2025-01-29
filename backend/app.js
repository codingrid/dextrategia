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

// Rota para buscar informações do consultor
app.get('/api/consultant/info', authenticateToken, (req, res) => {
  db.query(
      'SELECT id, name, especialidade, valor_hora FROM consultants WHERE id = ?',
      [req.user.id],
      (err, results) => {
          if (err) {
              console.error('Erro ao buscar informações do consultor:', err);
              return res.status(500).json({ error: 'Erro ao buscar informações' });
          }
          if (results.length === 0) {
              return res.status(404).json({ error: 'Consultor não encontrado' });
          }
          res.json(results[0]);
      }
  );
});

// Rota para buscar disponibilidade do consultor
app.get('/api/consultant/availability', authenticateToken, (req, res) => {
  db.query(
      'SELECT * FROM availability WHERE consultor_id = ? AND data_disponivel >= CURRENT_DATE ORDER BY data_disponivel, hora_disponivel',
      [req.user.id],
      (err, results) => {
          if (err) {
              console.error('Erro ao buscar disponibilidade:', err);
              return res.status(500).json({ error: 'Erro ao buscar disponibilidade' });
          }
          res.json(results);
      }
  );
});

// Rota para buscar disponibilidade por data específica
app.get('/api/consultant/availability/:date', authenticateToken, (req, res) => {
  db.query(
      'SELECT * FROM availability WHERE consultor_id = ? AND data_disponivel = ? ORDER BY hora_disponivel',
      [req.user.id, req.params.date],
      (err, results) => {
          if (err) {
              console.error('Erro ao buscar horários:', err);
              return res.status(500).json({ error: 'Erro ao buscar horários' });
          }
          res.json(results);
      }
  );
});

// Rota para salvar disponibilidade
app.post('/api/consultant/availability', authenticateToken, (req, res) => {
  const { date, times } = req.body;
  
  db.beginTransaction(err => {
      if (err) {
          console.error('Erro ao iniciar transação:', err);
          return res.status(500).json({ error: 'Erro ao salvar disponibilidade' });
      }

      // Primeiro, remove a disponibilidade existente para a data
      db.query(
          'DELETE FROM availability WHERE consultor_id = ? AND data_disponivel = ?',
          [req.user.id, date],
          (err) => {
              if (err) {
                  return db.rollback(() => {
                      res.status(500).json({ error: 'Erro ao atualizar disponibilidade' });
                  });
              }

              // Se não há horários selecionados, commit a transação
              if (!times || times.length === 0) {
                  return db.commit(err => {
                      if (err) {
                          return db.rollback(() => {
                              res.status(500).json({ error: 'Erro ao salvar disponibilidade' });
                          });
                      }
                      res.json({ message: 'Disponibilidade atualizada com sucesso' });
                  });
              }

              // Insere os novos horários
              const values = times.map(time => [req.user.id, date, time, 'available']);
              db.query(
                  'INSERT INTO availability (consultor_id, data_disponivel, hora_disponivel, status) VALUES ?',
                  [values],
                  (err) => {
                      if (err) {
                          return db.rollback(() => {
                              res.status(500).json({ error: 'Erro ao salvar disponibilidade' });
                          });
                      }

                      db.commit(err => {
                          if (err) {
                              return db.rollback(() => {
                                  res.status(500).json({ error: 'Erro ao salvar disponibilidade' });
                              });
                          }
                          res.json({ message: 'Disponibilidade salva com sucesso' });
                      });
                  }
              );
          }
      );
  });
});

app.get('/api/consultant/meetings', authenticateToken, (req, res) => {
    const query = `
        SELECT 
            id,
            nome,
            email,
            tipo_servico,
            data_consulta,
            hora_consulta,
            tipo_reuniao,
            descricao,
            valor,
            consultor
        FROM 
            agendamentos
        WHERE 
            consultor = ?
        ORDER BY 
            data_consulta ASC,
            hora_consulta ASC
    `;
    
    db.query(query, [req.user.id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar reuniões:', err);
            return res.status(500).json({ error: 'Erro ao carregar reuniões' });
        }

        // Log para debug
        console.log('ID do Consultor:', req.user.id);
        console.log('Reuniões encontradas:', results);

        res.json(results);
    });
});
// Corrigir a rota de atualização de status para usar mysql
app.put('/api/consultant/meetings/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const query = `
      UPDATE meetings 
      SET status = ? 
      WHERE id = ? AND consultor_id = ? 
  `;
  
  db.query(query, [status, id, req.user.id], (err, result) => {
      if (err) {
          console.error('Erro ao atualizar status:', err);
          return res.status(500).json({ error: 'Erro ao atualizar status da reunião' });
      }
      
      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Reunião não encontrada' });
      }
      
      res.json({ message: 'Status atualizado com sucesso' });
  });
});



// Inicialização do servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
app.get('/api/consultants/count', authenticateToken, (req, res) => {
  db.query('SELECT COUNT(*) as count FROM consultants', (err, results) => {
      if (err) {
          console.error('Erro ao contar consultores:', err);
          return res.status(500).json({ error: 'Erro ao contar consultores' });
      }
      res.json({ count: results[0].count });
  });
});

// Rota para resumo financeiro do período
app.get('/api/payments/summary', authenticateToken, (req, res) => {
  const { start, end } = req.query;
  const query = `
      SELECT 
          COUNT(*) as total_payments,
          SUM(valor_total) as total
      FROM payments 
      WHERE status = 'confirmado'
      AND data_consulta BETWEEN ? AND ?
  `;
  
  db.query(query, [start, end], (err, results) => {
      if (err) {
          console.error('Erro ao buscar resumo financeiro:', err);
          return res.status(500).json({ error: 'Erro ao buscar resumo financeiro' });
      }
      res.json({
          total_payments: results[0].total_payments,
          total: results[0].total || 0
      });
  });
});

// Rota para contar usuários ativos (que têm agendamentos)
app.get('/api/users/active', authenticateToken, (req, res) => {
  const query = `
      SELECT COUNT(DISTINCT email) as count 
      FROM agendamentos 
      WHERE data_consulta >= CURDATE()
  `;
  
  db.query(query, (err, results) => {
      if (err) {
          console.error('Erro ao contar usuários ativos:', err);
          return res.status(500).json({ error: 'Erro ao contar usuários ativos' });
      }
      res.json({ count: results[0].count });
  });
});

// Rota para contar reuniões do mês
app.get('/api/meetings/month-count', authenticateToken, (req, res) => {
  const query = `
      SELECT COUNT(*) as count 
      FROM agendamentos 
      WHERE YEAR(data_consulta) = YEAR(CURRENT_DATE())
      AND MONTH(data_consulta) = MONTH(CURRENT_DATE())
  `;
  
  db.query(query, (err, results) => {
      if (err) {
          console.error('Erro ao contar reuniões:', err);
          return res.status(500).json({ error: 'Erro ao contar reuniões' });
      }
      res.json({ count: results[0].count });
  });
});




// Rota para relatório financeiro por período
app.get('/api/financial/report', authenticateToken, (req, res) => {
  const { start_date, end_date } = req.query;
  const query = `
      SELECT 
          DATE_FORMAT(data_consulta, '%Y-%m') as mes,
          COUNT(*) as total_consultas,
          SUM(valor_total) as receita_total,
          AVG(valor_total) as ticket_medio
      FROM payments
      WHERE status = 'confirmado'
      AND data_consulta BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(data_consulta, '%Y-%m')
      ORDER BY mes DESC
  `;
  
  db.query(query, [start_date, end_date], (err, results) => {
      if (err) {
          console.error('Erro ao gerar relatório financeiro:', err);
          return res.status(500).json({ error: 'Erro ao gerar relatório financeiro' });
      }
      res.json(results);
  });
});

// Rota para listar reuniões no dashboard admin
app.get('/api/meetings/recent', authenticateToken, (req, res) => {
    const query = `
        SELECT 
            a.data_consulta,
            a.hora_consulta,
            a.consultor,
            a.nome as cliente,
            a.tipo_servico,
            a.tipo_reuniao,
            CASE 
                WHEN a.data_consulta > CURDATE() THEN 'Agendada'
                WHEN a.data_consulta = CURDATE() THEN 'Hoje'
                ELSE 'Concluída'
            END as status
        FROM 
            agendamentos a
        WHERE
            a.data_consulta IS NOT NULL
        ORDER BY 
            a.data_consulta DESC, 
            a.hora_consulta DESC
        LIMIT 10
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar reuniões:', err);
            return res.status(500).json({ error: 'Erro ao carregar reuniões' });
        }
        
        // Log para debug
        console.log('Reuniões encontradas:', results);
        
        res.json(results);
    });
});


app.post('/auth/admin', authenticateToken, async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        
        if (!email.endsWith('@admin.com')) {
            return res.status(400).json({ error: 'Email deve terminar com @admin.com' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);
        
        db.query(
            'INSERT INTO users (name, email, password, user_type) VALUES (?, ?, ?, "admin")',
            [nome, email, hashedPassword],
            (err, result) => {
                if (err) {
                    console.error('Erro ao criar administrador:', err);
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: 'Administrador criado com sucesso' });
            }
        );
    } catch (error) {
        console.error('Erro ao criar administrador:', error);
        res.status(500).json({ error: error.message });
    }
});