const mysql = require('mysql2');

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '', // Adicione sua senha, se houver
  database: 'dextrategia',
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err.message);
    return;
  }
  console.log('Conexão com o banco de dados bem-sucedida!');
});

module.exports = db;
